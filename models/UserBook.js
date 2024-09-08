const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Book = require('./Book');

const UserBook = sequelize.define('UserBook', {
    dueDate: { type: DataTypes.DATE, allowNull: false },  
    renewals: { type: DataTypes.INTEGER, defaultValue: 0 },  
    renewalBlockedUntil: { type: DataTypes.DATE, allowNull: true },  
    issueDate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },  
    returnDate: { type: DataTypes.DATE, allowNull: true }  
});

User.belongsToMany(Book, { through: UserBook });
Book.belongsToMany(User, { through: UserBook });

module.exports = UserBook;
