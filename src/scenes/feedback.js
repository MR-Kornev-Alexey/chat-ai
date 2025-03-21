const {Scenes: {BaseScene}, Markup} = require('telegraf');
const Sentry = require('../sentry');
const createFeedbackInPlane = require("../send-to-plane/create-feedback-to-plane");
const deleteFeedbackInPlane = require("../send-to-plane/delete-prev-issue");
const keyboard = {
    reply_markup: {
        keyboard: [
            [
                { text: 'Tex.поддержка' },
                { text: 'Обратная связь' }
            ]
        ],
        resize_keyboard: true, // Уменьшаем размер кнопок
        one_time_keyboard: true // Скрываем клавиатуру после нажатия на кнопку
    }
};
class MainSceneFeedBack {
    FirstFeedBackScene() {
        const feedback = new BaseScene('feedback');
        let timeout;
        feedback.enter(async (ctx) => {
            try {
                await ctx.reply(`Напишите свой отзыв о нас`);
                // Логируем вход в сцену
                Sentry.captureMessage('Пользователь вошел в сцену feedback', {
                    level: 'info',
                    tags: {section: 'scene-feedback'},
                    extra: {
                        userTelegramId: ctx.message.from.id,
                    }
                });
                // Устанавливаем таймер на 5 минут (300000 миллисекунд)
                timeout = setTimeout(async () => {
                    await ctx.reply('Время ожидания истекло. Сообщение не отправлено в течение 3 минут.');

                    // Логируем тайм-аут
                    Sentry.captureMessage('Тайм-аут 1 сцены feedback истек', {
                        level: 'info',
                        tags: {section: '1 scene-feedback'},
                        extra: {
                            userTelegramId: ctx.message.from.id
                        }
                    });
                    await ctx.scene.leave(); // Выход из сцены
                }, 180000); // 3 минут в миллисекундах
            } catch (error) {
                Sentry.captureException(error, {
                    tags: {section: '1 scene-feedback'},
                    extra: {
                        userTelegramId: ctx.message.from.id,
                    }
                });
            }
        });
        feedback.on('text', async (ctx) => {
            clearTimeout(timeout);
            try {
                // console.log(ctx.message.text);
                const message =
                    `<p>отзыв : ${ctx.message.text}</p>
                     <p>Без оценки</p>`
                await createFeedbackInPlane(ctx.message.from.id,message)
                Sentry.captureMessage('Пользователь ответил в первой цене feedback', {
                    level: 'info',
                    tags: {section: '1 scene-feedback'},
                    extra: {
                        userTelegramId: ctx.message.from.id,
                        userMessage: ctx.message.text
                    }
                });
                ctx.session = ctx.session || {};
                ctx.session.feedback = ctx.message.text;
                ctx.session.id = ctx.message.from.id;

                if (ctx.message.text.length > 1) {
                    await ctx.scene.enter('rate')
                } else {
                    await ctx.scene.leave()
                }
            } catch (error) {
                console.log(error)
                Sentry.captureException(error, {
                    tags: {section: '1 scene-feedback'},
                    extra: {
                        userTelegramId: ctx.message.from.id,
                    }
                });
            }
        })
        feedback.on('message', async (ctx) => {
            await ctx.reply('Это явно не ответ')
            await ctx.scene.reenter()
        })
        return feedback;
    }

    RateFeedBackScene() {
        const rate = new BaseScene('rate');
        const ratingKeyboard = Markup.inlineKeyboard([
            [
                Markup.button.callback('0', 'rate_0'),
                Markup.button.callback('1', 'rate_1'),
                Markup.button.callback('2', 'rate_2'),
                Markup.button.callback('3', 'rate_3'),
                Markup.button.callback('4', 'rate_4'),
                Markup.button.callback('5', 'rate_5'),
            ],
            [
                Markup.button.callback('6', 'rate_6'),
                Markup.button.callback('7', 'rate_7'),
                Markup.button.callback('8', 'rate_8'),
                Markup.button.callback('9', 'rate_9'),
                Markup.button.callback('10', 'rate_10'),
            ]
        ]);
        let timeout;
        rate.enter(async (ctx) => {
            try {
               await ctx.reply('Оцените работу нашего сервиса от 0 до 10', ratingKeyboard);
                // Логируем вход в сцену
                Sentry.captureMessage('Пользователь вошел в сцену оценки рейтинга feedback', {
                    level: 'info',
                    tags: {section: 'rate scene-feedback'},
                    extra: {
                        userTelegramId: ctx.message.from.id,
                    }
                });
                // Устанавливаем таймер на 5 минут (300000 миллисекунд)
                timeout = setTimeout(async () => {
                    await ctx.reply('Время ожидания истекло. Сообщение не отправлено в течение 3 минут.');

                    // Логируем тайм-аут
                    Sentry.captureMessage('Тайм-аут 1 сцены feedback истек', {
                        level: 'info',
                        tags: {section: '1 scene-feedback'},
                        extra: {
                            userTelegramId: ctx.message.from.id
                        }
                    });
                    await ctx.scene.leave(); // Выход из сцены
                }, 180000); // 3 минут в миллисекундах
            } catch (error) {
                Sentry.captureException(error, {
                    tags: {section: '1 scene-feedback'},
                    extra: {
                        userTelegramId: ctx.message.from.id,
                    }
                });
            }
        });
        // Обработчик нажатий на кнопки
        rate.action(/^rate_\d+$/, async (ctx) => {
            clearTimeout(timeout);
            const rating = ctx.match[0].split('_')[1]; // Извлекаем значение из кнопки
            // Получаем отзыв из контекста
            await deleteFeedbackInPlane(ctx.session.id) // удаляем предыдущую без оценки
            const message =
                `<p>отзыв : ${ctx.session.feedback}</p>
                 <p>оценка: ${rating}</p>`

            await createFeedbackInPlane(ctx.session.id, message)
            if (Number(rating) >= 6) {
                await ctx.reply(
                    `Спасибо за вашу оценку ${rating} и отзыв!\n\nМы ценим ваше мнение и продолжаем работать над тем, чтобы радовать вас качественным сервисом.`, keyboard
                );
            } else {
                await ctx.reply(
                    `Спасибо за ваш отзыв и оценку.\n\nВаше мнение очень важно для нас. Мы постоянно совершенствуем наш сервис и делаем всё возможное, чтобы исправлять ошибки и улучшать сервис.` ,keyboard
                );
            }
            await ctx.scene.leave()
        });
        rate.on('message', async (ctx) => {
            await ctx.reply('Это явно не число')
            await ctx.scene.reenter()
        })
        return rate;
    }
}

module.exports = MainSceneFeedBack;