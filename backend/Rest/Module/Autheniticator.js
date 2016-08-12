/**
 * Created by Sarath Kumar on 12-08-2016.
 */
var bcrypt = require('bcryptjs');
var crypto = require('crypto');
var _ = require('underscore');
var Hashids = require("hashids");
var Const = require("../Const");

module.exports = function (req, res,db) {
    if (!_.has(req.body, "email") || !_.has(req.body, "password") || !_.has(req.body, "devid")) {
        res.sendStatus(406);
        return;
    }
    if (req.body.devid.length != 36) {
        res.sendStatus(406);
        return;
    }
    db.users.findOne({
        where: {
            email: req.body.email
        }
    }).then(function (user) {
         if (_.isNull(user)) {
             return;
        }
        var compare = bcrypt.compareSync(req.body.password, user.password_hash);
        if (compare == false) {
            res.sendStatus(403);
            return
        }
        var current_date = (new Date()).valueOf().toString();
        var random = Math.random().toString();
        crypto.createHash('sha1').update(current_date + random).digest('hex');
        var hashids = new Hashids(req.body.devid, 16);
        var uuid = hashids.encode(user.id);
        db.rest_session.findOne({
            where:{
                user_id:user.id
            }
        }).then(function (found) {
             if (found) {
                found.device_android_id = req.body.devid;
                found.uid =uuid;
                found.save().then(function () {
                    res.json({uid:uuid,user:user});
                },function () {
                     res.sendStatus(500);
                })
            }else{
                db.rest_session.create({
                    uid :uuid,
                    user_id :user.id,
                    device_android_id :req.body.devid,
                }).then(function () {
                    res.json({uid:uuid,user:user});
                },function () {
                     res.sendStatus(500);
                })
            }
        }, function (error) {
            res.sendStatus(500);
        })
    }, function (error) {

        res.sendStatus(500);
    })

}