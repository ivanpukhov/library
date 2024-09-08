const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const UserEvent = sequelize.define('UserEvent', {
    role: { type: DataTypes.STRING, defaultValue: 'participant' }
});

module.exports = UserEvent;
