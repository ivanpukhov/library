const express = require('express');
const { createDuel, acceptDuel, submitChallengerAnswers, submitOpponentAnswers } = require('../controllers/duelController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/duels', authMiddleware, createDuel); 
router.post('/duels/accept/:duelId', authMiddleware, acceptDuel); 
router.post('/duels/challenger', authMiddleware, submitChallengerAnswers); 
router.post('/duels/opponent', authMiddleware, submitOpponentAnswers); 

module.exports = router;
