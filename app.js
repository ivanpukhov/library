require('dotenv').config();

const cors = require('cors');
const express = require('express');

const sequelize = require('./config/database');
const { checkUpcomingEvents } = require('./controllers/eventController');
const authRoutes = require('./routes/authRoutes');
const auRoutes = require('./routes/auRoutes');
const bookRoutes = require('./routes/bookRoutes');
const clubRoutes = require('./routes/clubRoutes');
const duelRoutes = require('./routes/duelRoutes');
const eventRoutes = require('./routes/eventRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const { checkDueDates } = require('./services/reminderService');

const createApp = () => {
    const app = express();
    const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim());

    app.disable('x-powered-by');
    app.use(cors({ origin: allowedOrigins }));
    app.use(express.json({ limit: '1mb' }));

    app.get('/', (req, res) => res.json({
        name: 'Library Community API',
        documentation: 'https://github.com/ivanpukhov/library/blob/main/docs/API.md',
        health: '/healthz',
    }));
    app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

    app.use('/api/auth', authRoutes);
    app.use('/api', bookRoutes);
    app.use('/api', libraryRoutes);
    app.use('/api', auRoutes);
    app.use('/api', eventRoutes);
    app.use('/api', clubRoutes);
    app.use('/api', reviewRoutes);
    app.use('/api', duelRoutes);

    app.use((req, res) => res.status(404).json({ message: 'Маршрут не найден.' }));
    return app;
};

const startServer = async () => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must contain at least 32 characters');
    }

    await sequelize.sync({ force: false });
    const app = createApp();
    const port = Number(process.env.PORT || 3001);
    const host = process.env.HOST || '127.0.0.1';
    const server = app.listen(port, host, () => {
        console.log(`Library API is listening on http://${host}:${port}`);
    });

    if (process.env.REMINDERS_ENABLED === 'true') {
        const interval = 24 * 60 * 60 * 1000;
        setInterval(checkDueDates, interval).unref();
        setInterval(checkUpcomingEvents, interval).unref();
    }
    return server;
};

if (require.main === module) {
    startServer().catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { createApp, startServer };
