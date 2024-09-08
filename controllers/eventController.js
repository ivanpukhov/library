const { Event, User, UserEvent } = require('../models');
const { Op } = require('sequelize');
const {sendPushNotification} = require("../services/notificationService");


exports.createEvent = async (req, res) => {
    const { name, description, date, type, price, topic } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
        return res.status(404).send('Пользователь не найден.');
    }


    if (type !== 'open' && type !== 'closed') {
        return res.status(400).send('Некорректный тип мероприятия. Допустимые значения: open, closed.');
    }


    if (type === 'closed' && (!price || price <= 0)) {
        return res.status(400).send('Для закрытого мероприятия должна быть указана положительная цена.');
    }


    const event = await Event.create({
        name,
        description,
        date,
        type,
        topic,
        price: type === 'closed' ? price : null,
        createdBy: userId
    });

    res.status(201).json({ message: 'Мероприятие успешно создано.', event });
};


exports.getAllEvents = async (req, res) => {
    try {

        const { date, name } = req.query;


        const filterConditions = {};


        if (date) {
            filterConditions.date = date;
        }


        if (name) {
            filterConditions.name = {
                [Op.like]: `%${name}%`,
            };
        }


        const events = await Event.findAll({
            where: filterConditions,
            include: [
                {
                    model: User,
                    attributes: ['id', 'firstName', 'lastName'],
                    through: { model: UserEvent, attributes: ['createdAt'] }
                }
            ],
            order: [['date', 'ASC']]
        });

        if (events.length === 0) {
            return res.status(404).json({ message: 'Мероприятия не найдены.' });
        }


        res.status(200).json(events);
    } catch (error) {
        console.error('Ошибка при получении мероприятий:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении мероприятий.' });
    }
};


exports.registerForEvent = async (req, res) => {
    const { eventId } = req.body;
    const userId = req.user.id;

    try {
        const event = await Event.findByPk(eventId);
        const user = await User.findByPk(userId);

        if (!event || !user) {
            return res.status(404).send('Мероприятие или пользователь не найдены.');
        }

        // Регистрация пользователя на мероприятие
        await UserEvent.create({ UserId: userId, EventId: eventId });

        // Уведомление о регистрации на мероприятие
        sendPushNotification(user.pushToken, {
            title: 'Регистрация на мероприятие',
            body: `Вы успешно зарегистрировались на мероприятие: ${event.name}`,
        });

        res.status(200).json({ message: 'Вы успешно зарегистрированы на мероприятие.' });
    } catch (error) {
        console.error('Ошибка при регистрации на мероприятие:', error);
        res.status(500).json({ message: 'Произошла ошибка при регистрации на мероприятие.' });
    }
};

const checkUpcomingEvents = async () => {
    const today = new Date();
    const events = await Event.findAll({
        where: {
            date: {
                [Op.between]: [new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
                    new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 3)]
            },
        },
        include: { model: User },
    });

    events.forEach(event => {
        event.Users.forEach(user => {
            sendPushNotification(user.pushToken, {
                title: 'Напоминание о мероприятии',
                body: `Мероприятие "${event.name}" начнётся завтра!`,
            });
        });
    });
};

setInterval(checkUpcomingEvents, 24 * 60 * 60 * 1000);
