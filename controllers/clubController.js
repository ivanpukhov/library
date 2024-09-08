const { Club, ClubMessage, ClubEvent, ClubEvents, Duel, Book, ClubNews, User, UserClub, UserClubEvents} = require('../models');
const {sendPushNotification} = require("../services/notificationService");


exports.createClub = async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (user.balance < 1000) {
        return res.status(400).json({ message: 'Недостаточно средств для создания клуба.' });
    }

    user.balance -= 1000;
    await user.save();

    const club = await Club.create({
        name,
        description,
        adminId: user.id,
    });


    await UserClub.create({ UserId: user.id, ClubId: club.id });

    res.status(201).json({ message: 'Клуб успешно создан.', club });
};


exports.joinClub = async (req, res) => {
    const userId = req.user.id;
    const { clubId } = req.body;

    const club = await Club.findByPk(clubId);
    const user = await User.findByPk(userId);

    if (!club) {
        return res.status(404).json({ message: 'Клуб не найден.' });
    }

    if (user.balance < 500) {
        return res.status(400).json({ message: 'Недостаточно средств для вступления в клуб.' });
    }


    const userInClub = await UserClub.findOne({ where: { UserId: userId, ClubId: clubId } });
    if (userInClub) {
        return res.status(400).json({ message: 'Вы уже состоите в этом клубе.' });
    }

    user.balance -= 500;
    await user.save();
    await club.addUser(user);

    res.status(200).json({ message: 'Вы успешно вступили в клуб.', club });
};


exports.sendMessage = async (req, res) => {
    const { content } = req.body;
    const { clubId } = req.params;
    const userId = req.user.id;

    const userInClub = await UserClub.findOne({ where: { UserId: userId, ClubId: clubId } });
    if (!userInClub) {
        return res.status(403).json({ message: 'Вы не состоите в этом клубе.' });
    }

    const message = await ClubMessage.create({
        content,
        UserId: userId,
        ClubId: clubId,
    });

    // Отправляем уведомления всем участникам клуба
    const clubMembers = await UserClub.findAll({ where: { ClubId: clubId }, include: User });
    clubMembers.forEach(({ User }) => {
        sendPushNotification(User.pushToken, {
            title: 'Новое сообщение в клубе',
            body: 'Новое сообщение в вашем клубе.',
        });
    });

    res.status(201).json({ message: 'Сообщение отправлено.', message });
};


exports.getMessages = async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user.id;

    const userInClub = await UserClub.findOne({ where: { UserId: userId, ClubId: clubId } });
    if (!userInClub) {
        return res.status(403).json({ message: 'Вы не состоите в этом клубе.' });
    }

    const messages = await ClubMessage.findAll({
        where: { ClubId: clubId },
        include: User,
        order: [['createdAt', 'ASC']],
    });

    res.json(messages);
};


exports.addClubNews = async (req, res) => {
    const { title, content, clubId } = req.body;
    const userId = req.user.id;

    const club = await Club.findByPk(clubId);
    if (!club || club.adminId !== userId) {
        return res.status(403).json({ message: 'Вы не являетесь администратором этого клуба.' });
    }

    const news = await ClubNews.create({
        title,
        content,
        ClubId: club.id,
    });

    // Уведомляем участников клуба о новой новости
    const clubMembers = await UserClub.findAll({ where: { ClubId: clubId }, include: User });
    clubMembers.forEach(({ User }) => {
        sendPushNotification(User.pushToken, {
            title: 'Новая новость в клубе',
            body: `Новая новость: ${title}`,
        });
    });

    res.status(201).json({ message: 'Новость успешно добавлена.', news });
};


exports.getClubNews = async (req, res) => {
    const { clubId } = req.params;
    const userId = req.user.id;

    const userInClub = await UserClub.findOne({ where: { UserId: userId, ClubId: clubId } });
    if (!userInClub) {
        return res.status(403).json({ message: 'Вы не состоите в этом клубе.' });
    }

    const news = await ClubNews.findAll({ where: { ClubId: clubId } });

    res.json(news);
};


exports.createClubEvent = async (req, res) => {
    const { name, topic, date, type, price } = req.body;
    const userId = req.user.id;
    const clubId = req.params.clubId;
    console.log(clubId)
    const club = await Club.findByPk(clubId);

    if (!club || club.adminId !== userId) {
        return res.status(403).json({ message: 'Вы не являетесь администратором этого клуба.' });
    }

    const event = await ClubEvent.create({
        name,
        topic,
        date,
        type,
        price: type === 'closed' ? price : null,
        ClubId: club.id,
    });

    res.status(201).json({ message: 'Мероприятие для клуба успешно создано.', event });
};


