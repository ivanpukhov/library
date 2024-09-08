const { DataTypes, Model} = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const UserClub = require('./UserClub');  

const Club = sequelize.define('Club', {
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    adminId: { type: DataTypes.INTEGER, allowNull: false }
});


module.exports = Club;
