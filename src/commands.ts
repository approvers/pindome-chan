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

const sendFollowup = (
  { applicationId, interactionToken, content }: {
    applicationId: string;
    interactionToken: string;
    content: string;
  },
) =>
  fetch(
    [
      ENDPOINT,
      "webhooks",
      applicationId,
      interactionToken,
    ].join("/"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content }),
    },
  );

export interface WebhookOptions {
  applicationId: string;
  webhookId: string;
  webhookToken: string;
}

const USER_AGENT =
  "pindome-chan Bot (https://github.com/approvers/pindome-chan)";

const sendWebhook = async (
  message: FormData,
  interactionToken: string,
  { applicationId, webhookId, webhookToken }: WebhookOptions,
): Promise<void> => {
  const res = await fetch(
    [ENDPOINT, "webhooks", webhookId, webhookToken].join("/"),
    {
      headers: {
        "User-Agent": USER_AGENT,
      },
      method: "POST",
      body: message,
    },
  );
  if (!res.ok) {
    console.error(await res.text());
    const followupRes = await sendFollowup({
      applicationId,
      interactionToken,
      content: "ピン留めに失敗しちゃった……",
    });
    console.log(await followupRes.text());
    return;
  }
  const followupRes = await sendFollowup({
    applicationId,
    interactionToken,
    content: "ピン留めできたよ！",
  });
  console.log(await followupRes.text());
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
      const form = new FormData();
      form.append(
        "payload_json",
        JSON.stringify({
          ...message,
          content: `${message.content}\nby ${message.author.username}`.trim(),
          allowed_mentions: false,
          message_reference: {
            message_id: message.id,
          },
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
        form.append(`files[${index}]`, blob, attachment.filename);
      }));
      void sendWebhook(form, interaction.token, options);

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
        type: InteractionResponseType.DeferredChannelMessageWithSource,
        data: {
          content,
        },
      };
    },
  ],
];
