/*model definition for the users table*/

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('devices_sessions', {
        uid: {
            type: DataTypes.STRING,
            allowNull: false
        },
        device_android_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },

    });
}

