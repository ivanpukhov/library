const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Требуется Bearer token.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id, { attributes: ['id', 'role'] });
        if (!user) {
            return res.status(401).json({ message: 'Пользователь токена не найден.' });
        }
        req.user = { id: user.id, role: user.role };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Токен недействителен или просрочен.' });
    }
};

module.exports = authMiddleware;
