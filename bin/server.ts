import { createHandler } from "../src/handler";

const APPLICATION_ID = process.env.APPLICATION_ID ?? "";
const APPLICATION_SECRET = process.env.APPLICATION_SECRET ?? "";
const PUBLIC_KEY = process.env.PUBLIC_KEY ?? "";

const handler = createHandler({
  commands: [],
  applicationId: APPLICATION_ID,
  applicationSecret: APPLICATION_SECRET,
  publicKey: PUBLIC_KEY,
});

addEventListener("fetch", (event) => handler(event.request));

console.log("ピン留めちゃん、準備完了ですっ！");
