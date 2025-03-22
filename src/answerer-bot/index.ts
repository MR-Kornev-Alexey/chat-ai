import {Telegraf, session, Scenes} from "telegraf";
import {config} from "../config/config.js";
import consultationsService from "../services/consultations.js";
import SceneReply from "../scenes/scene-reply.js";

;// Путь к вашему файлу
const bot = new Telegraf("YOUR_BOT_TOKEN");

// Создаем экземпляр сцены
const sceneReply = new SceneReply();
const replyScene = sceneReply.ReplyScene();

// Создаем Stage и регистрируем сцену
// @ts-ignore
const stage = new Scenes.Stage([replyScene]);
bot.use(session());
bot.use(stage.middleware());

const answererBot = new Telegraf(config.ANSWER_BOT_TOKEN);
answererBot.use(session());
answererBot.use(stage.middleware());

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


answererBot.on('text', async (ctx) => {
    try {
        // Удаляем сообщение пользователя
        await ctx.deleteMessage();
    } catch (error) {
        console.error("Error saving or deleting message:", error);
        await ctx.reply("Произошла ошибка при обработке вашего сообщения.");
    }
});

answererBot.on('callback_query', async (ctx) => {
    try {
        // @ts-ignore
        const callbackData = ctx.callbackQuery.data;
        // @ts-ignore
        // Проверяем, что callback_data начинается с 'reply_'
        if (callbackData.startsWith('reply_')) {
            // Разделяем строку на части, чтобы извлечь userTelegramId и issueId
            const [reply, chat_id, cause] = callbackData.split('_');
            const username = ctx.callbackQuery.from.username
            console.log(cause)
            const newCause = `${cause}_answer`
            // @ts-ignore
            await ctx.scene.enter('reply', {chat_id: chat_id, cause: newCause , username: username});
        }
    } catch (error) {
        // Логируем ошибку при обработке callback_query
    }
});


export {answererBot};

