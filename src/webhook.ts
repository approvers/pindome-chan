const ENDPOINT = "https://discord.com/api/v8";

export interface WebhookOptions {
  webhookId: string;
  webhookToken: string;
}

export const webhook =
  ({ webhookId, webhookToken }: WebhookOptions) =>
  async (message: Record<string, unknown>): Promise<void> => {
    const form = new FormData();
    for (const [key, value] of Object.entries(message)) {
      form.append(key, `${value}`);
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
    console.log(await res.text());
  };
