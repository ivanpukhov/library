const express = require('express');
const { createClub, joinClub, getTopClubs, addClubNews, getClubNews, sendMessage, getMessages, createClubEvent, registerForClubEvent,
    getAllClubEvents, getMyClubs,
    getClubProfile
} = require('../controllers/clubController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create-club', authMiddleware, createClub);  
router.post('/join-club', authMiddleware, joinClub);  
router.get('/top-clubs', getTopClubs);  
router.post('/club/:clubId/news', authMiddleware, addClubNews);  
router.get('/club/:clubId/news', authMiddleware, getClubNews);  
router.post('/club/:clubId/send-message', authMiddleware, sendMessage);  
router.get('/club/:clubId/messages', authMiddleware, getMessages);  
router.post('/create-club-event/:clubId', authMiddleware, createClubEvent);  
router.post('/register-club-event/:clubId', authMiddleware, registerForClubEvent);  
router.get('/club/:clubId/profile', authMiddleware, getClubProfile);  
router.get('/club-events', authMiddleware, getAllClubEvents);  
router.get('/my-clubs', authMiddleware, getMyClubs);

module.exports = router;
