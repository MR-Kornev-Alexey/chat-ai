import prisma from "../config/db.config.js";
import answererService from "./answerer.js";
class ConsultationsService {
    async findUserByChatId(chat_id) {
        return prisma.telegrams.findUnique({
            where: {
                chat_id: chat_id,
            },
            include: {
                user: true, // Включаем связанного пользователя
            },
        });
    }
    async checkPrivacyByClient(chat_id) {
        const findUser = await this.findUserByChatId(chat_id);
        // Если пользователь не найден — сразу возвращаем false
        if (!findUser || !findUser.user) {
            return false;
        }
        // Проверяем наличие записи
        const check = await prisma.chats.findFirst({
            where: {
                user_id: findUser.user.id,
                cause: 'privacy_request',
            },
        });
        // Превращаем результат в true/false
        return !!check;
    }
    async start(data) {
        let findUser;
        try {
            // Ищем запись в таблице Telegrams
            findUser = await this.findUserByChatId(data.chat_id);
            // Если запись не найдена, создаем новую
            if (!findUser) {
                // Создаем запись в таблице Telegrams
                const newUser = await prisma.user.create({
                    data: {
                        name: `${data.first_name || "default"} ${data.last_name || ""}`.trim(), // Объединяем first_name и last_name
                        email: `${data.chat_id}@telegram.com`, // Уникальный email на основе chat_id
                        provider: "telegram",
                        oauth_id: data.chat_id.toString(),
                        image: null,
                    },
                });
                findUser = await prisma.telegrams.create({
                    data: {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        username: data.username,
                        chat_id: data.chat_id,
                        user_id: newUser.id,
                    },
                });
            }
            return findUser;
        }
        catch (error) {
            console.error("Error in ConsultationsService.start:", error);
            throw error; // Пробрасываем ошибку для обработки в вызывающем коде
        }
    }
    async startManager(data) {
        let findUser;
        try {
            // Ищем запись в таблице Managers
            findUser = await prisma.tracking.findUnique({
                where: {
                    chat_id: data.chat_id,
                }
            });
            // Если запись не найдена, создаем новую
            if (!findUser) {
                findUser = await prisma.tracking.create({
                    data: {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        username: data.username,
                        chat_id: data.chat_id,
                    },
                });
            }
            return findUser;
        }
        catch (error) {
            console.error("Error in ConsultationsService.start:", error);
            throw error; // Пробрасываем ошибку для обработки в вызывающем коде
        }
    }
    async saveMessage(data) {
        try {
            // Ищем запись в таблице Telegrams и включаем связанного пользователя
            const telegramUser = await prisma.telegrams.findUnique({
                where: { chat_id: data.chat_id },
                include: {
                    user: true, // Включаем связанного пользователя
                },
            });
            // Если запись не найдена, выбрасываем ошибку
            if (!telegramUser) {
                throw new Error("Telegram user not found");
            }
            // Если связанный пользователь не найден, выбрасываем ошибку
            if (!telegramUser.user) {
                throw new Error("Associated user not found");
            }
            // Создаем запись в таблице Chats
            return await prisma.chats.create({
                data: {
                    cause: data.cause,
                    message: data.message,
                    clients_name: `${telegramUser.chat_id || ""} ${data.first_name || ""} ${data.last_name || ""}`.trim(), // Сохраняем имя клиента
                    user_id: telegramUser.user.id, // Используем user_id из связанного пользователя
                },
            });
        }
        catch (error) {
            console.error("Error in saveMessage:", error);
            throw error;
        }
    }
    async saveComment(chat_id, cause, username, comment, answersID) {
        try {
            // Ищем запись в таблице Telegrams и включаем связанного пользователя
            const telegramUser = await prisma.telegrams.findUnique({
                where: { chat_id: chat_id },
                include: {
                    user: true, // Включаем связанного пользователя
                },
            });
            // Если запись не найдена, выбрасываем ошибку
            if (!telegramUser) {
                throw new Error("Telegram user not found");
            }
            // Если связанный пользователь не найден, выбрасываем ошибку
            if (!telegramUser.user) {
                throw new Error("Associated user not found");
            }
            // Создаем запись в таблице Chats
            await prisma.chats.create({
                data: {
                    cause: cause,
                    message: comment,
                    clients_name: `${telegramUser.chat_id || ""} ${telegramUser.first_name || ""} ${telegramUser.last_name || ""}`.trim(), // Сохраняем имя клиента
                    managers_name: answersID.toString(),
                    user_id: telegramUser.user.id, // Используем user_id из связанного пользователя
                },
            });
            await answererService.sendAnswerToClient(cause, comment, chat_id);
        }
        catch (error) {
            console.error("Error in saveMessage:", error);
            throw error;
        }
    }
}
export default new ConsultationsService();
