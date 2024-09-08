const express = require('express');
const { registerForEvent, createEvent, getAllEvents} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register-event', authMiddleware, registerForEvent);
router.post('/create-event', authMiddleware, createEvent);
router.post('/get-all-event', authMiddleware, getAllEvents);

module.exports = router;
