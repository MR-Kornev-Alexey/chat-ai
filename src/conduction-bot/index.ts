import {Telegraf} from "telegraf";
import {config} from "../config/config.js";
import consultationsService from "../services/common-db.js";
import senderService from "../services/sender.js";
import {MessagesData} from "../types/common.js";

const conductionBot = new Telegraf(config.CONDUCT_BOT_TOKEN);

const webTerms = config.URL_TERMS
const webPrivacy = config.URL_PRIVACY

const start =
    "Уникальность ведения -  одновременная  работа в двух направлениях – с мамой и с ребёнком. Такой подход гарантирует высокую эффективность и быстрые результаты.\n" +
    "\n" +
    "Что тебя ждет?\n" +
    "\n" +
    "Для мамы:\n" +
    "💡 Справимся с выгоранием, вернем твои силы и баланс. Ты снова почувствуешь радость материнства и обретешь ресурс и уверенность.\n" +
    "\n" +
    "Для малыша:\n" +
    "👶 Вместе разберемся с истериками, капризами, задержкой речи, зависимостью от гаджетов, проблемами с питанием и приучением к горшку. Прокачаем естественные умения и поможем раскрыть заложенный природой потенциал.\n" +
    "\n" +
    "Как это работает?\n" +
    "\n" +
    "🔹 Персональные консультации – онлайн или офлайн, по выбору.\n" +
    "🔹 Удобные созвоны, постоянное сопровождение и оперативные ответы на вопросы через WhatsApp/Telegram.\n" +
    "🔹 Индивидуальная стратегия и ежедневные материалы, чтобы шаг за шагом двигаться к результату.\n" +
    "🔹 Работа начинается после  индивидуального созвона, где  уточняем проблему и вырабатываем план действий индивидуально для вас с малышом."

