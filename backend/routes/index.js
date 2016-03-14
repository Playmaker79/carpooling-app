var express = require('express');
var app = express();
var router = express.Router();
var session = require('express-session');
var dbconnect = require('../dbconnect.js');
var mysql = require('mysql');
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'ACAPS - Amrita Carpooling system',
        create: true,
        session: req.session
    });
});

router.get('/account', function (req, res, next) {
    res.render('account', {
        title: 'Create a  new account ',
        create: false,
        session:req.session
    });
});

router.get('/user/setup', function (req, res, next) {
    res.render('parts/pages/init_setup.ejs', {
        title: 'Setup your account',
        create: false,
        session: req.session
    });
});


router.get('/login', function (req, res, next) {
    res.render('login', {
        title: 'login to your account',
        create: true,
        session:req.session
    });
});

//find a ride page
router.get('/find', function (req, res, next) {
    /*dbconnect.connection.query('SELECT * FROM `rides`,`users` where rides.rider_id = ? AND users.id = ?')*/

    //get the list of current 10 rides
    dbconnect.connection.query('SELECT * FROM `rides`,`users` WHERE `rides`.`rider_id`=`users`.`id`',
        function (err, rows, fields) {
            var data = rows;
           // console.log(data);
            if (err) throw err;
            else {
                console.log(req.session);
                res.render('find', {
                    title: 'Find A Ride',
                    ride_list: data,
                    create:false,
                    session:req.session
                });
            }
        });
});



router.get('/offer', function (req, res, next) {
    var sess = req.session;
    if (sess.current_user) {
        var current_user = sess.current_user;
        dbconnect.connection.query('SELECT * FROM `users` WHERE `id` = ?', current_user,
            function (err, rows, fields) {
                if (err) throw err;
                if (!err) {
                    console.log(rows[0]);
                    var data = rows[0];
                    res.render('offer', {
                        title: "Offer a Ride",
                        name: data.name,
                        lastname: data.lastname,
                        email: data.email,
                        occupation: data.occupation,
                        profile_pic: data.profile_pic,
                        create:false,
                        session:req.session
                    })
                }
            });
    } else {
        res.redirect('/login');
    }
});

router.get('/logout', function (req, res, next) {
    req.session.destroy(function(err) {
        res.redirect('/');

        app.use(function(req, res, next){
            res.locals.loggedUserName = null;
            res.locals.loggedUserPic = null;
            next();
        });
    });
});


/*router.get('/printme',function(req,res){
    var result = dbconnect.printme();
    console.log(result);
    res.end();
});*/


router.get('/user/cars',function(req,res){
    var sess = req.session;
    if(sess.current_user){
        var data = dbconnect.getCars(sess.current_user);
        data.then(function(values){
            console.log(values);
            res.send(values);
        });
    }
    else{
        res.status(401).send("oops!! got you.");
    }
});




module.exports = router;