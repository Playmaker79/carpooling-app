var Sequelize = require('sequelize');
var sequelize = new Sequelize('carpooling', 'arjun','admin', {
    host: 'localhost',
    dialect: 'mysql',
});

var db = {};
db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.users = sequelize.import(__dirname+"/models/users");
module.exports = db;