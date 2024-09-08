const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
    name: { type: DataTypes.STRING, allowNull: false },
    topic: { type: DataTypes.STRING, allowNull: false },
    date: { type: DataTypes.DATE, allowNull: false },
    type: { type: DataTypes.ENUM('open', 'closed'), allowNull: false },
    price: { type: DataTypes.INTEGER, allowNull: true },  
});



module.exports = Event;
