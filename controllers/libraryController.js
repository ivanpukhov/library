
const { User, Book, UserBook } = require('../models');
const { Op } = require('sequelize');
const {sendPushNotification} = require("../services/notificationService");

exports.issueBook = async (req, res) => {
    const { userId, bookId, dueDate } = req.body;

    const user = await User.findByPk(userId);
    const book = await Book.findByPk(bookId);

    if (!user || !book) return res.status(404).send('Пользователь или книга не найдены.');


    await user.addBook(book, { through: { dueDate, issueDate: new Date() } });

    res.status(201).send('Книга выдана пользователю.');
};

exports.getIssuedBooks = async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        include: { model: Book, through: { attributes: ['dueDate', 'issueDate', 'returnDate'] } },
    });

    if (!user) return res.status(404).send('Пользователь не найден.');
    res.json(user.Books);
};


exports.returnBook = async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user.id;

    try {
        const userBook = await UserBook.findOne({ where: { userId, bookId } });

        if (!userBook) {
            return res.status(404).json({ message: 'Книга не найдена для данного пользователя.' });
        }


        userBook.returnDate = new Date();
        await userBook.save();

        res.status(200).json({ message: 'Книга успешно возвращена.' });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при возврате книги.', error });
    }
};

exports.issueBook = async (req, res) => {
    const {userId, bookId, dueDate} = req.body;

    const user = await User.findByPk(userId);
    const book = await Book.findByPk(bookId);

    if (!user || !book) return res.status(404).send('Пользователь или книга не найдены.');

    await user.addBook(book, {through: {dueDate}});

    res.status(201).send('Книга выдана пользователю.');
};

exports.blockRenewal = async (req, res) => {
    const {bookId, userId, blockUntil} = req.body;

    try {
        const userBook = await UserBook.findOne({where: {userId, bookId}});

        if (!userBook) {
            return res.status(404).json({message: 'Книга не найдена для данного пользователя.'});
        }

        userBook.renewalBlockedUntil = new Date(blockUntil);
        await userBook.save();

        res.status(200).json({message: 'Продление книги заблокировано до ' + blockUntil});
    } catch (error) {
        res.status(500).json({message: 'Ошибка при блокировке продления.', error});
    }
};

exports.getStatistics = async (req, res) => {
    const totalBooksIssued = await UserBook.count();
    const overdueBooks = await UserBook.count({
        where: {
            dueDate: {
                [Op.lt]: new Date(),
            },
        },
    });

    res.status(200).json({totalBooksIssued, overdueBooks});
};

exports.getIssuedBooks = async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        include: {model: Book, through: {attributes: ['dueDate']}},
    });

    if (!user) return res.status(404).send('Пользователь не найден.');
    res.json(user.Books);
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'email', 'role'],
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({message: 'Ошибка при получении списка пользователей.', error});
    }
};

exports.getUserBooks = async (req, res) => {
    const {userId} = req.params;
    try {
        const user = await User.findByPk(userId, {
            include: {
                model: Book,
                through: {attributes: ['dueDate']},
            },
        });

        if (!user) {
            return res.status(404).json({message: 'Пользователь не найден.'});
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({message: 'Ошибка при получении книг пользователя.', error});
    }
};

exports.requestRenewal = async (req, res) => {
    const { bookId, days } = req.body;
    const userId = req.user.id;

    try {
        const userBook = await UserBook.findOne({ where: { userId, bookId } });

        if (!userBook) {
            return res.status(404).json({ message: 'Книга не найдена для данного пользователя.' });
        }

        if (userBook.renewals >= 2) {
            return res.status(403).json({ message: 'Превышено количество допустимых продлений.' });
        }

        const newDueDate = new Date(userBook.dueDate);
        newDueDate.setDate(newDueDate.getDate() + days);
        userBook.dueDate = newDueDate;
        userBook.renewals += 1;
        await userBook.save();

        // Отправляем уведомление о продлении
        const user = await User.findByPk(userId);
        sendPushNotification(user.pushToken, {
            title: 'Книга продлена',
            body: `Книга успешно продлена на ${days} дней. Новый срок возврата: ${newDueDate.toDateString()}`,
        });

        res.status(200).json({ message: `Книга успешно продлена на ${days} дней.` });
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при продлении книги.', error });
    }
};

exports.getIssuedBooks = async (req, res) => {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
        include: {
            model: Book,
            through: {
                attributes: ['dueDate', 'issueDate', 'returnDate'],
            },
        },
    });

    if (!user) {
        return res.status(404).send('Пользователь не найден.');
    }

    res.json(user.Books);
};
