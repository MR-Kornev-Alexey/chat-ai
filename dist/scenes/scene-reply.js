import { Scenes } from "telegraf";
import consultationsService from "../services/common-db.js";
class SceneReply {
    ReplyScene() {
        const reply = new Scenes.BaseScene('reply');
        // Тайм-аут в 5 минут
        let timeout;
        reply.enter(async (ctx) => {
            try {
                // Проверяем, что state содержит chat_id и cause
                // @ts-ignore
                if (!ctx.scene.state.chat_id || !ctx.scene.state.cause) {
                    await ctx.reply("Ошибка: отсутствуют необходимые данные.");
                    // @ts-ignore
                    return ctx.scene.leave();
                }
                // @ts-ignore
                const { chat_id, cause } = ctx.scene.state; // Получаем переданные данные
                await ctx.reply(`Прокомментировать обращение ${chat_id} | ${cause}.`);
                // Устанавливаем таймер на 5 минут (300000 миллисекунд)
                timeout = setTimeout(async () => {
                    await ctx.reply('Время ожидания истекло. Сообщение не отправлено в течение 3 минут.');
                    // @ts-ignore
                    await ctx.scene.leave(); // Выход из сцены
                }, 180000); // 5 минут в миллисекундах
            }
            catch (error) {
                console.error("Error in scene enter:", error);
                await ctx.reply("Произошла ошибка при обработке вашего сообщения.");
            }
        });
        reply.on('text', async (ctx) => {
            try {
                // Сбрасываем таймер, если пользователь ответил
                if (timeout) {
                    clearTimeout(timeout);
                }
                // Проверяем, что state содержит chat_id и cause
                // @ts-ignore
                if (!ctx.scene.state.chat_id || !ctx.scene.state.cause) {
                    await ctx.reply("Ошибка: отсутствуют необходимые данные.");
                    // @ts-ignore
                    return ctx.scene.leave();
                }
                const answersID = ctx.message.from.id;
                const comment = ctx.message.text;
                // @ts-ignore
                const { chat_id, cause, username } = ctx.scene.state; // Извлекаем ID задачи из состояния
                // Сохраняем комментарий (здесь можно добавить логику сохранения в базу данных)
                await consultationsService.saveComment(+chat_id, cause, username, comment, answersID);
                await ctx.replyWithHTML(`Ваш комментарий <b>\"${comment}\"</b> к обращению ${chat_id} | ${cause} | ${username} сохранён.`);
                // Завершаем сцену после того, как комментарий обработан
                // @ts-ignore
                await ctx.scene.leave();
            }
            catch (error) {
                console.error("Error in scene text handler:", error);
                await ctx.reply("Произошла ошибка при обработке вашего сообщения.");
            }
        });
        return reply;
    }
}
// Экспортируем класс
export default SceneReply;
