const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Club = require('./Club');

const ClubNews = sequelize.define('ClubNews', {
    title: { type: DataTypes.STRING, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

ClubNews.belongsTo(Club);  

module.exports = ClubNews;
