import prisma from "../config/db.config.js";
class ChatsController {
    static async index(req, res) {
        const { groupId } = req.params;
        const chats = await prisma.chats.findMany();
        return res.json({ data: chats });
    }
}
export default ChatsController;
