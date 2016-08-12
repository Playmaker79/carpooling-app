var Sequelize = require('sequelize');
var config = require('./config/config');
var sequelize = new Sequelize(config.appDb.database,config.appDb.user,config.appDb.password, {
    host:config.appDb.host,
    dialect: 'mysql'
});

var db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.users = sequelize.import(__dirname+"/models/users");
db.cars = sequelize.import(__dirname+"/models/cars");
db.rides = sequelize.import(__dirname+"/models/rides");
db.rest_session = db.sequelize.import(__dirname + "/Rest/models/sessions");

module.exports = db;
