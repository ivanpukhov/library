const express = require('express');
const { getQuestions, evaluateAnswers} = require('../controllers/openaiController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/ask', authMiddleware, evaluateAnswers);
router.get('/que', authMiddleware, getQuestions);

module.exports = router;
