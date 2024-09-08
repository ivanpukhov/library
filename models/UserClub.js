const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserClub = sequelize.define('UserClub', {
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'member'
    }
});

module.exports = UserClub;
