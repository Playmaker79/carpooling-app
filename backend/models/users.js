/*model definition for the users table*/

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('users', {
        name: {
            type: DataTypes.INTEGER,
            autoIncrement : true,
            primary:true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastname: {
            type: DataTypes.STRING,
            allowNull: false
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dob: {
            type: DataTypes.DATE,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        occupation: {
            type: DataTypes.STRING,
            allowNull: false
        },
        company:{
            type: DataTypes.STRING,
            allowNull:false
        },
        phone:{
            type: DataTypes.STRING,
            allowNull:false
        },
        profile_pic: {
            type: DataTypes.STRING,
            allowNull: false
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },{
        timestamps: false
    });
}

