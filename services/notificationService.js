// services/notificationService.js
const { Expo } = require('expo-server-sdk');

// Создаем новый объект Expo SDK
const expo = new Expo();

const sendPushNotification = async (pushToken, message) => {
    if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push-токен ${pushToken} не является валидным Expo Push токеном`);
        return;
    }

    // Формируем сообщение с приоритетом 'high'
    const messages = [{
        to: pushToken,
        sound: 'default',
        title: message.title,
        body: message.body,
        data: message.data || {},
        priority: 'high', // Максимальный доступный приоритет
    }];

    try {
        const ticketChunk = await expo.sendPushNotificationsAsync(messages);
        console.log('Уведомления отправлены:', ticketChunk);
    } catch (error) {
        console.error('Ошибка при отправке уведомления:', error);
    }
};

module.exports = { sendPushNotification };
