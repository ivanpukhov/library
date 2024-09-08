const { Event, User, UserEvent } = require('../models');
const { Op } = require('sequelize');


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
        const event = await Event.findByPk(eventId, {
            include: {
                model: User,
                where: { id: userId },
                required: false
            }
        });

        const user = await User.findByPk(userId);

        if (!event || !user) {
            return res.status(404).send('Мероприятие или пользователь не найдены.');
        }

        
        const isRegistered = event.Users && event.Users.length > 0;
        if (isRegistered) {
            return res.status(400).json({ message: 'Вы уже зарегистрированы на это мероприятие.' });
        }

        
        if (event.type === 'closed' && user.balance < event.price) {
            return res.status(400).send('Недостаточно средств на балансе.');
        }

        
        if (event.type === 'closed') {
            user.balance -= event.price / 2;
            await user.save();
        }

        
        await UserEvent.create({
            UserId: userId,
            EventId: eventId
        });

        res.status(200).send('Пользователь успешно зарегистрирован на мероприятие.');
    } catch (error) {
        console.error('Ошибка при регистрации на мероприятие:', error);
        res.status(500).json({ message: 'Произошла ошибка при регистрации на мероприятие.' });
    }
};
