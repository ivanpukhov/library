const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserClubEvents = sequelize.define('UserClubEvents', {
    
    role: { type: DataTypes.STRING, defaultValue: 'participant' }
});

module.exports = UserClubEvents;
