var mysql = require('mysql');
var session = require('express-session');
var db = require('./db');
db.users.sync({force: false});
db.cars.sync({force:false});
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'arjun',
    password: 'admin',
    database: 'carpooling'
});

connection.connect(function (err) {
    if (err) {
        console.error('error connecting:' + err.stack);
        return;
    }
    console.log('connected as id yes' + connection.threadId);
});


exports.createaccount = function (values, password, res, req) {
    sess = req.session;
    var dob = new Date(values.birthdate);
    // console.log(dob);
    var data = {
        name: values.First_name,
        lastname: values.last_name,
        gender: values.gender_select,
        dob: dob,
        email: values.email,
        occupation: values.occupation,
        company: values.company,
        phone: values.phone,
        profile_pic: "none",
        password_hash: password
    }
    var success;
    db.users.create(data).then(function () {
        sess.updateprofile = true;
        res.redirect('/login');
        res.end();
    }, function (err) {
        if (err.name == "SequelizeUniqueConstraintError") {
            res.render('account', {status: 'DuplicateAccount', title: 'Create an Account'});
            res.end();
        }
        else if (err.name == "SequelizeConnectionRefusedError") {
            res.render('account', {status: 'ErrorConnection', title: 'Create an Account'});
            res.end();
        }
    });
    return success
}


exports.uploadprofile = function (path, id, res, sess) {
    var sess = sess;
    connection.query('UPDATE `users` SET  `profile_pic`= ? WHERE id = ?', [path, id],
        function (err, result) {
            if (err) throw err;
            if (!err) {
                res.redirect('/find');
                res.end();
                sess.updateprofile = null;
            } else {
                res.send("some error ocuured");
                res.end();
            }
        });
}


exports.getCars = function(data){
    return db.cars.findAll({where : {owner: data}});
}

exports.GetCurrentProfile = function (req) {
    var sess = req.session;
    if (sess.current_user) {
        connection.query('select * from users where id=?', [sess.current_user],
            function (err, rows, fields) {
                if (err) {
                    throw err;
                }
                if (!err) {
                    return data;
                }
            }
        );
    }
}

exports.addCar = function (file,req,res) {
 var car_photo = file.filename;
    
}
exports.offeraride = function (data, file, req, res) {
    var sess = req.session;
    if (sess.current_user) {
        if (data.drinking == null) {
            data.drinking = 0;
        }
        if (data.smoking == null) {
            data.smoking = 0;
        }
        if (data.music == null) {
            data.music = 0;
        }
        var vehicle_picture = file.filename;
        var current_user = sess.current_user;
        var date_travel = new Date(data.date_travel);
        var date_return = new Date(data.date_return);
        var destination = data.destination.toString();
        var waypts = data.waypts.toString();
        /* console.log(data.travel_date);
         console.log(data.return_date);*/
        var values = [data.source, destination, waypts, date_travel, data.time_travel, data.purpose, date_return, data.time_return, data.vechicle_model, vehicle_picture, data.drinking, data.smoking, data.music, data.gender_select, current_user, data.rider_rate, data.ride_phone];
        console.log("\n the stuff we insterted \n\n");
        console.log(values);
        console.log("\n\n");
        connection.query('INSERT INTO `rides`(`source`, `destination`,`waypoints`,`travel_date`, `travel_time`, `purpose`, `return_date`, `return_time`, `car_name`, `car_photo`, `drinking`, `smoking`, `music`, `passenger`, `rider_id`,`Rate`,`phone`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', values, function (err, result) {
            if (err) throw err;
            if (!err) {
                res.redirect('/find');
            }
        })
    }
}



module.exports.connection = connection;