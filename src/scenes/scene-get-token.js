const {Scenes: {BaseScene}} = require('telegraf');
const TelegramNotificationService = require('../exchange-postgres/telegram-notification-service');
const AppDataSource = require("../data-source");
const Sentry = require('../sentry');
const exchangeService = new TelegramNotificationService(AppDataSource);

class SceneGetToken {
    SaveTokenScene() {
        const set = new BaseScene('set');

        // Тайм-аут в 5 минут
        let timeout;

        set.enter(async (ctx) => {
            try {
                // Логируем вход в сцену
                Sentry.captureMessage('Пользователь вошел в сцену set для получения токена', {
                    level: 'info',
                    tags: { section: 'scene-get-token' },
                    extra: {
                        chatId: ctx.message.from.id,
                        user: ctx.message.from.username
                    }
                });

                await ctx.replyWithHTML('Для ответа через Plane введите <b>plane_api</b> токен');

                // Устанавливаем таймер на 5 минут (300000 миллисекунд)
                timeout = setTimeout(async () => {
                    await ctx.reply('Время ожидания истекло. Сообщение не отправлено в течение 5 минут.');

                    // Логируем истечение времени
                    Sentry.captureMessage('Тайм-аут: не получен токен в течение 5 минут', {
                        level: 'info',
                        tags: { section: 'scene-get-token' },
                        extra: {
                            chatId: ctx.message.from.id,
                            user: ctx.message.from.username
                        }
                    });

                    await ctx.scene.leave(); // Выход из сцены
                }, 300000); // 5 минут в миллисекундах
            } catch (error) {
                Sentry.captureException(error, {
                    tags: { section: 'scene-get-token' },
                    extra: { chatId: ctx.message.from.id, user: ctx.message.from.username }
                });
            }
        });

        set.on('text', async (ctx) => {
            try {
                clearTimeout(timeout); // Очищаем таймер, если пользователь отправил сообщение

                const userMessage = ctx.message.text;

                // Логируем сообщение пользователя
                Sentry.captureMessage('Получено сообщение от пользователя', {
                    level: 'info',
                    tags: { section: 'scene-get-token' },
                    extra: {
                        chatId: ctx.message.from.id,
                        user: ctx.message.from.username,
                        message: userMessage
                    }
                });

                // Проверяем, начинается ли сообщение с "plane_api_"
                if (!userMessage.startsWith('plane_api_')) {
                    await ctx.replyWithHTML(`Неправильный токен. Обратитесь в поддержку.`);

                    // Логируем неправильный токен
                    Sentry.captureMessage('Неправильный токен введен', {
                        level: 'warning',
                        tags: { section: 'scene-get-token' },
                        extra: {
                            chatId: ctx.message.from.id,
                            user: ctx.message.from.username,
                            message: userMessage
                        }
                    });
                } else {
                    // Проверка токена и сохранение пользователя
                    const result = await exchangeService.checkUserAndSaveToken(ctx.message.from, userMessage);
                    if (result) {
                        await ctx.replyWithHTML(`Токен успешно принят. Спасибо.`);

                        // Логируем успешное сохранение токена
                        Sentry.captureMessage('Токен успешно принят и сохранен', {
                            level: 'info',
                            tags: { section: 'scene-get-token' },
                            extra: {
                                chatId: ctx.message.from.id,
                                user: ctx.message.from.username
                            }
                        });
                    } else {
                        await ctx.replyWithHTML(`Что-то пошло не так. Обратитесь в поддержку.`);

                        // Логируем ошибку при сохранении токена
                        Sentry.captureMessage('Ошибка при сохранении токена', {
                            level: 'error',
                            tags: { section: 'scene-get-token' },
                            extra: {
                                chatId: ctx.message.from.id,
                                user: ctx.message.from.username
                            }
                        });
                    }
                }
            } catch (error) {
                // Логируем ошибку
                Sentry.captureException(error, {
                    tags: { section: 'scene-get-token' },
                    extra: { chatId: ctx.message.from.id, user: ctx.message.from.username }
                });

                await ctx.replyWithHTML(`Произошла ошибка. Пожалуйста, повторите позже или обратитесь в поддержку.`);
            } finally {
                await ctx.scene.leave(); // Выход из сцены в любом случае
            }
        });

        return set;
    }
}

module.exports = SceneGetToken;
