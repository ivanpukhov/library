// services/notificationService.js
const { Expo } = require('expo-server-sdk');

// Создаем новый объект Expo SDK
const expo = new Expo();

const sendPushNotification = async (pushToken, message) => {
    if (process.env.NOTIFICATIONS_ENABLED !== 'true' || !pushToken) {
        return false;
    }
    if (!Expo.isExpoPushToken(pushToken)) {
        return false;
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
        await expo.sendPushNotificationsAsync(messages);
        return true;
    } catch (error) {
        console.error('Ошибка при отправке уведомления:', error);
        return false;
    }
};

module.exports = { sendPushNotification };
