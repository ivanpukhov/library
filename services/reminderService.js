// services/reminderService.js
const { UserBook, User } = require('../models');
const { sendPushNotification } = require('./notificationService');
const { Op } = require('sequelize');

const checkDueDates = async () => {
    const today = new Date();
    const reminders = await UserBook.findAll({
        where: {
            dueDate: {
                [Op.between]: [new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3)]
            },
            returnDate: null, // Только для книг, которые ещё не возвращены
        },
        include: { model: User }
    });

    for (const reminder of reminders) {
        const daysRemaining = Math.ceil((new Date(reminder.dueDate) - today) / (1000 * 60 * 60 * 24));
        const message = daysRemaining === 1
            ? 'Срок возврата книги истекает завтра!'
            : `До возврата книги осталось ${daysRemaining} дня(ей).`;

        sendPushNotification(reminder.User.pushToken, {
            title: 'Напоминание о возврате книги',
            body: message,
        });
    }
};

module.exports = { checkDueDates };
