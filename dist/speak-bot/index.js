import { Telegraf } from "telegraf";
import { config } from "../config/config.js";
import consultationsService from "../services/common-db.js";
import { sendKeyboard } from "../component/sendKeyboard.js";
import { handleMessage } from "../component/handleMessage.js";
import { TARIFF_ALL_INCLUDED, TARIFF_I_AM, TEXT_START } from "../constants/speak.js";
import { handlePolicyAgreement } from "../component/handlePolicyAgreement.js";
const token = process.env.NODE_ENV === 'production'
    ? config.SPEAK_BOT_TOKEN
    : config.DEV_SPEAK_BOT_TOKEN;
if (!token) {
    throw new Error('AnswererBot token is not defined!');
}
const speakBot = new Telegraf(token);
const webSpeak = config.URL_SPEAK_INTENSIVE;
const webTerms = config.URL_TERMS;
const webPrivacy = config.URL_PRIVACY;
const paySpeakUndefended = config.URL_PAY_SPEAK_INDEPENDENT;
const paySpeakAll = config.URL_PAY_SPEAK_ALL;
speakBot.start(async (ctx) => {
    try {
        const commandText = ctx.message.text.toLowerCase();
        // Проверяем, соответствует ли текст команды заданной команде
        if (commandText === '/start@mrk_new_bot') {
            // Проигнорируем команду и не выполняем никаких действий
            return;
        }
        // Отправляем приветственное сообщение с кнопками
        await ctx.replyWithHTML(`<b>Добрый день ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец'}!\n\n</b>${TEXT_START}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "💸 ОПЛАТИТЬ 💸", callback_data: 'apply_for_tariff' },
                    ],
                    [
                        { text: "🌐 Подробнее 🔗", url: webSpeak },
                    ],
                ],
            }
        });
        // Отправляем второе сообщение с большими кнопками
        await ctx.reply("Задайте вопрос в сообщении  или оплатите доступ", {
            reply_markup: {
                keyboard: [
                    [
                        { text: "Пользовательское соглашение" },
                        { text: "Политика конфиденциальности" }
                    ]
                ],
                resize_keyboard: true, // Делает кнопки большими
                one_time_keyboard: false // Кнопки исчезнут после нажатия
            }
        });
        // Создаем или обновляем запись в таблице Telegrams и User
        await consultationsService.start({
            chat_id: ctx.message.from.id,
            first_name: ctx.message.from.first_name || "default",
            last_name: ctx.message.from.last_name || "default",
            username: ctx.message.from.username || "default",
        });
    }
    catch (e) {
        console.error("Error in /start command:", e);
    }
});
async function sendTariff(ctx, text, buttonText, url) {
    await ctx.replyWithHTML(text, {
        reply_markup: {
            inline_keyboard: [
                [{ text: buttonText, url }],
            ],
        },
    });
}
speakBot.command('link', async (ctx) => {
    await ctx.reply("Вы будете переадресованы на сайт...", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Перейти на сайт", url: webSpeak }
                ]
            ]
        }
    });
});
// Обработка команды /request
speakBot.command('pay', async (ctx) => {
    await sendKeyboard(ctx, "Загрузка оплаты ...");
    const data = {
        chat_id: ctx.message.from.id,
        first_name: ctx.message.from.first_name,
        last_name: ctx.message.from.last_name,
        username: ctx.message.from.username,
        message: "Переход клиента на оплату речевого интенсива",
        cause: 'payment_press'
    };
    await handleMessage(data);
    await sendTariff(ctx, TARIFF_ALL_INCLUDED, "Оплатить 18900 руб.", paySpeakAll);
    await sendTariff(ctx, TARIFF_I_AM, "Оплатить 11900 руб.", paySpeakUndefended);
});
speakBot.action('apply_for_tariff', async (ctx) => {
    await ctx.answerCbQuery();
    await sendKeyboard(ctx, "Загрузка оплаты ...");
    const data = {
        chat_id: ctx.update.callback_query.from.id,
        first_name: ctx.update.callback_query.from.first_name,
        last_name: ctx.update.callback_query.from.last_name,
        username: ctx.update.callback_query.from.username,
        message: "Переход на тарифные планы речевого интенсива",
        cause: 'speak_tariff_press',
    };
    await handleMessage(data);
    await sendTariff(ctx, TARIFF_ALL_INCLUDED, "Оплатить 18900 руб.", paySpeakAll);
    await sendTariff(ctx, TARIFF_I_AM, "Оплатить 11900 руб.", paySpeakUndefended);
});
speakBot.hears('Пользовательское соглашение', async (ctx) => {
    await handlePolicyAgreement(ctx, "Вы будете переадресованы на сайт...", webTerms);
});
speakBot.hears('Политика конфиденциальности', async (ctx) => {
    await handlePolicyAgreement(ctx, "Вы будете переадресованы на сайт...", webPrivacy);
});
speakBot.on('text', async (ctx) => {
    try {
        await sendKeyboard(ctx, "Ваше сообщение отправлено...");
        const data = {
            chat_id: ctx.message.from.id,
            first_name: ctx.message.from.first_name,
            last_name: ctx.message.from.last_name,
            username: ctx.message.from.username,
            message: ctx.message.text,
            cause: 'speak_request'
        };
        await handleMessage(data);
    }
    catch (error) {
        console.error("Ошибка при сохранении сообщения:", error);
        await ctx.reply("Произошла ошибка при отправке сообщения. Попробуйте снова.");
    }
});
export { speakBot };
