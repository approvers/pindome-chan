import {
  ApplicationCommandType,
  ENDPOINT,
  Interaction,
  InteractionHandlers,
  InteractionResponseType,
  InteractionType,
} from "./types.ts";

const errorResponse = (reason: string) => ({
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    content: `${reason}、ピン留めできないみたいです…`,
  },
});

export interface WebhookOptions {
  webhookId: string;
  webhookToken: string;
}

const sendWebhook = async (
  message: FormData,
  { webhookId, webhookToken }: WebhookOptions,
): Promise<void> => {
  const res = await fetch(
    [ENDPOINT, "webhooks", webhookId, webhookToken].join("/"),
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      method: "POST",
      body: message,
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
        return errorResponse("コマンドの種類が違うから");
      }
      const messages = interaction.data.resolved?.messages;
      if (messages === undefined) {
        return errorResponse("間に合わなかったから");
      }
      const [message] = Object.values(messages);
      console.log(message);
      const form = new FormData();
      form.append(
        "payload_json",
        JSON.stringify({
          ...message,
          content: `${message.content}\nby ${message.author.username}`,
          allowed_mentions: false,
          attachments: message.attachments.map((attachment, index) => ({
            id: index,
            filename: attachment.filename,
          })),
        }),
      );
      await Promise.all(message.attachments.map(async (attachment, index) => {
        const res = await fetch(attachment.url);
        const blob = await res.blob();

        const UPLOAD_SIZE_LIMIT = 8 * 1024 * 1024;
        if (UPLOAD_SIZE_LIMIT < blob.size) {
          return errorResponse("アップロード上限を超えているから");
        }
        form.append(`file${index}`, blob, attachment.filename);
      }));
      await sendWebhook(form, options);

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
