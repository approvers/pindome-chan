import { RequestOptions, request } from "https";
import dotenv from "dotenv";

const fetch = (options: RequestOptions, data?: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const req = request(options, (res) => {
      res.on("data", (chunk) => {
        resolve(chunk.toString());
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(data);
    }
    req.end();
  });

dotenv.config();

const { APPLICATION_ID, GUILD_ID, DISCORD_TOKEN } = process.env;

const data = JSON.stringify([
  {
    name: "ピン留め",
    type: 3,
  },
]);

fetch(
  {
    hostname: "discord.com",
    port: 443,
    path: `/api/v8/applications/${APPLICATION_ID}/guilds/${GUILD_ID}/commands`,
    method: "PUT",
    headers: {
      Authorization: `Bot ${DISCORD_TOKEN}`,
      "Content-Type": "application/json",
    },
  },
  data,
)
  .then((registered) => {
    console.log({ registered });
    return fetch({
      hostname: "discord.com",
      port: 443,
      path:
        `/api/v8/applications/${APPLICATION_ID}` +
        `/guilds/${GUILD_ID}/commands`,
      method: "GET",
      headers: {
        Authorization: `Bot ${DISCORD_TOKEN}`,
      },
    });
  })
  .then((fetched) => {
    console.log({ fetched });
  });
