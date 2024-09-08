const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define('Book', {
    title: { type: DataTypes.STRING, allowNull: false },
    author: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    number: { type: DataTypes.STRING, allowNull: false, unique: true },
    link: { type: DataTypes.STRING, allowNull: false },
    keywords: {
        type: DataTypes.STRING, 
        get() {
            const rawValue = this.getDataValue('keywords');
            return rawValue ? rawValue.split(',') : [];
        },
        set(value) {
            this.setDataValue('keywords', value.join(','));
        }
    }
});

module.exports = Book;
