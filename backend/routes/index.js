var express = require('express');
var router = express.Router();
var session = require('express-session');
var dbconnect = require('../dbconnect.js');
var mysql = require('mysql');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'ACAPS - Amrita Carpooling system',
        create: true
    });
});

router.get('/account', function (req, res, next) {
    res.render('account', {
        title: 'Create a  new account ',
        create: false
    });
});

router.get('/user/setup', function (req, res, next) {
    res.render('parts/pages/init_setup.ejs', {
        title: 'Setup your account',
        create: false
    });
});


router.get('/login', function (req, res, next) {
    res.render('login', {
        title: 'login to your account',
        create: false
    });
});

//find a ride page
router.get('/find', function (req, res, next) {
    /*dbconnect.connection.query('SELECT * FROM `rides`,`users` where rides.rider_id = ? AND users.id = ?')*/

    //get the list of current 10 rides
    dbconnect.connection.query('SELECT * FROM `rides`,`users` WHERE `rides`.`rider_id`=`users`.`id`',
        function (err, rows, fields) {
            var data = rows;
            console.log(data);
            if (err) throw err;
            else {
                res.render('find', {
                    title: 'Find A Ride',
                    ride_list: data,
                    create:false
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
                        create:false
                    })
                }
            });
    } else {
        res.redirect('/login');
    }
});



module.exports = router;