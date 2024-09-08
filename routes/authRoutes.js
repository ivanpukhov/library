const express = require('express');
const { register, login, getProfile, getBooksHistory} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authMiddleware, getProfile);
router.get('/my-books-history', authMiddleware, getBooksHistory);

module.exports = router;
