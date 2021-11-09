import { PartialMessage } from "./types";

const ENDPOINT = "https://discord.com/api/v8";

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
    console.log(files);
    for (let idx = 0; idx < files.length; idx += 1) {
      const file = files[idx];
      form.append(`files[${idx}]`, file, `${idx}`);
      message.attachments[idx].id = `${idx}`;
      message.attachments[idx].filename = `${idx}`;
    }
    console.log(message);
    form.append("payload_json", JSON.stringify(message));
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
    console.log(res.statusText);
    console.log(await res.text());
  };