exports.registerForClubEvent = async (req, res) => {
    const { eventId } = req.body;
    const userId = req.user.id;
    const clubId = req.params.clubId;

    try {

        const event = await ClubEvent.findByPk(eventId, {
            include: {
                model: User,
                where: { id: userId },
                required: false
            }
        });


        if (!event) {
            return res.status(404).json({ message: 'Мероприятие не найдено.' });
        }


        const isRegistered = event.Users && event.Users.length > 0;
        if (isRegistered) {
            return res.status(400).json({ message: 'Вы уже зарегистрированы на это мероприятие.' });
        }


        await UserClubEvents.create({
            UserId: userId,
            ClubEventId: eventId
        });

        res.status(200).json({ message: 'Вы успешно зарегистрированы на мероприятие.' });
    } catch (error) {
        console.error('Ошибка при регистрации на мероприятие:', error);
        res.status(500).json({ message: 'Произошла ошибка при регистрации на мероприятие.' });
    }
};


exports.getTopClubs = async (req, res) => {
    const clubs = await Club.findAll({
        order: [['balance', 'DESC']],
        limit: 10,
    });

    res.json(clubs);
};

exports.getClubProfile = async (req, res) => {
    try {
        const { clubId } = req.params;
        const userId = req.user.id;


        const userInClub = await User.findOne({
            where: { id: userId },
            include: {
                model: Club,
                where: { id: clubId }
            }
        });

        if (!userInClub) {
            return res.status(403).json({ message: 'Вы не состоите в этом клубе.' });
        }


        const club = await Club.findByPk(clubId, {
            include: [
                {
                    model: ClubNews,
                    attributes: ['id', 'title', 'content', 'createdAt']
                },
                {
                    model: ClubMessage,
                    attributes: ['id', 'content', 'createdAt'],
                    include: {
                        model: User,
                        attributes: ['id', 'firstName', 'lastName']
                    }
                },
                {
                    model: ClubEvent,
                    attributes: ['id', 'name', 'topic', 'date', 'type', 'price'],
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'firstName', 'lastName']
                        }
                    ]
                },
                {
                    model: Duel,
                    attributes: ['id', 'challengerId', 'opponentId', 'stake', 'status', 'winnerId'],
                    include: [
                        {
                            model: User, as: 'challenger',
                            attributes: ['id', 'firstName', 'lastName']
                        },
                        {
                            model: User, as: 'opponent',
                            attributes: ['id', 'firstName', 'lastName']
                        },
                        {
                            model: Book,
                            attributes: ['id', 'title']
                        }
                    ]
                }
            ]
        });

        if (!club) {
            return res.status(404).json({ message: 'Клуб не найден.' });
        }


        const clubProfile = {
            id: club.id,
            name: club.name,
            description: club.description,
            news: club.ClubNews.map(news => ({
                id: news.id,
                title: news.title,
                content: news.content,
                createdAt: news.createdAt
            })),
            messages: club.ClubMessages.map(message => ({
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                user: {
                    id: message.User.id,
                    firstName: message.User.firstName,
                    lastName: message.User.lastName
                }
            })),
            events: club.ClubEvents.map(event => ({
                id: event.id,
                name: event.name,
                topic: event.topic,
                date: event.date,
                type: event.type,
                price: event.price,
                participants: event.Users.map(user => ({
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName
                }))
            })),
            duels: club.Duels.map(duel => ({
                id: duel.id,
                stake: duel.stake,
                status: duel.status,
                challenger: {
                    id: duel.challenger.id,
                    firstName: duel.challenger.firstName,
                    lastName: duel.challenger.lastName
                },
                opponent: duel.opponent ? {
                    id: duel.opponent.id,
                    firstName: duel.opponent.firstName,
                    lastName: duel.opponent.lastName
                } : null,
                book: {
                    id: duel.Book.id,
                    title: duel.Book.title
                },
                winnerId: duel.winnerId
            }))
        };


        res.status(200).json(clubProfile);
    } catch (error) {
        console.error('Ошибка при получении профиля клуба:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении профиля клуба.' });
    }
};

exports.getAllClubEvents = async (req, res) => {
    try {

        const events = await ClubEvent.findAll({
            include: {
                model: Club,
                attributes: ['id', 'name']
            },
            order: [['date', 'ASC']]
        });

        if (events.length === 0) {
            return res.status(404).json({ message: 'Клубные мероприятия не найдены.' });
        }


        res.status(200).json(events);
    } catch (error) {
        console.error('Ошибка при получении клубных мероприятий:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении клубных мероприятий.' });
    }
};

exports.getMyClubs = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findByPk(userId, {
            include: {
                model: Club,
                through: {
                    attributes: []
                },
                attributes: ['id', 'name', 'description']
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден.' });
        }

        res.status(200).json(user.Clubs);
    } catch (error) {
        console.error('Ошибка при получении клубов пользователя:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении клубов.' });
    }
};
