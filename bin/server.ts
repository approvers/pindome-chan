import {
  ApplicationCommandType,
  Attachment,
  Interaction,
  InteractionResponseType,
  InteractionType,
  PartialMessage,
} from "../src/types";
import { createHandler } from "../src/handler";
import fakeUa from "fake-useragent";
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
    content: "ピン留めできませんでした…",
  },
} as const;

const destination = webhook({
  webhookId: DISCORD_WEBHOOK_ID,
  webhookToken: DISCORD_WEBHOOK_TOKEN,
});

const buildContent = (message: PartialMessage) => {
  let content = "ピン留めしましたっ！";
  if (message.content.length !== 0) {
    content += "\n";
    const PREVIEW_LENGTH = 20;
    content += message.content.substr(0, PREVIEW_LENGTH);
    if (PREVIEW_LENGTH <= message.content.length) {
      content += "...";
    }
  }
  return content;
};

// eslint-disable-next-line camelcase
const fetchAttachment = async ({ proxy_url }: Attachment): Promise<Blob> => {
  const res = await fetch(proxy_url, {
    headers: {
      "User-Agent": fakeUa(),
    },
  });
  if (!res.ok) {
    console.log(res.statusText);
    throw new Error(await res.text());
  }
  return res.blob();
};

const handler = createHandler({
  commands: [
    [
      {
        type: ApplicationCommandType.Message,
        name: "ピン留め",
      },
      async (interaction: Interaction) => {
        if (interaction.type !== InteractionType.ApplicationCommand) {
          return errorResponse;
        }
        const messages = interaction.data.resolved?.messages;
        if (messages === undefined) {
          return errorResponse;
        }
        const [message] = Object.values(messages);
        console.log(message);

        try {
          const files = await Promise.all(
            message.attachments.map(fetchAttachment),
          );
          await destination({
            ...message,
            files,
            content: `${message.content}\nby ${message.author.username}`,
          });
        } catch (err) {
          console.log(err);
          return errorResponse;
        }
        return {
          type: InteractionResponseType.ChannelMessageWithSource,
          data: {
            content: buildContent(message),
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
