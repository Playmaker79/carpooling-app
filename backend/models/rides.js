/*model definition for the users table*/

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('rides', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement : true,
            primaryKey:true
        },
        source: {
            type: DataTypes.STRING,
            allowNull: false
        },
        destination: {
            type: DataTypes.STRING,
            allowNull: false
        },
        waypoints: {
            type: DataTypes.STRING,
            allowNull: false
        },
        travel_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        travel_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        purpose: {
            type: DataTypes.STRING,
            allowNull: false
        },
        car_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        drinking: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        smoking: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        music: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        passenger:{
            type:DataTypes.STRING,
            allownull:false
        },
        rider_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references : {
                model: 'users',
                key: 'id'
            }
        },
        Rate:{
            type:DataTypes.STRING,
            allownull:false
        },
        Phone:{
            type:DataTypes.STRING,
            allownull:true
        },
    })
    }
