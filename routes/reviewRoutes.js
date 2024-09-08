
const express = require('express');
const { addReview, getReviewsByBook } = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/reviews', authMiddleware, addReview); 
router.get('/reviews/:bookId', getReviewsByBook); 

module.exports = router;
