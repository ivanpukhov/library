const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Book, Club, UserClub, ClubMessage, UserClubEvents, ClubEvent, ClubNews, UserBook, Event, UserEvent, Duel} = require('../models');
const {Op} = require("sequelize");
const {sendPushNotification} = require("../services/notificationService");



exports.register = async (req, res) => {
    const { firstName, lastName, phoneNumber, email, password, role, pushToken } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const newUser = await User.create({
            firstName,
            lastName,
            phoneNumber,
            email,
            password: hashedPassword,
            role,
            pushToken
        });

        const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Уведомление об успешной регистрации
        sendPushNotification(pushToken, {
            title: 'Добро пожаловать!',
            body: 'Регистрация прошла успешно. Добро пожаловать в библиотеку!',
        });

        res.status(201).json({
            message: 'Пользователь успешно зарегистрирован и авторизован',
            token,
        });
    } catch (err) {
        res.status(400).json({ message: 'Ошибка регистрации', error: err });
    }
};

exports.login = async (req, res) => {
    const { email, password, pushToken } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).send('Неверный email или пароль.');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('Неверный email или пароль.');

        // Обновляем pushToken при авторизации
        if (pushToken) {
            user.pushToken = pushToken;
            await user.save();
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

        // Уведомление о успешной авторизации
        sendPushNotification(pushToken, {
            title: 'Вы успешно авторизованы!',
            body: 'Добро пожаловать обратно!',
        });

        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Ошибка авторизации', error: err });
    }
};



exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'email', 'role', 'balance'],
            include: [
                {
                    model: Book,
                    through: { attributes: ['dueDate', 'renewals', 'returnDate'] },
                    attributes: ['id', 'title', 'author']
                },
                {
                    model: Club,
                    attributes: ['id', 'name', 'description'],
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
                                    attributes: ['id', 'firstName', 'lastName'],
                                    through: {
                                        model: UserClubEvents,
                                        attributes: ['createdAt']
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Duel,
                    as: 'challengedDuels',
                    attributes: ['id', 'status', 'stake', 'challengerScore', 'opponentScore', 'winnerId'],
                    include: [
                        {
                            model: Book,
                            attributes: ['title']
                        },
                        {
                            model: User,
                            as: 'opponent',
                            attributes: ['firstName', 'lastName']
                        }
                    ]
                },
                {
                    model: Duel,
                    as: 'opponentDuels',
                    attributes: ['id', 'status', 'stake', 'challengerScore', 'opponentScore', 'winnerId'],
                    include: [
                        {
                            model: Book,
                            attributes: ['title']
                        },
                        {
                            model: User,
                            as: 'challenger',
                            attributes: ['firstName', 'lastName']
                        }
                    ]
                },
                {
                    model: Event,
                    attributes: ['id', 'name', 'topic', 'date', 'type', 'price'],
                    include: [
                        {
                            model: User,
                            attributes: ['id', 'firstName', 'lastName'],
                            through: {
                                model: UserEvent,
                                attributes: ['createdAt']
                            }
                        }
                    ]
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден.' });
        }


        const pendingDuels = await Duel.findAll({
            where: {
                clubId: {
                    [Op.in]: user.Clubs.map(club => club.id)
                },
                status: 'pending'
            },
            include: [
                {
                    model: User,
                    as: 'challenger',
                    attributes: ['firstName', 'lastName']
                },
                {
                    model: Book,
                    attributes: ['title']
                }
            ]
        });


        const profile = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            email: user.email,
            role: user.role,
            balance: user.balance,
            books: user.Books.map(book => ({
                id: book.id,
                title: book.title,
                author: book.author,
                dueDate: book.UserBook.dueDate,
                renewals: book.UserBook.renewals,
                returnDate: book.UserBook.returnDate
            })),
            clubs: user.Clubs.map(club => ({
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
                }))
            })),
            duels: {
                challenged: user.challengedDuels.map(duel => ({
                    id: duel.id,
                    book: duel.Book.title,
                    stake: duel.stake,
                    status: duel.status,
                    challengerScore: duel.challengerScore,
                    opponentScore: duel.opponentScore,
                    opponent: duel.opponent ? `${duel.opponent.firstName} ${duel.opponent.lastName}` : null,
                    winnerId: duel.winnerId
                })),
                opponent: user.opponentDuels.map(duel => ({
                    id: duel.id,
                    book: duel.Book.title,
                    stake: duel.stake,
                    status: duel.status,
                    challengerScore: duel.challengerScore,
                    opponentScore: duel.opponentScore,
                    challenger: duel.challenger ? `${duel.challenger.firstName} ${duel.challenger.lastName}` : null,
                    winnerId: duel.winnerId
                })),
                pending: pendingDuels.map(duel => ({
                    id: duel.id,
                    book: duel.Book.title,
                    stake: duel.stake,
                    challenger: `${duel.challenger.firstName} ${duel.challenger.lastName}`
                }))
            },
            events: user.Events.map(event => ({
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
            }))
        };


        res.status(200).json(profile);
    } catch (error) {
        console.error('Ошибка при получении профиля пользователя:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении профиля пользователя.' });
    }
};


exports.getBooksHistory = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findByPk(userId, {
            include: {
                model: Book,
                through: {
                    attributes: ['dueDate', 'issueDate', 'returnDate']
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'Пользователь не найден.' });
        }

        res.json(user.Books);
    } catch (error) {
        console.error('Ошибка при получении истории книг пользователя:', error);
        res.status(500).json({ message: 'Произошла ошибка при получении истории книг.' });
    }
};
