/**
 * Created by Sarath Kumar on 12-08-2016.
 */
var bcrypt = require('bcryptjs');
var Const = require("../Const");
var Hashids = require("hashids");
var _ = require('underscore');
module.exports = function (app, db) {
    app.use('/rest/session/', function (req, res, next) {
        //Checking required Headers are present
        if (_.isEmpty(req.header('ACAPS_SSID')) || _.isEmpty(req.header('DEV_ID'))) {
            res.sendStatus(417);
             return
        }
        //Checking required Headers are present
        if (req.header('ACAPS_SSID').length != 16 || req.header('DEV_ID').length != 36) {
            res.sendStatus(406);
            return
        }
        //Checking session state
        db.rest_session.findOne({
            where: {
                device_android_id: req.header('DEV_ID'),
                uid: req.header('ACAPS_SSID')
            }
        }).then(function (device_session) {
             if (device_session) {
                 //Hash-id instance from current device ID
                var hashids = new Hashids(device_session.device_android_id, 16);
                 //trying to decode id from session hash-id
                 var id = hashids.decode(req.header('ACAPS_SSID'))[0];
                if (id) {
                     //Checking the User exist on DB with Primary id
                     db.users.findById(id).then(function (user) {
                        if (user) {
                            req.user = user;
                            //Existence confirmed moving to route handler
                            next();
                            return;
                        } else {
                            //Existence failed returning 401
                            res.sendStatus(401);
                            return;
                        }
                    }, function (error) {
                         //Existence check failed returning 401
                         res.sendStatus(401);
                    })
                }
            }else{
                 //Session not found
                 res.sendStatus(401);

            }
        }, function (error) {
            //Checking session error
            console.error(error);
            res.sendStatus(401);
        })

    });
}