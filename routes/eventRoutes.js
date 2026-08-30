const express = require('express');
const { registerForEvent, createEvent, getAllEvents} = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.post('/register-event', authMiddleware, registerForEvent);
router.post('/events', authMiddleware, requireRole('librarian'), createEvent);
router.get('/events', authMiddleware, getAllEvents);

module.exports = router;
