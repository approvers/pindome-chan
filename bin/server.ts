import {
  ApplicationCommandType,
  Interaction,
  InteractionResponseType,
  InteractionType,
} from "../src/types";
import { createHandler } from "../src/handler";
import { webhook } from "../src/webhook";

declare const APPLICATION_ID: string;
declare const APPLICATION_SECRET: string;
declare const PUBLIC_KEY: string;
declare const GUILD_ID: string;
declare const DISCORD_WEBHOOK_ID: string;
declare const DISCORD_WEBHOOK_TOKEN: string;

const errorResponse = {
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    content: "ピン留めできないみたいです…",
  },
};

const destination = webhook({
  webhookId: DISCORD_WEBHOOK_ID,
  webhookToken: DISCORD_WEBHOOK_TOKEN,
});

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
        const [message] = Object.values(messages);
        message.attachments = message.attachments.filter(
          (attachment) => attachment.ephemeral === false,
        );
        destination({
          ...message,
          content: `${message.content}\nby ${message.author.username}`,
        });
        let content = "ピン留めしましたっ！";
        if (message.content.length !== 0) {
          content += "\n";
          const PREVIEW_LENGTH = 20;
          content += message.content.substring(0, PREVIEW_LENGTH);
          if (PREVIEW_LENGTH <= message.content.length) {
            content += "...";
          }
        }
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content,
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
