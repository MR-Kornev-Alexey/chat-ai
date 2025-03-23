import { Telegraf } from "telegraf";
import { config } from "../config/config.js";
import consultationsService from "../services/common-db.js";
import senderService from "../services/sender.js";
import {MessagesData} from "../types/common.js";
import {handlePolicyAgreement} from "../component/handlePolicyAgreement.js";
import {conductionBot} from "../conduction-bot/index.js";
import {sendKeyboard} from "../component/sendKeyboard.js";
import {handleMessage} from "../component/handleMessage.js";


const token = process.env.NODE_ENV === 'production'
    ? config.CONS_BOT_TOKEN
    : config.DEV_CONS_BOT_TOKEN;

if (!token) {
    throw new Error('AnswererBot token is not defined!');
}
const consultationBot = new Telegraf(token);

const webTerms = config.URL_TERMS
const webPrivacy = config.URL_PRIVACY

const start = "Если вы хотите понять, что происходит с вашим ребенком. Запутались в разрозненных диагнозах, рекомендациях и советах. Устали от бесконечных истерик, капризов и непонимания того, что происходит.\n" +
    "Тогда эта консультация для вас!\n" +
    "\n"+
    "🔹 Капризы и истерики:\n" +
    " Мы разберемся, что стоит за поведением ребёнка, и найдем конкретные способы, чтобы справиться с эмоциональными всплесками.\n" +
    "🔹 Задержка речи, зависимость от гаджетов, проблемы с питанием:" +
    " Я подскажу, как помочь малышу развиваться гармонично, без стресса для вас обоих.\n" +
    "🔹 Усталость, выгорание, чувство вины и срывы на ребёнке:" +
    " Восстановим баланс, уберём чувство вины и вернём радость материнства.\n" +
    "🔹 Проблемы со здоровьем, стратегии воспитания, развитие без насилия и МНОГОЕ ДРУГОЕ:" +
    " Я помогу разобраться даже в самых сложных вопросах.\n" +
    "\n"+
    "👩‍⚕️ 30+ лет опыта в материнстве, развитии, психологии и педиатрии – теперь для вас!\n" +
    "\n"+
    " Я внимательно проанализирую вашу ситуацию, изучу имеющиеся медицинские документы, подробно объясню и предоставлю четкий план действий, практические инструменты и поддержку. \n" +
    "\n"+
    "Консультация проходит как онлайн в удобное для вас время (около 90 минут) с возможностью задать уточняющие вопросы в течение недели после встречи.\n"

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
            `<b>Добрый день ${ctx.message.from.first_name ? ctx.message.from.first_name : 'незнакомец'}!</b>\n\n${start}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "📝 Подать заявку на консультацию 📝", callback_data: 'apply_for_consultation' }
                        ]
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



consultationBot.command('request', async (ctx) => {
    await sendKeyboard(ctx, "Вы подали заявку...");
    console.log(ctx.message.from);

    const data = {
        chat_id: ctx.message.from.id,
        first_name: ctx.message.from.first_name,
        last_name: ctx.message.from.last_name,
        username: ctx.message.from.username,
        message: "Подана заявка на консультацию",
        cause: 'consultation_request',
    };

    await handleMessage(data);
    const check = await consultationsService.checkPrivacyByClient(ctx.message.from.id);
    if (!check) {
        await ctx.reply(
            'В ближайшее время с вами свяжется менеджер для согласования удобного времени. Для дальнейшей работы требуется ваше согласие на обработку персональных данных.\n\nНажмите кнопку ниже.',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Даю согласие", callback_data: 'apply_for_privacy' }
                        ]
                    ],
                }
            });
    } else {
        await ctx.reply('Ваша заявка принята. Спасибо!\n' +
            '\n' +
            'Наш менеджер скоро свяжется с вами для выбора удобного времени.\n' +
            '\n' +
            'Чтобы ускорить процесс, пожалуйста, напишите несколько вариантов дня и времени (по МСК), когда вам удобно.\n');
    }


});

consultationBot.hears('Пользовательское соглашение', async (ctx) => {
    await handlePolicyAgreement(ctx, "Вы будете переадресованы на сайт...", webTerms);
});

consultationBot.hears('Политика конфиденциальности', async (ctx) => {
    await handlePolicyAgreement(ctx, "Вы будете переадресованы на сайт...", webPrivacy);
});
consultationBot.on('text', async (ctx) => {
    try {
        await sendKeyboard(ctx, "Ваше сообщение отправлено...");
        const data = {
            chat_id: ctx.message.from.id,
            first_name:ctx.message.from.first_name,
            last_name:ctx.message.from.last_name,
            username:ctx.message.from.username,
            message: ctx.message.text,
            cause: 'consultation_request'
        }
        await handleMessage(data);

    } catch (error) {
        console.error("Ошибка при сохранении сообщения:", error);
        await ctx.reply("Произошла ошибка при отправке сообщения. Попробуйте снова.");
    }
});

consultationBot.action('apply_for_consultation', async (ctx) => {
    console.log(ctx.update.callback_query.from)
    const data = {
        chat_id: ctx.update.callback_query.from.id,
        first_name:ctx.update.callback_query.from.first_name,
        last_name:ctx.update.callback_query.from.last_name,
        username:ctx.update.callback_query.from.username,
        message: "Подана заявка на консультацию",
        cause: 'conducting_request'
    }
    await handleMessage(data);
    // Ваш код для обработки нажатия на кнопку
    await ctx.answerCbQuery(); // Подтверждаем нажатие на кнопку
    const check = await consultationsService.checkPrivacyByClient(ctx.update.callback_query.from.id);
    if (!check) {
        await ctx.reply(
            'В ближайшее время с вами свяжется менеджер для согласования удобного времени. Для дальнейшей работы требуется ваше согласие на обработку персональных данных.\n\nНажмите кнопку ниже.',
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Даю согласие", callback_data: 'apply_for_privacy' }
                        ]
                    ],
                }
            });
    } else {
        await ctx.reply('Ваша заявка принята. Спасибо!\n' +
            '\n' +
            'Наш менеджер скоро свяжется с вами для выбора удобного времени.\n' +
            '\n' +
            'Чтобы ускорить процесс, пожалуйста, напишите несколько вариантов дня и времени (по МСК), когда вам удобно.\n');
    }
});

consultationBot.action('apply_for_privacy', async (ctx) => {
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
        '\n'+
        'Чтобы ускорить процесс, пожалуйста, напишите несколько вариантов дня и времени (по МСК), когда вам удобно.\n');
    // Дополнительные действия, например, запрос данных у пользователя
});

// Согласие на обработку персональных данных
export { consultationBot };

