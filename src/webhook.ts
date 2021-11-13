import { Attachment, ENDPOINT, Embed, Snowflake } from "./types";

export interface WebhookOptions {
  webhookId: string;
  webhookToken: string;
}

export type WebhookMessage = (
  | {
      content: string;
      embeds?: Embed[];
      files?: Blob[];
    }
  | {
      content?: string;
      embeds: Embed[];
      files?: Blob[];
    }
  | {
      content?: string;
      embeds?: Embed[];
      files: Blob[];
    }
) &
  Partial<{
    username: string;
    // eslint-disable-next-line camelcase
    avatar_url: string;
    tts: boolean;
    // eslint-disable-next-line camelcase
    allowed_mentions: Snowflake[];
    components: unknown[];
    attachments: Attachment[];
  }>;

export const webhook =
  ({ webhookId, webhookToken }: WebhookOptions) =>
  async (partialMessage: Readonly<WebhookMessage>): Promise<void> => {
    const message = { ...partialMessage };
    const form = new FormData();

    if (message.files) {
      for (let idx = 0; idx < message.files.length; idx += 1) {
        const file = message.files[idx];
        const filename =
          message.attachments && message.attachments[idx].filename;
        form.append(`files[${idx}]`, file, filename);
      }
    }
    Reflect.deleteProperty(message, "files");
    form.append("payload_json", JSON.stringify(message));

    for (const [key, value] of form.entries()) {
      console.log(`${key}: ${value}`);
    }

    const res = await fetch(
      [ENDPOINT, "webhooks", webhookId, webhookToken].join("/"),
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        method: "POST",
        body: form,
      },
    );
    if (!res.ok) {
      throw new Error(await res.text());
    }
  };
