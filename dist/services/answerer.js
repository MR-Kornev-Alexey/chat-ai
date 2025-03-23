class AnswererService {
    async sendAnswerToClient(cause, message, chat_id) {
        try {
            [cause] = cause.split('_');
            console.log("cause ", cause);
            let bot;
            if (cause === "consultation") {
                const { consultationBot } = await import("../consultations-bot/index.js");
                bot = consultationBot;
            }
            else if (cause === "conducting") {
                const { conductionBot } = await import("../conduction-bot/index.js");
                bot = conductionBot;
            }
            else if (cause === "speak") {
                const { speakBot } = await import("../speak-bot/index.js");
                bot = speakBot;
            }
            else {
                throw new Error(`Unknown cause: ${cause}`);
            }
            await bot.telegram.sendMessage(chat_id, message);
        }
        catch (error) {
            console.error("Error in AnswererService.sendAnswerToClient:", error);
            throw error; // Пробрасываем ошибку для обработки в вызывающем коде
        }
    }
}
export default new AnswererService();
