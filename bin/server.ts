import dotenv from "dotenv";
import { createHandler } from "src/handler";

dotenv.config();

const handler = createHandler({ commands: [] });

addEventListener("fetch", (event) => handler(event.request));

console.log("ピン留めちゃん、準備完了ですっ！");
