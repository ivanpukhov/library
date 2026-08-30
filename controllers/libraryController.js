const { Op } = require('sequelize');

const { Book, User, UserBook } = require('../models');
const { sendPushNotification } = require('../services/notificationService');

const loanWhere = (userId, bookId) => ({ UserId: userId, BookId: bookId });

exports.issueBook = async (req, res) => {
    const { userId, bookId, dueDate } = req.body;
    const parsedDueDate = new Date(dueDate);

    if (!userId || !bookId || Number.isNaN(parsedDueDate.getTime()) || parsedDueDate <= new Date()) {
        return res.status(400).json({ message: 'Укажите пользователя, книгу и будущую дату возврата.' });
    }

    const [user, book] = await Promise.all([User.findByPk(userId), Book.findByPk(bookId)]);
    if (!user || !book) {
        return res.status(404).json({ message: 'Пользователь или книга не найдены.' });
    }

    const activeLoan = await UserBook.findOne({
        where: { ...loanWhere(userId, bookId), returnDate: null },
    });
    if (activeLoan) {
        return res.status(409).json({ message: 'Эта книга уже выдана пользователю.' });
    }

    const loan = await UserBook.create({
        ...loanWhere(userId, bookId),
        dueDate: parsedDueDate,
        issueDate: new Date(),
    });
    return res.status(201).json({ message: 'Книга выдана пользователю.', loan });
};

exports.getIssuedBooks = async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'firstName', 'lastName'],
        include: {
            model: Book,
            through: { attributes: ['dueDate', 'issueDate', 'returnDate', 'renewals'] },
        },
    });

    if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден.' });
    }
    return res.json(user.Books);
};

exports.returnBook = async (req, res) => {
    const { bookId } = req.body;
    const loan = await UserBook.findOne({
        where: { ...loanWhere(req.user.id, bookId), returnDate: null },
    });

    if (!loan) {
        return res.status(404).json({ message: 'Активная выдача книги не найдена.' });
    }

    loan.returnDate = new Date();
    await loan.save();
    return res.json({ message: 'Книга возвращена.' });
};

exports.blockRenewal = async (req, res) => {
    const { bookId, userId, blockUntil } = req.body;
    const parsedBlockUntil = new Date(blockUntil);
    if (Number.isNaN(parsedBlockUntil.getTime())) {
        return res.status(400).json({ message: 'Некорректная дата блокировки.' });
    }

    const loan = await UserBook.findOne({
        where: { ...loanWhere(userId, bookId), returnDate: null },
    });
    if (!loan) {
        return res.status(404).json({ message: 'Активная выдача книги не найдена.' });
    }

    loan.renewalBlockedUntil = parsedBlockUntil;
    await loan.save();
    return res.json({ message: 'Продление книги временно заблокировано.' });
};

exports.getStatistics = async (req, res) => {
    const activeLoans = await UserBook.count({ where: { returnDate: null } });
    const overdueBooks = await UserBook.count({
        where: { dueDate: { [Op.lt]: new Date() }, returnDate: null },
    });
    const returnedBooks = await UserBook.count({ where: { returnDate: { [Op.not]: null } } });

    return res.json({ activeLoans, overdueBooks, returnedBooks });
};

exports.getUsers = async (req, res) => {
    const users = await User.findAll({
        attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'email', 'role'],
    });
    return res.json(users);
};

exports.getUserBooks = async (req, res) => {
    const user = await User.findByPk(req.params.userId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        include: {
            model: Book,
            through: { attributes: ['dueDate', 'issueDate', 'returnDate', 'renewals'] },
        },
    });

    if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден.' });
    }
    return res.json(user);
};

exports.requestRenewal = async (req, res) => {
    const { bookId } = req.body;
    const days = Number(req.body.days);
    if (!Number.isInteger(days) || days < 1 || days > 30) {
        return res.status(400).json({ message: 'Продление должно быть от 1 до 30 дней.' });
    }

    const loan = await UserBook.findOne({
        where: { ...loanWhere(req.user.id, bookId), returnDate: null },
    });
    if (!loan) {
        return res.status(404).json({ message: 'Активная выдача книги не найдена.' });
    }
    if (loan.renewals >= 2) {
        return res.status(403).json({ message: 'Доступно не более двух продлений.' });
    }
    if (loan.renewalBlockedUntil && loan.renewalBlockedUntil > new Date()) {
        return res.status(403).json({ message: 'Продление временно заблокировано библиотекарем.' });
    }

    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + days);
    loan.dueDate = newDueDate;
    loan.renewals += 1;
    await loan.save();

    const user = await User.findByPk(req.user.id);
    await sendPushNotification(user?.pushToken, {
        title: 'Книга продлена',
        body: `Новый срок возврата: ${newDueDate.toLocaleDateString('ru-RU')}`,
    });
    return res.json({ message: 'Срок возврата обновлён.', dueDate: newDueDate });
};
