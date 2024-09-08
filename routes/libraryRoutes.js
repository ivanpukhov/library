const express = require('express');
const {
    issueBook,
    getIssuedBooks,
    requestRenewal,
    blockRenewal,
    getStatistics,
    getUsers,
    getUserBooks,
    returnBook
} = require('../controllers/libraryController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/issue', authMiddleware, issueBook);
router.get('/my-books', authMiddleware, getIssuedBooks);
router.post('/renew-book', authMiddleware, requestRenewal);
router.post('/return-book', authMiddleware, returnBook);  
router.get('/statistics', authMiddleware, getStatistics);
router.get('/users', authMiddleware, getUsers);
router.get('/users/:userId/books', authMiddleware, getUserBooks);
router.post('/block-renewal', authMiddleware, blockRenewal);
router.get('/my-books', authMiddleware, getIssuedBooks);  

module.exports = router;
