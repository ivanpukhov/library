const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Duel = sequelize.define('Duel', {
    challengerId: { type: DataTypes.INTEGER, allowNull: false },
    opponentId: { type: DataTypes.INTEGER, allowNull: true },
    bookId: { type: DataTypes.INTEGER, allowNull: false },
    stake: { type: DataTypes.INTEGER, allowNull: false },
    clubId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed'), defaultValue: 'pending' },
    challengerScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    opponentScore: { type: DataTypes.INTEGER, defaultValue: 0 },
    winnerId: { type: DataTypes.INTEGER, allowNull: true },
    questions: { type: DataTypes.JSON, allowNull: false },  
});

module.exports = Duel;
