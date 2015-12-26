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

/*handle account creation */
app.post('/account', function (req, res) {
    var values = req.body;
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
            console.log(rows);
            if (err){
                res.redirect("/test");
                res.end();
            }
            if (!err) {
                password_db =  rows[0].password_hash;
                current_user = rows[0].id;
            }

            /* compare enterd password with hashed password in database*/
            var x = bcrypt.compareSync(password_user,password_db);
            console.log("sync" + x);
            if (x == true) {
                sess = req.session;
                sess.current_user = current_user;

                /*redirect to initial profile pic upload page*/
                if(sess.updateprofile == true && sess.current_user){
                    res.redirect("/user/setup");
                }
                else{
                    res.redirect("/find");
                    res.end();
                }
            }
            else{
                res.redirect("/login");
                res.end();
            }
        }
        //checking the password for now

        //var insert = dbconnect.createaccount(values,password,res);
    );});

//handle profile pic upload 
app.post('/user/setup', profile_pic_location.single('pic'), function (req, res, next){
    sess = req.session;
    
    /*upload profiles only when redirected and or when the user is logged in*/
    /* second param : if the profile is needed to be updated manually*/
    if(sess.current_user&&sess.updateprofile || sess.current_user){
    var current_user = sess.current_user;
    console.log("profile upload");
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
app.post('/offer',vehicle_picture.single('vehicle_picture'), function (req, res, next){
    sess = req.session;
    /*upload car pic only when redirected and or when the user is logged in*/ 
    if(sess.current_user){
    var current_user = sess.current_user;
    var data = req.body;
    console.log(req.body);
    var file = req.file;
        dbconnect.offeraride(data,file,req,res);
    }
    /*if the profile is needed to be updated manually*/
    /*worst case - redirect to login page*/
    else{
        res.redirect('/login');
        res.end();
        console.log(sess);
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
          res.render('find',{title:'Find A Ride',ride_list:data,create:false});
      }
     }
)});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
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