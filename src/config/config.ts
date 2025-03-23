import dotenv from "dotenv";
dotenv.config();

export const config = {
    CONS_BOT_TOKEN: process.env.CONS_BOT_TOKEN || "",
    CONDUCT_BOT_TOKEN: process.env.CONDUCT_BOT_TOKEN || "",
    ANSWER_BOT_TOKEN: process.env.ANSWER_BOT_TOKEN || "",
    SPEAK_BOT_TOKEN: process.env.SPEAK_BOT_TOKEN || "",
    DEV_CONS_BOT_TOKEN: process.env.DEV_CONS_BOT_TOKEN || "",
    DEV_CONDUCT_BOT_TOKEN: process.env.DEV_CONDUCT_BOT_TOKEN || "",
    DEV_SPEAK_BOT_TOKEN: process.env.DEV_SPEAK_BOT_TOKEN || "",
    DEV_ANSWER_BOT_TOKEN: process.env.DEV_ANSWER_BOT_TOKEN || "",
    DB_HOST: process.env.DB_HOST || "localhost",
    DB_PORT: Number(process.env.DB_PORT) || 3306,
    DB_USER: process.env.DB_USER || "root",
    DB_PASSWORD: process.env.DB_PASSWORD || "",
    DB_NAME: process.env.DB_NAME || "telegram_bot",
    URL_PRIVACY:process.env.URL_PRIVACY || "",
    URL_TERMS:process.env.URL_TERMS || "",
    URL_CONSULTATION:process.env.URL_CONSULTATION || "",
    URL_CALL_CONSULTATION:process.env.URL_CALL_CONSULTATION || "",
    URL_CALL_CONDUCTING:process.env.URL_CALL_CONDUCTING || "",
    URL_PAY_CONSULTATION:process.env.URL_PAY_CONSULTATION || "",
    URL_SPEAK_INTENSIVE:process.env.URL_SPEAK_INTENSIVE || "",
    URL_PAY_SPEAK_ALL: process.env.URL_PAY_SPEAK_ALL || "",
    URL_PAY_SPEAK_INDEPENDENT: process.env.URL_PAY_SPEAK_INDEPENDENT || "",
};
