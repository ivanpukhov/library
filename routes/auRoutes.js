const express = require('express');
const { getQuestions, evaluateAnswers} = require('../controllers/openaiController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/ask', authMiddleware, evaluateAnswers);
router.get('/que/:bookId', authMiddleware, getQuestions);

module.exports = router;
