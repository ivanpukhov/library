const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Club = require('./Club');

const ClubEvent = sequelize.define('ClubEvent', {
    name: { type: DataTypes.STRING, allowNull: false },
    topic: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    type: { type: DataTypes.ENUM('open', 'closed'), allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: true },  
});

ClubEvent.belongsTo(Club);  

module.exports = ClubEvent;