conductionBot.start(async (ctx) => {
    try {
        const commandText = ctx.message.text.toLowerCase();

        // Проверяем, соответствует ли текст команды заданной команде
        if (commandText === '/start@mrk_new_bot') {
            // Проигнорируем команду и не выполняем никаких действий
            return;
        }

        // Отправляем приветственное сообщение с кнопками
        await ctx.replyWithHTML(
            `<b>Добрый день ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец'}!\n\n</b>${start}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {text: "📝 Подать заявку на ведение 📝", callback_data: 'apply_for_management'}
                        ],
                    ],
                }
            }
        );

        // Отправляем второе сообщение с большими кнопками
        await ctx.reply(
            "Задайте вопрос в сообщении  или подайте заявку",
            {
                reply_markup: {
                    keyboard: [
                        [
                            {text: "Пользовательское соглашение"},
                            {text: "Политика конфиденциальности"}
                        ]
                    ],
                    resize_keyboard: true, // Делает кнопки большими
                    one_time_keyboard: false // Кнопки исчезнут после нажатия
                }
            }
        );

        // Создаем или обновляем запись в таблице Telegrams и User
        await consultationsService.start({
            chat_id: ctx.message.from.id,
            first_name: ctx.message.from.first_name || "default",
            last_name: ctx.message.from.last_name || "default",
            username: ctx.message.from.username || "default",
        });

    } catch (e) {
        console.error("Error in /start command:", e);
    }
});


// Функция для отправки клавиатуры
async function sendKeyboard(ctx: any, text: string) {
    await ctx.reply(text, { // Невидимый символ
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
async function handleMessage(data: MessagesData) {

    await consultationsService.saveMessage({
        chat_id: data.chat_id,
        message: data.message || "empty message",
        first_name: data.first_name || "не введено",
        last_name:  data.last_name || "не введено",
        cause: data.cause || "empty_cause",
    });

    await senderService.sendMessage({
        chat_id: data.chat_id,
        message: data.message || "empty message",
        first_name: data.first_name || "не введено",
        last_name:  data.last_name || "не введено",
        cause: data.cause || "empty_cause",
        username: data.username  || "не введено",
    });
}

// Обработка команды /request
conductionBot.command('request', async (ctx) => {
    await sendKeyboard(ctx, "Вы подали заявку");
    console.log(ctx.message.from);

    const data = {
        chat_id: ctx.message.from.id,
        first_name: ctx.message.from.first_name,
        last_name: ctx.message.from.last_name,
        username: ctx.message.from.username,
        message: "Подана заявка на ведение",
        cause: 'conducting_request',
    };

    await handleMessage(data);

    const check = await consultationsService.checkPrivacyByClient(ctx.message.from.id);

    if (!check) {
        await ctx.reply(
            'На первом бесплатном созвоне (20–30 минут) мы подробно разберем вашу проблему и я расскажу, чем могу помочь.\n' +
            '\n' +
            'Для дальнейшей работы требуется ваше согласие на обработку персональных данных.\n\n Нажмите кнопку ниже.\n',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Даю согласие", callback_data: 'apply_for_privacy' }
                        ]
                    ],
                }
            }
        );
    } else {
        await ctx.reply('Ваша заявка принята. Спасибо!\n' +
            '\n' +
            'Наш менеджер скоро свяжется с вами для выбора удобного времени.\n' +
            '\n' +
            'Чтобы ускорить процесс, пожалуйста, напишите несколько вариантов дня и времени (по МСК), когда вам удобно.\n');
    }
});

conductionBot.hears('Пользовательское соглашение', async (ctx) => {
    await ctx.reply("Вы будете переадресованы на сайт...", {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: "Перейти на сайт", url: webTerms}
                ]
            ]
        }
    });
});

conductionBot.hears('Политика конфиденциальности', async (ctx) => {
    await ctx.reply("Вы будете переадресованы на сайт...", {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: "Перейти на сайт", url: webPrivacy}
                ]
            ]
        }
    });
});

conductionBot.on('text', async (ctx) => {
    try {
        console.log(ctx.message.from)
        const data = {
            chat_id: ctx.message.from.id,
            first_name:ctx.message.from.first_name,
            last_name:ctx.message.from.last_name,
            username:ctx.message.from.username,
            message: ctx.message.text,
            cause: 'conducting_request'
        }
        await handleMessage(data);
        await sendKeyboard(ctx, "Ваше сообщение отправлено...");
    } catch (error) {
        console.error("Ошибка при сохранении сообщения:", error);
        await ctx.reply("Произошла ошибка при отправке сообщения. Попробуйте снова.");
    }
});

conductionBot.action('apply_for_management', async (ctx) => {
    console.log(ctx.update.callback_query.from)
    const data = {
        chat_id: ctx.update.callback_query.from.id,
        first_name:ctx.update.callback_query.from.first_name,
        last_name:ctx.update.callback_query.from.last_name,
        username:ctx.update.callback_query.from.username,
        message: "Подана заявка на сопровождение",
        cause: 'conducting_request'
    }
     await handleMessage(data);
    // Ваш код для обработки нажатия на кнопку
    await ctx.answerCbQuery(); // Подтверждаем нажатие на кнопку
    const check = await consultationsService.checkPrivacyByClient(ctx.update.callback_query.from.id);

    if (!check) {
        await ctx.reply(
            'На первом бесплатном созвоне (20–30 минут) мы подробно разберем вашу проблему и я расскажу, чем могу помочь.\n' +
            '\n' +
            'Для дальнейшей работы требуется ваше согласие на обработку персональных данных.\n\n Нажмите кнопку ниже.\n',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Даю согласие", callback_data: 'apply_for_privacy' }
                        ]
                    ],
                }
            }
        );
    } else {
        await ctx.reply('Ваша заявка принята. Спасибо!\n' +
            '\n' +
            'Наш менеджер скоро свяжется с вами для выбора удобного времени.\n' +
            '\n' +
            'Чтобы ускорить процесс, пожалуйста, напишите несколько вариантов дня и времени (по МСК), когда вам удобно.\n');
    }
});

conductionBot.action('apply_for_privacy', async (ctx) => {
    // Ваш код для обработки нажатия на кнопку
    await ctx.answerCbQuery(); // Подтверждаем нажатие на кнопку
    console.log(ctx.update.callback_query.from)
    const data = {
        chat_id: ctx.update.callback_query.from.id,
        first_name:ctx.update.callback_query.from.first_name,
        last_name:ctx.update.callback_query.from.last_name,
        username:ctx.update.callback_query.from.username,
        message: "Согласие на обработку персональных данных получено",
        cause: 'privacy_request'
    }
    await handleMessage(data);
    await ctx.reply('Ваша заявка принята. Спасибо!\n' +
        '\n' +
        'Наш менеджер скоро свяжется с вами для выбора удобного времени.\n' +
        '\n' +
        'Чтобы ускорить процесс, пожалуйста, напишите несколько вариантов дня и времени (по МСК), когда вам удобно.\n');
});


export {conductionBot};

