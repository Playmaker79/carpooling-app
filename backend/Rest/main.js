/**
 * Created by Sarath Kumar on 12-08-2016.
 */
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var _ = require('underscore');
var Hashids = require("hashids");
var Const = require("./Const");


module.exports = function (app, db) {
    require("./middileware/rest_only_check")(app,db);
    
    app.post('/rest/login/', function (req, res) {
      require('./Module/Autheniticator')(req,res,db)
    });

    app.get('/rest/session/ids/',function (req,res) {
res.json(req.user)
    })


}