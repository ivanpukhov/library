
const { Review, User, Book } = require('../models');

exports.addReview = async (req, res) => {
    const { bookId, content, rating } = req.body;
    const userId = req.user.id;

    try {
        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Книга не найдена.' });
        }

        const review = await Review.create({
            content,
            rating,
            userId,
            bookId
        });

        
        const user = await User.findByPk(userId);
        user.balance += 50;
        await user.save();

        res.status(201).json({ message: 'Отзыв успешно добавлен и начислено 50 баллов.', review });
    } catch (error) {
        res.status(500).json({ message: 'Произошла ошибка при добавлении отзыва.', error });
    }
};

exports.getReviewsByBook = async (req, res) => {
    const { bookId } = req.params;

    try {
        const reviews = await Review.findAll({
            where: { bookId },
            include: [
                {
                    model: User,
                    attributes: ['firstName', 'lastName']
                }
            ]
        });

        if (reviews.length === 0) {
            return res.status(404).json({ message: 'Отзывы для этой книги не найдены.' });
        }

        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении отзывов.', error });
    }
};
