import { Telegraf } from "telegraf";
import { config } from "../config/config.js";
import consultationsService from "../services/common-db.js";
import senderService from "../services/sender.js";
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
const start = "«От звука к слову» - интенсив, который запустит речь вашего малыша!\n" +
    "Вы ждёте слов и предложений ребёнка, но они так и не появляются? Устали от противоречивых советов и вечного «подождите, заговорит»? Не ждите – помогите малышу говорить осознанно и правильно уже сейчас!\n" +
    "\n" +
    "🔹 Для кого этот интенсив?\n" +
    " ✔️ Родителей детей от 1 до 3,5 лет\n" +
    " ✔️ Тех, кто переживает из-за задержки речи и не хочет «просто ждать»\n" +
    " ✔️ Кто устал от бесконечных истерик не говорящего малыша\n" +
    " ✔️ Кого запутала куча советов из интернета\n" +
    " ✔️ Чьи дети родились раньше срока или в двуязычной семье\n" +
    " ✔️ Кто хочет понять, как правильно развивать речь малыша без ошибок\n" +
    "\n" +
    "🎯 Что получите на интенсиве?\n" +
    " ✔️ Четкую стратегию запуска речи – без воды, только работающие методы\n" +
    " ✔️ 5 тестов для диагностики речи – поймёте, на каком этапе есть проблемы у вашего ребенка\n" +
    " ✔️ 30+ видеоуроков – структурированная информация о речевом развитии\n" +
    " ✔️ 150+ практических заданий – применяйте сразу, результат не заставит ждать\n" +
    " ✔️ Поддержку куратора и чат для общения (в тарифе «Индивидуальный»)\n" +
    " ✔️ Живые вебинары – вебинары в записи\n" +
    " ✔️ Удобный формат получения теории и практических заданий с помощью рассылки в чат-боте:\n" +
    "\n" +
    "❗ ВНИМАНИЕ! Акция!​\n" +
    "❗ Приобретая интенсив, вы получаете два ценных бонуса:​\n" +
    "🔴 30-минутная диагностика с автором курса для обсуждения проблем вашего малыша и получения персональных рекомендаций.​\n" +
    "🔴 Сопровождение куратора на период прохождения интенсива.";
