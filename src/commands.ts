import {
  ApplicationCommandType,
  ENDPOINT,
  Interaction,
  InteractionHandlers,
  InteractionResponseType,
  InteractionType,
} from "./types.ts";

const errorResponse = {
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    content: "ピン留めできないみたいです…",
  },
};

export interface WebhookOptions {
  webhookId: string;
  webhookToken: string;
}

const sendWebhook = async (
  message: unknown,
  { webhookId, webhookToken }: WebhookOptions,
): Promise<void> => {
  const res = await fetch(
    [ENDPOINT, "webhooks", webhookId, webhookToken].join("/"),
    {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(message),
    },
  );
  console.log(await res.text());
};

export const makeCommands = (options: WebhookOptions): InteractionHandlers => [
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
      message.attachments = message.attachments.filter(
        (attachment) => attachment.ephemeral === false,
      );
      await sendWebhook({
        ...message,
        content: `${message.content}\nby ${message.author.username}`,
      }, options);
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
];
