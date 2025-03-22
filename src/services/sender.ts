import prisma from "../config/db.config.js";
import {answererBot} from "../answerer-bot/index.js";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createMessage(data: { last_name: string; cause: string; letter: any; first_name: string; chat_id: number, username: string  }) {
  return  `Бот ${data.cause}\nСообщение от ${data.chat_id}\n ${data.first_name} ${data.last_name}\nНикНейм: ${data.username}\n----------------------------------\n✍️${data.letter}`
}

class SenderService {
    async sendMessage(data: { last_name: string; cause: string; letter: any; first_name: string; chat_id: number, username: string }) {
        try {
            // Ищем запись в таблице tracking
            const listOfUser = await prisma.tracking.findMany();
            for (const user of listOfUser) {
                try {
                    // Проверяем, если user.reply равен true, добавляем кнопку "Комментировать"
                    if (user.answer === true) {
                        await answererBot.telegram.sendMessage(Number(user.chat_id), createMessage(data), {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {text: 'Комментировать', callback_data: `reply_${data.chat_id}_${data.cause}`}
                                    ]
                                ]
                            }
                        });
                        // console.log(`Сообщение с кнопкой "Комментировать" отправлено пользователю с telegram_id: ${user.telegram_id}`);
                    } else {
                        // Если reply false или undefined, отправляем сообщение без кнопок
                        await answererBot.telegram.sendMessage(Number(user.chat_id), createMessage(data));
                        // console.log(`Сообщение без кнопок отправлено пользователю с telegram_id: ${user.telegram_id}`);
                    }

                    // console.log(`Сообщение отправлено пользователю с telegram_id: ${user.telegram_id}`);
                } catch (sendError) {

                    console.error(`Ошибка при отправке сообщения пользователю с telegram_id: ${user.chat_id}`, sendError);
                }
                // Делаем паузу в 2000 мс между отправками
                await delay(2000);
            }

        } catch (error) {
            console.error("Error in ConsultationsService.start:", error);
            throw error; // Пробрасываем ошибку для обработки в вызывающем коде
        }
    }
}
export default new SenderService
