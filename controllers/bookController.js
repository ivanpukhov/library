const { Book, User} = require('../models');
const Review = require('../models/Review');
const {Op} = require("sequelize");

exports.createBook = async (req, res) => {
    const { title, author, description, number, link, keywords } = req.body;

    try {
        const book = await Book.create({ title, author, description, number, link, keywords });
        res.status(201).json(book);
    } catch (err) {
        res.status(400).json({ message: 'Ошибка при создании книги', error: err });
    }
};



exports.getBooks = async (req, res) => {
    const books = await Book.findAll();
    res.json(books);
};

exports.getBookByIdWithReviews = async (req, res) => {
    const { bookId } = req.params;

    try {

        const book = await Book.findByPk(bookId, {
            include: [
                {
                    model: Review,
                    include: {
                        model: User,
                        attributes: ['firstName', 'lastName']
                    }
                }
            ]
        });

        if (!book) {
            return res.status(404).json({ message: 'Книга не найдена.' });
        }

        res.status(200).json(book);
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Ошибка при получении книги и отзывов.', error });
    }
};


exports.getBooksByAuthor = async (req, res) => {
    const { author } = req.params;
    const books = await Book.findAll({ where: { author } });
    res.json(books);
};

exports.getBooksByKeywords = async (req, res) => {
    const { keyword } = req.params;
    const books = await Book.findAll({
        where: {
            keywords: { [Op.contains]: [keyword] }
        }
    });
    res.json(books);
};

