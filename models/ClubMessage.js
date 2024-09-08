const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Club = require('./Club');

const ClubMessage = sequelize.define('ClubMessage', {
    content: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

ClubMessage.belongsTo(User);  
ClubMessage.belongsTo(Club);  

module.exports = ClubMessage;
