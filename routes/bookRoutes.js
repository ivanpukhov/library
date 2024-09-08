const express = require('express');
const { createBook, getBooks, getBooksByAuthor, getBooksByKeywords, getBookByIdWithReviews} = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');
const {Book} = require("../models");

const router = express.Router();

router.post('/books', authMiddleware, createBook);
router.post('/books/multiple', authMiddleware, async (req, res) => {
    const books = req.body.books;

    if (!Array.isArray(books) || books.length === 0) {
        return res.status(400).json({ message: 'Пожалуйста, предоставьте массив книг.' });
    }

    try {
        const createdBooks = await Book.bulkCreate(books);
        res.status(201).json(createdBooks);
    } catch (err) {
        res.status(500).json({ message: 'Ошибка при добавлении книг.', error: err });
    }
});

router.get('/books', getBooks);
router.get('/books/author/:author', getBooksByAuthor);
router.get('/books/keyword/:keyword', getBooksByKeywords);
router.get('/books/:bookId', authMiddleware, getBookByIdWithReviews);

module.exports = router;
