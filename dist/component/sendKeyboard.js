// Универсальная функция для отправки клавиатуры
export async function sendKeyboard(ctx, text) {
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
