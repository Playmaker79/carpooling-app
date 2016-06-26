var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var mysql = require('mysql');
var dbconnect = require('./dbconnect.js');
var routes = require('./routes/index');
var app = express();
var multer = require('multer');
var session = require('express-session');

var profile_pic_location = multer({
    dest: 'uploads/profile_pics/',
    limits: {
        fileSize: 1000000,
        files: 1
    }
});

var vehicle_picture = multer({
    dest: 'uploads/car_pics/',
    limits: {
        fileSize: 1000000,
        files: 1
    }
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(cookieParser());
app.use(session({secret: 'qwerty124',
                 resave: true,
                 saveUninitialized: true
                }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('uploads/profile_pics'));
app.use(express.static('uploads/car_pics'));

/*routes*/
app.use('/', routes);
app.use('/account', routes);
app.use('/user/setup', routes);
app.use('/login', routes);
app.use('/find',routes);
app.use('/offer',routes);
app.use('/logout',routes);


/*generate menu view for current user globally accesible in all pages wherever the user is logged in*/

/*handle account creation */
app.post('/account', function (req, res) {
    var values = req.body;
    console.log(req.body);
    //db_connect.insertdata(values);
    var password_salt = bcrypt.genSaltSync(10);
    var password = bcrypt.hashSync(values.password, password_salt);
    //console.log(values.password_salt);
    //console.log(values.password);    
    var insert = dbconnect.createaccount(values, password,res,req);
});



/*handle login page*/
/*handle login page*/
app.post('/login', function (req, res){
    var values = req.body;
    var password_db;
    var password_user = values.password;
    var current_user;
    //console.log("bcr" + bcrypt);
    dbconnect.connection.query('SELECT * FROM `users` WHERE `email`=?', [values.email],
        function (err, rows, fields) {
            console.log(rows+"\n");
            if (err){
                res.render("login", {create: false, title: 'Login to your Account', status: 'serviceError'});
                res.end();
            }
            else if (!err) {
                if (rows.length == 0) {
                    /*when an account is not found*/
                    res.render("login", {create: false, title: 'Login to your Account', status: 'invalidAccount'});
                    res.end();
                }
                else {
                    password_db = rows[0].password_hash;
                    current_user = rows[0].id;

                    /* compare enterd password with hashed password in database*/
                    var x = bcrypt.compareSync(password_user, password_db);
                    if (x == true) {
                        sess = req.session;
                        sess.current_user = current_user;
                        sess.loggedUsername = rows[0].name;
                        sess.loggedUserPic = rows[0].profile_pic;
                        console.log(sess.loggedUserPic);

                        /*redirect to initial profile pic upload page*/
                        if (sess.updateprofile == true && sess.current_user) {
                            res.redirect("/user/setup");
                        }
                        else {
                            res.redirect("/find");
                            res.end();
                        }
                    }
                    else {
                        res.render("login", {create: false, title: 'Login to your Account', status: 'invalidAccount'});
                        res.end();
                    }
                }
            }
        }
        //checking the password for now

        //var insert = dbconnect.createaccount(values,password,res);
    );});

//handle profile pic upload 
app.post('/user/setup', profile_pic_location.single('pic'), function (req, res, next){
    console.log(app.locals.loggedUserName);
    sess = req.session;
    
    /*upload profiles only when redirected and or when the user is logged in*/
    /* second param : if the profile is needed to be updated manually*/
    if(sess.current_user&&sess.updateprofile || sess.current_user){
    var current_user = sess.current_user;
    console.log(req.file.filename);
    console.log(req.file.destination);
    var filepath = req.file.filename;
    console.log(filepath);
    dbconnect.uploadprofile(filepath,current_user,res,sess);
    }
    /*worst case - redirect to login page*/
    else{
        res.redirect('/login');
        res.end();
        console.log(sess);
    }
    });

//offer a ride

//handle offer a ride
app.post('/offer', function (req, res,next){
    sess = req.session;
    /*upload car pic only when redirected and or when the user is logged in*/ 
    if(sess.current_user){
    var current_user = req.session.current_user
    var data = req.body;
    console.log(req.body);
        dbconnect.offeraride(data,req,res);
    }
    /*if the profile is needed to be updated manually*/
    /*worst case - redirect to login page*/
    else{
        res.redirect('/login');
    }
    });


app.post('/addCar',vehicle_picture.single('vehicle_picture'), function(req,res){
    console.log(req.file);
    if(req.session.current_user){
        console.log("here");
        var data  = {
            model: req.body.vehicle_model,
            manufacturer: req.body.company,
            regnumber:req.body.regNo,
            owner: req.session.current_user,
            photo: req.file.filename
        }
        dbconnect.addCar(data).then(function (data) {
            res.status(201).send();
        }, function (error) {
            if(error.name == "SequelizeUniqueConstraintError"){
                res.status(409).send();
            }
        });
    }
    else{
        res.status(401).send("Unauthorized");
    }
});


app.post('/settings', function (req,res) {
        if(req.session.current_user){
            var values = req.body;
            var data = {
                name: values.First_name,
                lastname: values.last_name,
                gender: values.gender_select,
                email: values.email,
                occupation: values.occupation,
                company: values.company,
                phone: values.phone,
            }
           dbconnect.updateUser(data,req.session.current_user).then(function (data) {
               dbconnect.getUser(req.session.current_user).then(function (data) {
                   res.render('Settings', {
                       title: 'Account settings',
                       create: false,
                       session:req.session,
                       userData:data,
                       status:'dataUpdated'
                   });
               }, function (err) {
                   res.render('/login');
               })
           }, function (err) {
               console.log(err);
           })
        }
});



//search for rides
app.post('/find', function (req, res){
    var source = req.body.from_location.toString();
    source = source.split(',');
    var  destination = req.body.to_location.toString();
    destination = destination.split(',');
    source = "%"+source[0]+"%";
    destination = "%"+destination[0]+"%";
    var query = [source,destination];
    console.log(query);
dbconnect.connection.query('select * from rides,users WHERE `rides`.`source` LIKE ? AND `rides`.`destination` LIKE ? and rides.rider_id = users.id',query,function (err, rows, fields) {
      if(err) {
          res.redirect("/find");
          throw err
      }
      if(!err){
          var data = rows;
          console.log(rows.length);
          console.log("\n no error");
          res.render('find',{title:'Find A Ride',ride_list:data,create:false,session:req.session});
      }
     }
)});



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Founds');
    err.status = 404;
    res.render('404.ejs',{
        title: 'Oops! 404 ',
        create: false,
        session:req.session
    });
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        console.log(err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}



// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
         res.render('error',{
        message: err.message,
        error: {}
            });
});





module.exports = app;