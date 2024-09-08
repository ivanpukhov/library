const { Duel, User, Book, UserClub} = require('../models');
const { generateQuestions, evaluateAnswers } = require('../services/openaiService');
const {sendPushNotification} = require("../services/notificationService");


exports.createDuel = async (req, res) => {
    try {
        const { clubId, bookId, stake } = req.body;
        const challengerId = req.user.id;


        const userInClub = await UserClub.findOne({
            where: { UserId: challengerId, ClubId: clubId }
        });

        if (!userInClub) {
            return res.status(403).json({ message: 'Вы не состоите в этом клубе.' });
        }


        const book = await Book.findByPk(bookId);
        if (!book) {
            return res.status(404).json({ message: 'Книга не найдена.' });
        }


        const questions = await generateQuestions(book.title);


        const duel = await Duel.create({
            clubId,
            bookId,
            stake,
            challengerId,
            status: 'pending',
            questions: JSON.stringify(questions)
        });
        const clubMembers = await UserClub.findAll({ where: { ClubId: clubId }, include: User });
        clubMembers.forEach(({ User }) => {
            if (User.id !== challengerId) {
                sendPushNotification(User.pushToken, {
                    title: 'Вызов на дуэль',
                    body: `Новая дуэль с книгой "${book.title}". Примите вызов!`,
                });
            }
        });

        res.status(201).json({
            message: 'Дуэль успешно создана. Ожидает оппонента.',
            duel,
            questions
        });
    } catch (error) {
        console.error('Ошибка при создании дуэли:', error);
        res.status(500).json({ message: 'Произошла ошибка при создании дуэли.' });
    }
};


exports.acceptDuel = async (req, res) => {
    try {
        const { duelId } = req.params;
        const opponentId = req.user.id;


        const duel = await Duel.findOne({
            where: { id: duelId, status: 'pending' }
        });

        if (!duel) {
            return res.status(404).json({ message: 'Дуэль не найдена или уже принята.' });
        }


        const userInClub = await UserClub.findOne({
            where: { UserId: opponentId, ClubId: duel.clubId }
        });

        if (!userInClub) {
            return res.status(403).json({ message: 'Вы не состоите в этом клубе.' });
        }


        duel.opponentId = opponentId;
        duel.status = 'ongoing';
        await duel.save();


        const questions = JSON.parse(duel.questions);

        res.status(200).json({ message: 'Дуэль принята.', duel, questions });
    } catch (error) {
        console.error('Ошибка при принятии дуэли:', error);
        res.status(500).json({ message: 'Произошла ошибка при принятии дуэли.' });
    }
};


exports.submitChallengerAnswers = async (req, res) => {
    const { duelId, userAnswers } = req.body;
    const challengerId = req.user.id;

    const duel = await Duel.findByPk(duelId);

    if (!duel || duel.challengerId !== challengerId) {
        return res.status(403).json({ message: 'Вы не можете отправить ответы для этой дуэли.' });
    }


    const book = await Book.findByPk(duel.bookId);
    const evaluation = await evaluateAnswers(book.title, userAnswers);

    duel.challengerScore = evaluation.progress;
    await duel.save();
    const opponent = await User.findByPk(duel.opponentId);
    sendPushNotification(opponent.pushToken, {
        title: 'Ответы от оппонента',
        body: 'Ваш оппонент отправил свои ответы в дуэли.',
    });

    if (duel.opponentScore > 0) {
        await determineWinner(duel);
    }

    res.status(200).json({ message: 'Ответы отправлены.', score: duel.challengerScore });
};


exports.submitOpponentAnswers = async (req, res) => {
    const { duelId, userAnswers } = req.body;
    const opponentId = req.user.id;

    const duel = await Duel.findByPk(duelId);

    if (!duel || duel.opponentId !== opponentId) {
        return res.status(403).json({ message: 'Вы не можете отправить ответы для этой дуэли.' });
    }


    const book = await Book.findByPk(duel.bookId);
    const evaluation = await evaluateAnswers(book.title, userAnswers);

    duel.opponentScore = evaluation.progress;
    await duel.save();


    if (duel.challengerScore > 0) {
        await determineWinner(duel);
    }

    res.status(200).json({ message: 'Ответы отправлены.', score: duel.opponentScore });
};


async function determineWinner(duel) {
    let winnerId = null;

    if (duel.challengerScore > duel.opponentScore) {
        winnerId = duel.challengerId;
    } else if (duel.opponentScore > duel.challengerScore) {
        winnerId = duel.opponentId;
    } else {

        duel.status = 'completed';
        duel.winnerId = null;
        await duel.save();

        return {
            message: 'Дуэль завершилась ничьей.',
            challengerScore: duel.challengerScore,
            opponentScore: duel.opponentScore
        };
    }

    if (winnerId) {
        const winner = await User.findByPk(winnerId);
        winner.balance += duel.stake * 2;
        await winner.save();
    }

    duel.winnerId = winnerId;
    duel.status = 'completed';
    await duel.save();

    return {
        message: winnerId ? 'Дуэль завершена. Победитель определён.' : 'Дуэль завершилась ничьей.',
        winnerId,
        challengerScore: duel.challengerScore,
        opponentScore: duel.opponentScore
    };
}
