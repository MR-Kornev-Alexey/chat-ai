import {MessagesData} from "../types/common.js";
import consultationsService from "../services/common-db.js";
import senderService from "../services/sender.js";

export async function handleMessage(data: MessagesData) {

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
