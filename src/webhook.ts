const ENDPOINT = "https://discord.com/api/v8";

export interface WebhookOptions {
  webhookId: string;
  webhookToken: string;
}

export const webhook =
  ({ webhookId, webhookToken }: WebhookOptions) =>
  async (message: unknown): Promise<void> => {
    const res = await fetch(
      [ENDPOINT, "webhooks", webhookId, webhookToken].join("/"),
      {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      },
    );
    console.log(await res.text());
  };
