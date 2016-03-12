/**
 * Created by Arjun on 3/11/2016.
 */

/*model definition for the users table*/

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('cars', {
        model: {
            type: DataTypes.STRING,
            allowNull: false
        },
        manufacturer: {
            type: DataTypes.STRING,
            allowNull: false
        },
        regnumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique:true
        },
        owner: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references : {
                model: 'users',
                key: 'id'
            }
        },
        photo: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },{
        timestamps: true
    });
}

