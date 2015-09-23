var express = require('express');
var find = express.Router();
var session = require('express-session');

find.get('/find', function(req, res, next) {
    sess = req.session;
    console.log("its got");
    if(sess.current_user){
        var current_user = sess.current_user;
     var user_data = dbconnect.getuserdata(current_user);  !!! important
     res.render('find', { title: 'Find a ride'});
    }
    else{
        res.redirect("/login");
    }
});
module.exports = find;