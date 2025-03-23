import { Router } from "express";
const router = Router();
import AuthController from "../controllers/AuthController.js";
import authMiddleware from "../middleware/AuthMiddleware.js";
import UsersController from "../controllers/UsersController.js";

// Auth Routes
router.post("/auth/login", AuthController.login);

//  User Routes
router.get("/group-user", authMiddleware, UsersController.getAllUsers);



// router.get("/chat-group", authMiddleware, UsersController.index);
// router.get("/chat-group/:id", UsersController.show);
// router.post("/chat-group", authMiddleware, UsersController.store);
// router.put("/chat-group/:id", authMiddleware, UsersController.update);
// router.delete("/chat-group/:id", authMiddleware, UsersController.destroy);

// // * Chat group user
// router.get("/chat-group-user", ChatGroupUserController.index);
// router.post("/chat-group-user", ChatGroupUserController.store);
//
// // * Chats
// router.get("/chats/:groupId", ChatsController.index);

export default router;
