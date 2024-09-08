const OpenAI = require("openai");
const { User, UserBook, Book} = require('../models');
const openai = new OpenAI({
});

function isValidJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

exports.getQuestions = async (req, res) => {
    const { bookId } = req.body;


    const book = await Book.findByPk(bookId);

    if (!book) {
        return res.status(404).json({ error: "Книга не найдена." });
    }

    const bookName = book.title;

    try {
        const prompt = `Предположим, что я читал книгу "${bookName}". Тебе нужно составить 5 вопросов по сюжету этой книги в формате JSON. Вопросы должны быть направлены на проверку того, как хорошо я понял содержание этой книги. Формат JSON должен быть **строго** таким: [{"question": "Вопрос 1"}, {"question": "Вопрос 2"}, {"question": "Вопрос 3"}, {"question": "Вопрос 4"}, {"question": "Вопрос 5"}]. важно, чтобы кроме json ответ не содержал ничего!!`;

        const questionResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        const responseContent = questionResponse.choices[0].message.content;

        if (isValidJSON(responseContent)) {
            const questions = JSON.parse(responseContent);
            res.json(questions);
        } else {
            res.status(500).json({ error: "Ответ от OpenAI не является корректным JSON." });
        }
    } catch (error) {
        console.error("Ошибка при запросе вопросов у OpenAI:", error);
        res.status(500).json({ error: "Произошла ошибка при получении вопросов." });
    }
};

exports.evaluateAnswers = async (req, res) => {
    const { bookName, userAnswers } = req.body;
    const userId = req.user.id;

    if (!bookName || !userAnswers) {
        return res.status(400).json({ error: "Пожалуйста, предоставьте название книги и ответы пользователя." });
    }

    try {
        const prompt = `Я прочитал книгу "${bookName}". Вот список вопросов и моих ответов:\n${JSON.stringify(userAnswers)}.\nНа основе этих ответов оцени, на сколько процентов я прочитал книгу. Возвращай ответ строго в формате JSON: {"progress": число от 0 до 100, "explanation": "пояснение оценки"} и кроме json ничего не пиши!!`;

        const evaluationResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
        });

        const responseContent = evaluationResponse.choices[0].message.content;

        if (isValidJSON(responseContent)) {
            const result = JSON.parse(responseContent);

            let points = 0;
            if (result.progress >= 50) {
                points = result.progress * 10;
            } else if (result.progress < 20) {
                points = -result.progress * 10;
            }


            const user = await User.findByPk(userId);
            user.balance += points;
            await user.save();

            res.json({
                progress: result.progress,
                explanation: result.explanation,
                pointsAwarded: points,
                newBalance: user.balance,
            });
        } else {
            res.status(500).json({ error: "Ответ от OpenAI не является корректным JSON." });
        }
    } catch (error) {
        console.error("Ошибка при оценке ответов у OpenAI:", error);
        res.status(500).json({ error: "Произошла ошибка при оценке ответов." });
    }
};
