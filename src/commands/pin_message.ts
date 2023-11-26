import { ENDPOINT, Interaction, PartialMessage } from "../types.ts";

const editSentResponse = (
  { applicationId, interactionToken }: {
    applicationId: string;
    interactionToken: string;
  },
) =>
(content: string) =>
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

const USER_AGENT =
  "pindome-chan Bot (https://github.com/approvers/pindome-chan)";

export interface WebhookOptions {
  applicationId: string;
  webhookId: string;
  webhookToken: string;
}

const sendWebhook = (
  message: FormData,
  { webhookId, webhookToken }: WebhookOptions,
): Promise<Response> =>
  fetch(
    [ENDPOINT, "webhooks", webhookId, webhookToken].join("/"),
    {
      headers: {
        "User-Agent": USER_AGENT,
      },
      method: "POST",
      body: message,
    },
  );

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

export async function pinMessage(
  message: PartialMessage,
  interaction: Interaction,
  options: WebhookOptions,
) {
  const editSent = editSentResponse({
    applicationId: options.applicationId,
    interactionToken: interaction.token,
  });

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
      await editSent(
        "アップロード上限を超えているから、ピン留めできないみたいです…",
      );
      return;
    }
    form.append(`files[${index}]`, blob, attachment.filename);
  }

  let previewContent = "";
  if (message.content.length !== 0) {
    previewContent += cutContent(message.content);
  }

  const res = await sendWebhook(form, options);

  if (!res || !res.ok) {
    console.error(await res?.text());
    const followupRes = await editSent("ピン留めに失敗しちゃった……");
    console.log(await followupRes.text());
    return;
  }
  const followupRes = await editSent(`ピン留めできたよ！\n${previewContent}`);
  console.log(await followupRes.text());
}
