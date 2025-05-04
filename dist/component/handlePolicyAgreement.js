// Универсальная функция для обработки соглашений и политик
export async function handlePolicyAgreement(ctx, message, // Текст сообщения
url // URL для перехода
) {
    await ctx.reply(message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Перейти на сайт", url }],
            ],
        },
    });
}
