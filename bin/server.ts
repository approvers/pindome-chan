import {
  ApplicationCommandType,
  Interaction,
  InteractionResponseType,
  InteractionType,
} from "../src/types";
import { createHandler } from "../src/handler";

declare const APPLICATION_ID: string;
declare const APPLICATION_SECRET: string;
declare const PUBLIC_KEY: string;
declare const GUILD_ID: string;

const errorResponse = {
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    content: "ピン留めできないみたいです…",
  },
};

const handler = createHandler({
  commands: [
    [
      {
        type: ApplicationCommandType.Message,
        name: "ピン留め",
      },
      (interaction: Interaction) => {
        if (interaction.type !== InteractionType.ApplicationCommand) {
          return errorResponse;
        }
        const messages = interaction.data.resolved?.messages;
        if (messages === undefined) {
          return errorResponse;
        }
        const [_message] = Object.values(messages);
        // TODO: transport message to the webhook
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: "実装中だよ！",
          },
        };
      },
    ],
  ],
  applicationId: APPLICATION_ID,
  applicationSecret: APPLICATION_SECRET,
  publicKey: PUBLIC_KEY,
  guildId: GUILD_ID,
});

addEventListener("fetch", (event) => event.respondWith(handler(event.request)));

console.log("ピン留めちゃん、準備完了ですっ！");
