import { Telegraf } from "telegraf";
import { config } from "../config/config.js";
import consultationsService from "../services/consultations.js";
import senderService from "../services/sender.js";
const conductionBot = new Telegraf(config.CONDUCT_BOT_TOKEN);

const webPayment = config.URL_PAY_CONSULTATION
const webCall = config.URL_CALL_CONDUCTING
const webTerms = config.URL_TERMS
const webPrivacy = config.URL_PRIVACY
const start = "Материнство без выгорания и чувства вины – это реальность!\n" +
     "Ты не обязана решать проблемы в одиночку. Если непонимание происходящего с ребёнком, усталость, срывы и чувство вины стали твоими постоянными спутниками, я предлагаю персональное экспертное сопровождение для тебя и малыша.\n" +
     "Уникальность  -  одновременная  работа в двух направлениях – с мамой и с ребёнком. Такой подход гарантирует высокую эффективность и быстрые результаты.\n" +
     "Что тебя ждет?\n" +
     "Для мамы:\n" +
     " 💡 Справимся с выгоранием, вернем твои силы и баланс. Ты снова почувствуешь радость материнства и обретешь ресурс и уверенность.\n" +
     "Для малыша:\n" +
     " 👶 Вместе разберемся с истериками, капризами, задержкой речи, зависимостью от гаджетов, проблемами с питанием и приучением к горшку. Прокачаем естественные умения и поможем раскрыть заложенный природой потенциал.\n" +
     "Как это работает?\n" +
     "🔹 Персональные консультации – онлайн или офлайн, по выбору.\n" +
     "🔹 Удобные созвоны, постоянное сопровождение и оперативные ответы на вопросы через WhatsApp/Telegram.\n" +
     "🔹 Индивидуальная стратегия и ежедневные материалы, чтобы шаг за шагом двигаться к результату.\n" +
     " 🔹 Работа начинается с индивидуального созвона, где  уточняем проблему и вырабатываем план действий индивидуально для вас с малышом.\n" +
     "Прими решение сегодня, чтобы завтра радоваться яркому материнству без выгорания и с любовью к себе и своему малышу!\n"


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
            `<b>Добрый день ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец'}!\n</b>${start}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "📝 Подать заявку на ведение 📝", url: webCall }
                        ],
                    ],
                }
            }
        );

        // Отправляем второе сообщение с большими кнопками
        await ctx.reply(
            "Вы можете задать вопрос или оставить заявку на ведение",
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
conductionBot.hears('Пользовательское соглашение', async (ctx) => {
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

conductionBot.hears('Политика конфиденциальности', async (ctx) => {
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

conductionBot.on('text', async (ctx) => {
    try {
        // Сохраняем сообщение в таблице Chats
        await consultationsService.saveMessage({
            chat_id: ctx.message.from.id,
            message: ctx.message.text,
            first_name: ctx.message.from.first_name || "default",
            last_name: ctx.message.from.last_name || "default",
            cause: "conducting_request"
        });

        await senderService.sendMessage({
                chat_id: ctx.message.from.id,
                letter: ctx.message.text,
                first_name: ctx.message.from.first_name || "nothing",
                last_name: ctx.message.from.last_name || "nothing",
                username: ctx.message.from.username || "nothing",
                cause: "conducting_request"
            }
        )
        // Отправляем подтверждение пользователю
        await ctx.reply("Ваше сообщение отправлено!");
    } catch (error) {
        console.error("Error saving message:", error);
        await ctx.reply("Произошла ошибка при сохранении сообщения.");
    }
});


export { conductionBot };

