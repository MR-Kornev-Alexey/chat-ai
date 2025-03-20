import express, { Application, Request, Response } from "express";
import "dotenv/config";
import cors from "cors";
import Routes from "./routes/index.js";
const app: Application = express();
const PORT = process.env.PORT || 8000;
import { consultationBot } from "./consultations-bot/index.js";
import {answererBot} from "./answerer-bot/index.js";

// * Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req: Request, res: Response) => {
  return res.send("It's working 🙌");
});

// * Routes
app.use("/api", Routes);

consultationBot.launch();
console.log("🤖 consultationBot bot started");
process.once('SIGINT', () => consultationBot.stop('SIGINT'));
process.once('SIGTERM', () => consultationBot.stop('SIGTERM'));

answererBot.launch();
console.log("🤖 consultationBot bot started");
process.once('SIGINT', () => answererBot.stop('SIGINT'));
process.once('SIGTERM', () => answererBot.stop('SIGTERM'));

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
