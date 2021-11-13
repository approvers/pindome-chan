import { ENDPOINT, PartialMessage } from "./types";

export interface WebhookOptions {
  webhookId: string;
  webhookToken: string;
}

export const webhook =
  ({ webhookId, webhookToken }: WebhookOptions) =>
  async (
    partialMessage: PartialMessage,
    files: readonly Blob[],
  ): Promise<void> => {
    const message = { ...partialMessage };
    const form = new FormData();

    for (let idx = 0; idx < files.length; idx += 1) {
      const file = files[idx];
      form.append(`files[${idx}]`, file, `${idx}`);
      message.attachments[idx].id = `${idx}`;
      message.attachments[idx].filename = `${idx}`;
    }
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
