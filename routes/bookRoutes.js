const express = require('express');
const { createBook, getBooks, getBooksByAuthor, getBooksByKeywords, getBookByIdWithReviews} = require('../controllers/bookController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/books', authMiddleware, createBook); 
router.get('/books', getBooks);
router.get('/books/author/:author', getBooksByAuthor);
router.get('/books/keyword/:keyword', getBooksByKeywords);
router.get('/books/:bookId', authMiddleware, getBookByIdWithReviews);

module.exports = router;
