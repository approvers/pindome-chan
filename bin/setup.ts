import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import dotenv from "dotenv";

dotenv.config();

const { APPLICATION_ID, GUILD_ID, DISCORD_TOKEN } = process.env;

if (!APPLICATION_ID || !GUILD_ID || !DISCORD_TOKEN) {
  throw new Error(
    "env `APPLICATION_ID`, `GUILD_ID` and `DISCORD_TOKEN` required.",
  );
}

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

const commands = [
  {
    name: "ピン留め",
    type: 3,
    // eslint-disable-next-line camelcase
    default_member_permissions: "0",
  },
];

(async () => {
  await rest.put(Routes.applicationGuildCommands(APPLICATION_ID, GUILD_ID), {
    body: commands,
  });
  console.log("Application commands registered.");
})();
