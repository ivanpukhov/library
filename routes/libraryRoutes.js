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
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.post('/issue', authMiddleware, requireRole('librarian'), issueBook);
router.get('/my-books', authMiddleware, getIssuedBooks);
router.post('/renew-book', authMiddleware, requestRenewal);
router.post('/return-book', authMiddleware, returnBook);  
router.get('/statistics', authMiddleware, requireRole('librarian'), getStatistics);
router.get('/users', authMiddleware, requireRole('librarian'), getUsers);
router.get('/users/:userId/books', authMiddleware, requireRole('librarian'), getUserBooks);
router.post('/block-renewal', authMiddleware, requireRole('librarian'), blockRenewal);

module.exports = router;
