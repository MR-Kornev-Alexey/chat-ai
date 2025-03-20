import { Telegraf } from "telegraf";
import { config } from "../config/config.js";
import consultationsService from "../services/consultations.js";


const answererBot = new Telegraf(config.ANSWER_BOT_TOKEN);

answererBot.start(async (ctx) => {
    try {
        const commandText = ctx.message.text.toLowerCase();

        // Проверяем, соответствует ли текст команды заданной команде
        if (commandText === '/start@mrk_new_bot') {
            // Проигнорируем команду и не выполняем никаких действий
            return;
        }

        // Отправляем приветственное сообщение с кнопками
        await ctx.replyWithHTML(
            `<b>Добрый день ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец'}!</b>\nПриветствую Вас в ответчике.`,
        );



        // Логируем данные пользователя
        console.log(ctx.message.from);

        // Создаем или обновляем запись в таблице Telegrams и User
        await consultationsService.startManager({
            chat_id: ctx.message.from.id,
            first_name: ctx.message.from.first_name || "default",
            last_name: ctx.message.from.last_name || "default",
            username: ctx.message.from.username || "default",
        });
    } catch (e) {
        console.error("Error in /start command:", e);
    }
});


// consultationBot.on('text', async (ctx) => {
//     try {
//         // Сохраняем сообщение в таблице Chats
//         await consultationsService.saveMessage({
//             chat_id: ctx.message.from.id,
//             message: ctx.message.text,
//             first_name: ctx.message.from.first_name || "default",
//             last_name: ctx.message.from.last_name || "default",
//             cause: "consultation"
//         });
//
//         // Отправляем подтверждение пользователю
//         await ctx.reply("Ваше сообщение сохранено!");
//     } catch (error) {
//         console.error("Error saving message:", error);
//         await ctx.reply("Произошла ошибка при сохранении сообщения.");
//     }
// });


export { answererBot };

