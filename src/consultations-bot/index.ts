import { Telegraf } from "telegraf";
import { config } from "../config/config.js";
import consultationsService from "../services/consultations.js";
import senderService from "../services/sender.js";
const consultationBot = new Telegraf(config.CONS_BOT_TOKEN);

const webPayment = config.URL_PAY_CONSULTATION
const webCall = config.URL_CALL_CONSULTATION
const webTerms = config.URL_TERMS
const webPrivacy = config.URL_PRIVACY

const start = "Если вы хотите понять, что происходит с вашим ребенком. Запутались в разрозненных диагнозах, рекомендациях и советах. Устали от бесконечных истерик, капризов и непонимания того, что происходит.\n" +
    "Тогда эта консультация для вас!\n" +
    "🔹 Капризы и истерики:\n" +
    " Мы разберемся, что стоит за поведением ребёнка, и найдем конкретные способы, чтобы справиться с эмоциональными всплесками.\n" +
    "🔹 Задержка речи, зависимость от гаджетов, проблемы с питанием:\n" +
    " Я подскажу, как помочь малышу развиваться гармонично, без стресса для вас обоих.\n" +
    "🔹 Усталость, выгорание, чувство вины и срывы на ребёнке:\n" +
    " Восстановим баланс, уберём чувство вины и вернём радость материнства.\n" +
    "🔹 Проблемы со здоровьем, стратегии воспитания, развитие без насилия: и МНОГОЕ ДРУГОЕ\n" +
    " Я помогу разобраться даже в самых сложных вопросах.\n" +
    "👩‍⚕️ 30+ лет опыта в материнстве, развитии, психологии и педиатрии – теперь для вас!\n" +
    " Я внимательно проанализирую вашу ситуацию, изучу имеющиеся медицинские документы, подробно объясню и предоставлю четкий план действий, практические инструменты и поддержку. \n" +
    "Консультация проходит как онлайн, так и офлайн в удобное для вас время (около 90 минут) с возможностью задать уточняющие вопросы в течение недели после встречи.\n"

    consultationBot.start(async (ctx) => {
    try {
        const commandText = ctx.message.text.toLowerCase();

        // Проверяем, соответствует ли текст команды заданной команде
        if (commandText === '/start@mrk_new_bot') {
            // Проигнорируем команду и не выполняем никаких действий
            return;
        }

        // Отправляем приветственное сообщение с кнопками
        await ctx.replyWithHTML(
            `<b>Добрый день ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец'}!</b>\n${start}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "📝 Подать заявку 📝", url: webCall }
                        ],
                        [
                            { text: "💰 Оплатить консультацию 💰", url: webPayment }
                        ],
                    ],
                }
            }
        );

        // Отправляем второе сообщение с большими кнопками
        await ctx.reply(
            "Вы можете задать оставить заявку, оплатить или задать вопрос",
            {
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
consultationBot.hears('Пользовательское соглашение', async (ctx) => {
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

consultationBot.hears('Политика конфиденциальности', async (ctx) => {
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

consultationBot.on('text', async (ctx) => {
    try {
        // Сохраняем сообщение в таблице Chats
        await consultationsService.saveMessage({
            chat_id: ctx.message.from.id,
            message: ctx.message.text,
            first_name: ctx.message.from.first_name || "default",
            last_name: ctx.message.from.last_name || "default",
            cause: "consultation_request"
        });

        await senderService.sendMessage({
                chat_id: ctx.message.from.id,
                letter: ctx.message.text,
                first_name: ctx.message.from.first_name || "nothing",
                last_name: ctx.message.from.last_name || "nothing",
                username: ctx.message.from.username || "nothing",
                cause: "consultation_request"
            }
        )
        // Отправляем подтверждение пользователю
        await ctx.reply("Ваше сообщение отправлено!");
    } catch (error) {
        console.error("Error saving message:", error);
        await ctx.reply("Произошла ошибка при сохранении сообщения.");
    }
});


export { consultationBot };

