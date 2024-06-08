import fetch from 'node-fetch';
import TelegramBot from 'node-telegram-bot-api';

export default async function sendNotification(message, { service, uri, token, id }) {
    if (service == 'ntfy') {
        fetch(uri, {
            method: 'POST',
            body: JSON.stringify({
                topic: "mebkontenjan",
                message: `${message}`,
                title: `MEB Kontenjan`,
                priority: 1
            }),
            headers: { 'Authorization': `Bearer ${token}` }
        });
    };
    if (service == 'telegram') {
        const bot = new TelegramBot(token, { polling: true });
        bot.sendMessage(id, message);
    };
};