import { Context } from 'telegraf';

// Универсальная функция для обработки соглашений и политик
export async function handlePolicyAgreement(
    ctx: Context,
    message: string, // Текст сообщения
    url: string // URL для перехода
) {
    await ctx.reply(message, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Перейти на сайт", url }],
            ],
        },
    });
}
