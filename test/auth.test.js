process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';
process.env.NOTIFICATIONS_ENABLED = 'false';
process.env.REMINDERS_ENABLED = 'false';

const assert = require('node:assert/strict');
const { after, beforeEach, describe, it } = require('node:test');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const { createApp } = require('../app');
const sequelize = require('../config/database');
const { User } = require('../models');

const app = createApp();
const readerPayload = {
    firstName: 'Aida',
    lastName: 'Test',
    phoneNumber: '+77000000001',
    email: 'aida@example.test',
    password: 'safe-password',
};

beforeEach(async () => {
    await sequelize.sync({ force: true });
});

after(async () => {
    await sequelize.close();
});

describe('authentication and roles', () => {
    it('always creates a reader even when a privileged role is requested', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({ ...readerPayload, role: 'librarian' })
            .expect(201);

        assert.equal(response.body.user.role, 'reader');
        const user = await User.findOne({ where: { email: readerPayload.email } });
        assert.equal(user.role, 'reader');
    });

    it('rejects missing tokens and denies librarian routes to readers', async () => {
        await request(app).get('/api/users').expect(401);

        const registration = await request(app)
            .post('/api/auth/register')
            .send(readerPayload)
            .expect(201);

        await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${registration.body.token}`)
            .send({
                title: 'Test Book',
                author: 'Test Author',
                description: 'Fixture',
                number: 'TEST-1',
                link: 'https://example.test/book',
                keywords: ['test'],
            })
            .expect(403);
    });

    it('allows a librarian to manage the catalogue', async () => {
        const password = await bcrypt.hash('librarian-password', 10);
        const librarian = await User.create({
            firstName: 'Dana',
            lastName: 'Librarian',
            phoneNumber: '+77000000002',
            email: 'librarian@example.test',
            password,
            role: 'librarian',
        });
        const token = jwt.sign({ id: librarian.id }, process.env.JWT_SECRET, { expiresIn: '5m' });

        const response = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'The Left Hand of Darkness',
                author: 'Ursula K. Le Guin',
                description: 'Science fiction novel',
                number: 'ISBN-DEMO-1',
                link: 'https://example.test/books/1',
                keywords: ['science-fiction'],
            })
            .expect(201);

        assert.equal(response.body.title, 'The Left Hand of Darkness');
    });

    it('exposes a lightweight health check', async () => {
        const response = await request(app).get('/healthz').expect(200);
        assert.deepEqual(response.body, { status: 'ok' });
    });
});