speakBot.start(async (ctx) => {
    try {
        const commandText = ctx.message.text.toLowerCase();
        // Проверяем, соответствует ли текст команды заданной команде
        if (commandText === '/start@mrk_new_bot') {
            // Проигнорируем команду и не выполняем никаких действий
            return;
        }
        // Отправляем приветственное сообщение с кнопками
        await ctx.replyWithHTML(`<b>Добрый день ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец'}!\n\n</b>${start}`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "💸 ОПЛАТИТЬ 💸", callback_data: 'apply_for_payment' },
                    ],
                    [
                        { text: "🌐 Подробнее 🔗", url: webSpeak },
                    ],
                    [
                        { text: "📋 Тарифы 📋", callback_data: 'apply_for_tariff' },
                    ],
                ],
            }
        });
        // Отправляем второе сообщение с большими кнопками
        await ctx.reply("Задайте вопрос в сообщении  или сразу оплатить", {
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
// Функция для отправки клавиатуры
async function sendKeyboard(ctx, text) {
    await ctx.reply(text, {
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
// Функция для сохранения и отправки сообщений
async function handleMessage(data) {
    await consultationsService.saveMessage({
        chat_id: data.chat_id,
        message: data.message || "empty message",
        first_name: data.first_name || "не введено",
        last_name: data.last_name || "не введено",
        cause: data.cause || "empty_cause",
    });
    await senderService.sendMessage({
        chat_id: data.chat_id,
        message: data.message || "empty message",
        first_name: data.first_name || "не введено",
        last_name: data.last_name || "не введено",
        cause: data.cause || "empty_cause",
        username: data.username || "не введено",
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
    await sendKeyboard(ctx, "Оплата");
    console.log(ctx.message.from);
    const data = {
        chat_id: ctx.message.from.id,
        first_name: ctx.message.from.first_name,
        last_name: ctx.message.from.last_name,
        username: ctx.message.from.username,
        message: "Переход клиента на оплату речевого интенсива",
        cause: 'payment_press'
    };
    await handleMessage(data);
    await ctx.reply('Тариф “Я сама” 👩‍🏫\n' +
        '💰 Цена: 11 900 ₽\n' +
        '\n' +
        'Тариф “Все и сразу” 🚀\n' +
        '💰 Цена: 18 900 ₽\n' +
        '🏦 Доступна рассрочка от банка ( проценты по рассрочке платим мы )', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Оплатить тариф \"Я сама\"", url: paySpeakUndefended }
                ],
                [
                    { text: "Оплатить тариф \"Все и сразу\"", url: paySpeakAll }
                ]
            ],
        }
    });
});
speakBot.hears('Пользовательское соглашение', async (ctx) => {
    await ctx.reply("Вы будете переадресованы на сайт...", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Перейти на сайт", url: webTerms }
                ]
            ]
        }
    });
});
speakBot.hears('Политика конфиденциальности', async (ctx) => {
    await ctx.reply("Вы будете переадресованы на сайт...", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Перейти на сайт", url: webPrivacy }
                ]
            ]
        }
    });
});
speakBot.on('text', async (ctx) => {
    try {
        console.log(ctx.message.from);
        const data = {
            chat_id: ctx.message.from.id,
            first_name: ctx.message.from.first_name,
            last_name: ctx.message.from.last_name,
            username: ctx.message.from.username,
            message: ctx.message.text,
            cause: 'speak_request'
        };
        await handleMessage(data);
        await sendKeyboard(ctx, "Ваше сообщение отправлено...");
    }
    catch (error) {
        console.error("Ошибка при сохранении сообщения:", error);
        await ctx.reply("Произошла ошибка при отправке сообщения. Попробуйте снова.");
    }
});
speakBot.action('apply_for_payment', async (ctx) => {
    console.log(ctx.update.callback_query.from);
    const data = {
        chat_id: ctx.update.callback_query.from.id,
        first_name: ctx.update.callback_query.from.first_name,
        last_name: ctx.update.callback_query.from.last_name,
        username: ctx.update.callback_query.from.username,
        message: "Переход клиента на оплату речевого интенсива",
        cause: 'payment_press'
    };
    await handleMessage(data);
    // Ваш код для обработки нажатия на кнопку
    await ctx.answerCbQuery(); // Подтверждаем нажатие на кнопку
    await ctx.reply('Тариф “Я сама” 👩‍🏫\n' +
        '💰 Цена: 11 900 ₽\n' +
        '\n' +
        'Тариф “Все и сразу” 🚀\n' +
        '💰 Цена: 18 900 ₽\n' +
        '🏦 Доступна рассрочка от банка ( проценты по рассрочке платим мы )', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Оплатить тариф \"Я сама\"", url: paySpeakUndefended }
                ],
                [
                    { text: "Оплатить тариф \"Все и сразу\"", url: paySpeakAll }
                ]
            ],
        }
    });
});
speakBot.action('apply_for_tariff', async (ctx) => {
    // Ваш код для обработки нажатия на кнопку
    await ctx.answerCbQuery(); // Подтверждаем нажатие на кнопку
    console.log(ctx.update.callback_query.from);
    const data = {
        chat_id: ctx.update.callback_query.from.id,
        first_name: ctx.update.callback_query.from.first_name,
        last_name: ctx.update.callback_query.from.last_name,
        username: ctx.update.callback_query.from.username,
        message: "Переход на тарифные планы речевого интенсива",
        cause: 'speak_tariff_press'
    };
    await handleMessage(data);
    await ctx.replyWithHTML('<b>Тариф “Все и сразу” 👩‍🏫</b>\n' +
        '\n' +
        '🌟 <b>В состав входит:</b>\n' +
        '🎓 Бессрочный доступ ко всем материалам курса\n' +
        '🛠️ Пошаговая стратегия запуска речи\n' +
        '📝 5 тестов для оценки речевого развития\n' +
        '🎥 Более 30 видео по ключевым направлениям речевого развития ребенка\n' +
        '🧩 Более 150 практических заданий для ежедневной самостоятельной работы\n' +
        '🖥️ 4  вебинара с возможностью задать вопросы и получить разбор\n' +
        '📚 Конспекты и другие дополнительные материалы\n' +
        '💡 Комфортный формат получения информации\n' +
        '🤖 Доступ к рассылочному чат-боту\n' +
        '\n' +
        '✨ <b>Только для данного тарифа:</b>\n' +
        '📩 Регулярная обратная связь от куратора и автора курса\n' +
        '❓ Возможность получить ответы по всем возникающим вопросам\n' +
        '🎯 Персональные рекомендации по выполнению практических заданий\n' +
        '👥 Поддержка в групповом чате\n' +
        '🎁 Творческий речевой подарок от команды по окончанию курса' +
        '\n' +
        '🏦 Доступна рассрочка от банка ( проценты по рассрочке платим мы )', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Оплатить 18900 руб.", url: paySpeakAll }
                ],
            ],
        }
    });
    await ctx.replyWithHTML('<b>Тариф “Я сама” 👩‍🏫</b>\n' +
        '\n' +
        '🌟 <b>В состав входит:</b>\n' +
        '🎓 Бессрочный доступ ко всем материалам курса\n' +
        '🛠️ Пошаговая стратегия запуска речи\n' +
        ' 📝 5 тестов для оценки речевого развития\n' +
        '🎥 Более 30 видео по ключевым направлениям речевого развития ребенка\n' +
        '🧩 Более 150 практических заданий для ежедневной самостоятельной работы\n' +
        '🖥️ 4 живых вебинара\n' +
        '📚 Конспекты и другие дополнительные материалы\n' +
        '💡 Комфортный формат получения информации\n' +
        '🤖 Доступ к рассылочному чат-боту\n' +
        '\n' +
        '🏦 Доступна рассрочка от банка ( проценты по рассрочке платим мы )', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Оплатить 11900 руб.", url: paySpeakUndefended }
                ],
            ],
        }
    });
});
export { speakBot };
