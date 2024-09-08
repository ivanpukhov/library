// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    phoneNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    balance: { type: DataTypes.INTEGER, defaultValue: 0 },
    role: { type: DataTypes.ENUM('reader', 'librarian'), defaultValue: 'reader' },
    pushToken: { type: DataTypes.STRING, allowNull: true } // добавляем pushToken
});

module.exports = User;
