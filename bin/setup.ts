import { RequestOptions, request } from "https";
import dotenv from "dotenv";

dotenv.config();

const { APPLICATION_ID, GUILD_ID, DISCORD_TOKEN } = process.env;

const data = JSON.stringify([
  {
    name: "ピン留め",
    type: 3,
  },
]);

const options: RequestOptions = {
  hostname: "discord.com",
  port: 443,
  path: `/api/v8/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
  method: "PUT",
  headers: {
    Authorization: `Bot ${DISCORD_TOKEN}`,
    "Content-Type": "application/json",
  },
};

const req = request(options, (res) => {
  console.log("Request completed");

  res.on("data", (chunk: string) => {
    process.stdout.write(chunk);
  });
});

req.on("error", console.error);

req.write(data);
req.end();
