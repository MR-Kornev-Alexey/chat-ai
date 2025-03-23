import { Context } from 'telegraf'; // Импортируем необходимые типы и функции

// Универсальная функция для отправки клавиатуры
export async function sendKeyboard(ctx: Context, text: string) {
    await ctx.replyWithHTML(`<b>${text}</b> <i>⏳</i>`, {
        reply_markup: {
            keyboard: [
                [
                    { text: "Пользовательское соглашение" },
                    { text: "Политика конфиденциальности" }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    });
}
