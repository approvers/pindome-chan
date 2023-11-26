import { ENDPOINT, Interaction, PartialMessage } from "../types.ts";

const editSentResponse = (
  { applicationId, interactionToken }: {
    applicationId: string;
    interactionToken: string;
  },
) =>
(content: string): Promise<Response> =>
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

const makeFormData = async (
  message: PartialMessage,
  editSent: (content: string) => Promise<Response>,
): Promise<FormData | undefined> => {
  const UPLOAD_SIZE_LIMIT = 8 * 1024 * 1024;

  interface UploadItem {
    filename: string;
    blob: Blob;
  }
  const attachmentsToUpload: UploadItem[] = [];

  const form = new FormData();
  for (let index = 0; index < message.attachments.length; ++index) {
    const attachment = message.attachments[index];
    const res = await fetch(attachment.url);
    const blob = await res.blob();

    if (UPLOAD_SIZE_LIMIT < blob.size) {
      await editSent(
        "アップロード上限を超えているから、ピン留めできないみたいです…",
      );
      return;
    }
    attachmentsToUpload.push({ filename: attachment.filename, blob });
  }
  for (let index = 0; index < message.embeds.length; ++index) {
    const embed = message.embeds[index];
    if (embed.image && embed.image.url) {
      const { url } = embed.image;
      const res = await fetch(url);
      const blob = await res.blob();

      if (UPLOAD_SIZE_LIMIT < blob.size) {
        await editSent(
          "アップロード上限を超えているから、ピン留めできないみたいです…",
        );
        return;
      }
      const filename = `${index.toString(10)}.png`;
      attachmentsToUpload.push({ filename, blob });
      embed.image.url = `attachment://${filename}`;
    }
  }
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
      attachments: attachmentsToUpload.map(({ filename }, index) => ({
        id: index,
        filename,
      })),
    }),
  );
  attachmentsToUpload.forEach(({ filename, blob }, index) => {
    form.append(`files[${index}]`, blob, filename);
  });
  return form;
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

  const form = await makeFormData(message, editSent);
  if (!form) {
    return;
  }

  const res = await sendWebhook(form, options);

  let previewContent = "";
  if (message.content.length !== 0) {
    previewContent += cutContent(message.content);
  }

  if (!res || !res.ok) {
    console.error(await res?.text());
    const followupRes = await editSent("ピン留めに失敗しちゃった……");
    console.log(await followupRes.text());
    return;
  }
  const followupRes = await editSent(`ピン留めできたよ！\n${previewContent}`);
  console.log(await followupRes.text());
}
