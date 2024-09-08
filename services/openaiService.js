
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: "",
});


exports.generateQuestions = async (bookTitle) => {
    const prompt = `Я прочитал книгу "${bookTitle}". Составь 20 вопросов с 4 вариантами ответов. Формат: [{"question": "Вопрос 1", "options": ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"]}, {...}, ...] кроме json ничего не пиши!!`;

    const questionResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const responseContent = questionResponse.choices[0].message.content;
    return JSON.parse(responseContent);
};


exports.evaluateAnswers = async (bookTitle, userAnswers) => {
    const prompt = `Я прочитал книгу "${bookTitle}". Вот список вопросов и моих ответов:\n${JSON.stringify(userAnswers)}.\nОцени, на сколько процентов я правильно ответил. Верни ответ в формате JSON: {"progress": число от 0 до 100, "explanation": "пояснение"} и кроме json ничего не пиши!!`;

    const evaluationResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
    });

    const responseContent = evaluationResponse.choices[0].message.content;
    return JSON.parse(responseContent);
};
