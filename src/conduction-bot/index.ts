import {Telegraf} from "telegraf";
import {config} from "../config/config.js";
import consultationsService from "../services/common-db.js";
import senderService from "../services/sender.js";
import {MessagesData} from "../types/common.js";
import {handlePolicyAgreement} from "../component/handlePolicyAgreement.js";
import {handleMessage} from "../component/handleMessage.js";
import {sendKeyboard} from "../component/sendKeyboard.js";


const token = process.env.NODE_ENV === 'production'
    ? config.CONDUCT_BOT_TOKEN
    : config.DEV_CONDUCT_BOT_TOKEN;

if (!token) {
    throw new Error('AnswererBot token is not defined!');
}
const conductionBot = new Telegraf(token);


const webTerms = config.URL_TERMS
const webPrivacy = config.URL_PRIVACY

const start =
    `<b>Уникальность разбора с Еленой Корневой</b>

Разбор — это не просто консультация, а глубокая работа <b>в двух направлениях</b>: с мамой и с ребёнком. Такой подход позволяет быстрее решить текущие трудности и добиться устойчивых изменений.

<b>Что вас ждёт?</b>

👩 <b>Для мамы:</b>  
• Разберёмся с выгоранием, усталостью и чувством вины  
• Вернём силы, радость материнства и уверенность в себе  

👶 <b>Для ребёнка:</b>  
• Поможем с истериками, капризами, речью, гаджетами, сном, питанием  
• Раскроем природный потенциал, усилим навыки  

<b>Как проходит разбор?</b>  
1. Вы заполняете анкету  
2. Бронируете удобное время  
3. На встрече Елена анализирует ситуацию и даёт чёткий план действий 

<b>Важно:</b> Елена лично рассматривает каждую анкету. Чтобы сохранять качество работы и уделить внимание каждой семье, <b>она может отказать в разборе</b>, если поймёт, что сейчас не сможет быть полезной.  
Это всегда делается бережно и с уважением 💛

Готовы сделать шаг к переменам? Нажмите "Подать заявку"👇
`

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
                            {text: "📝 Подать заявку 📝", callback_data: 'apply_for_management'}
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


// Обработка команды /request
conductionBot.command('request', async (ctx) => {
    await sendKeyboard(ctx, "Вы подали заявку ...");

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
    await handlePolicyAgreement(ctx, "Вы будете переадресованы на сайт...", webTerms);
});

conductionBot.hears('Политика конфиденциальности', async (ctx) => {
    await handlePolicyAgreement(ctx, "Вы будете переадресованы на сайт...", webPrivacy);
});

conductionBot.on('text', async (ctx) => {
    try {
      await sendKeyboard(ctx, "Ваше сообщение отправлено...");
        const data = {
            chat_id: ctx.message.from.id,
            first_name:ctx.message.from.first_name,
            last_name:ctx.message.from.last_name,
            username:ctx.message.from.username,
            message: ctx.message.text,
            cause: 'conducting_request'
        }
        await handleMessage(data);
    } catch (error) {
        console.error("Ошибка при сохранении сообщения:", error);
        await ctx.reply("Произошла ошибка при отправке сообщения. Попробуйте снова.");
    }
});

conductionBot.action('apply_for_management', async (ctx) => {

    await sendKeyboard(ctx, "Заявка отправлена...");
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

    await sendKeyboard(ctx, "Согласие отправлено...");   // Подтверждаем нажатие на кнопку
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

