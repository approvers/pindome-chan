import {
  ApplicationCommandType,
  ENDPOINT,
  Interaction,
  InteractionHandlers,
  InteractionResponseType,
  InteractionType,
  PartialMessage,
} from "./types.ts";

const errorResponse = (reason: string) => ({
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    content: `${reason}、ピン留めできないみたいです…`,
  },
});

const sendResponse = (
  { interactionId, interactionToken, content }: {
    interactionId: string;
    interactionToken: string;
    content: string;
  },
) =>
  fetch(
    [
      ENDPOINT,
      "interactions",
      interactionId,
      interactionToken,
      "callback",
    ].join("/"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );

const editSentResponse = (
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
      "messages",
      "@original",
    ].join("/"),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
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
  { previewContent, message, interactionId, interactionToken }: {
    previewContent: string;
    message: FormData;
    interactionId: string;
    interactionToken: string;
  },
  { applicationId, webhookId, webhookToken }: WebhookOptions,
): Promise<void> => {
  await sendResponse({
    interactionId,
    interactionToken,
    content: "ピン留め中…",
  });
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
  if (!res || !res.ok) {
    console.error(await res?.text());
    const followupRes = await editSentResponse({
      applicationId,
      interactionToken,
      content: "ピン留めに失敗しちゃった……",
    });
    console.log(await followupRes.text());
    return;
  }
  const followupRes = await editSentResponse({
    applicationId,
    interactionToken,
    content: `ピン留めできたよ！\n${previewContent}`,
  });
  console.log(await followupRes.text());
};

const cutContent = (content: string): string => {
  const spoilerMarks = [];
  const spoilerSpans: [number, number][] = [];
  const chars = [...content];
  let isInCodeBlock = false;
  for (let i = 0; i < chars.length - 1; ++i) {
    if (chars[i] === "|" && chars[i + 1] === "|" && !isInCodeBlock) {
      const start = spoilerMarks.pop();
      if (start !== undefined) {
        spoilerSpans.push([start, i + 2]);
      } else {
        spoilerMarks.push(i);
      }
      ++i;
    }
    if (
      chars[i] === "`" && chars[i + 1] === "`" && chars[i + 2] === "`" &&
      chars[i + 3] === "\n"
    ) {
      isInCodeBlock = !isInCodeBlock;
      if (isInCodeBlock) {
        spoilerMarks.pop();
      }
      i += 3;
    }
  }

  const PREVIEW_LENGTH = 20;
  const isCuttingSpoiler = spoilerSpans.some(([start, end]) =>
    start <= PREVIEW_LENGTH && PREVIEW_LENGTH < end
  );

  let cut = "";
  cut += content.substring(0, PREVIEW_LENGTH);
  if (isCuttingSpoiler) {
    cut += "||";
  }
  if (PREVIEW_LENGTH <= content.length) {
    cut += "...";
  }
  return cut;
};

async function pinMessage(
  message: PartialMessage,
  interaction: Interaction,
  options: WebhookOptions,
) {
  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({
      ...message,
      content: `${message.content}\nby ${message.author.username}`.trim(),
      allowed_mentions: {
        parse: [],
      },
      message_reference: {
        message_id: message.id,
      },
      attachments: message.attachments.map((attachment, index) => ({
        id: index,
        filename: attachment.filename,
      })),
    }),
  );
  for (let index = 0; index < message.attachments.length; ++index) {
    const attachment = message.attachments[index];
    const res = await fetch(attachment.url);
    const blob = await res.blob();

    const UPLOAD_SIZE_LIMIT = 8 * 1024 * 1024;
    if (UPLOAD_SIZE_LIMIT < blob.size) {
      return errorResponse("アップロード上限を超えているから");
    }
    form.append(`files[${index}]`, blob, attachment.filename);
  }

  let previewContent = "";
  if (message.content.length !== 0) {
    previewContent += cutContent(message.content);
  }

  await sendWebhook({
    previewContent,
    message: form,
    interactionId: interaction.id,
    interactionToken: interaction.token,
  }, options);
}

export const makeCommands = (options: WebhookOptions): InteractionHandlers => [
  [
    {
      type: ApplicationCommandType.Message,
      name: "ピン留め",
    },
    (interaction: Interaction) => {
      if (interaction.type !== InteractionType.ApplicationCommand) {
        return errorResponse("コマンドの種類が違うから");
      }
      const messages = interaction.data.resolved?.messages;
      if (messages === undefined) {
        return errorResponse("間に合わなかったから");
      }
      const [message] = Object.values(messages);
      void pinMessage(message, interaction, options);

      return {
        type: InteractionResponseType.DeferredChannelMessageWithSource,
      };
    },
  ],
];
