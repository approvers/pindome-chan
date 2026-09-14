import type { Context, HonoRequest } from "hono";
import {
  type AppEnv,
  type Interaction,
  type InteractionHandlers,
  type InteractionResponse,
  InteractionResponseType,
  InteractionType,
} from "./types.ts";

import { makeCommands } from "./commands.ts";

const HEX_SEGMENT = /.{1,2}/gu;

const fromHexString = (hexString: string) =>
  new Uint8Array(hexString.match(HEX_SEGMENT)!.map((byte) => parseInt(byte, 16)));

const invalidRequestResponse = (): Response => new Response(null, { status: 401 });

const verifyRequest = async (
  req: HonoRequest,
  publicKey: string,
): Promise<Interaction | undefined> => {
  const signature = req.header("X-Signature-Ed25519");
  const timestamp = req.header("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return undefined;
  }

  const body = await req.text();

  const publicKeyCrypto = await crypto.subtle.importKey(
    "raw",
    fromHexString(publicKey),
    { name: "Ed25519" },
    false,
    ["verify"],
  );

  if (
    await crypto.subtle.verify(
      { name: "Ed25519" },
      publicKeyCrypto,
      fromHexString(signature),
      new TextEncoder().encode(timestamp + body),
    )
  ) {
    return JSON.parse(body) as Interaction;
  }
  return undefined;
};

const jsonResponse = (data: InteractionResponse): Response =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });

const makeCommandResponse = async ({
  interaction,
  commands,
}: {
  interaction: Interaction;
  commands: InteractionHandlers;
}): Promise<Response> => {
  switch (interaction.type) {
    case InteractionType.Ping:
      return jsonResponse({ type: InteractionResponseType.Pong });

    case InteractionType.ApplicationCommand: {
      const found = commands.find(([command]) => command.name === interaction.data.name);
      if (!found) {
        return new Response(null, { status: 400 });
      }
      const [, handler] = found;
      return jsonResponse(await handler(interaction));
    }
  }
};

export const handleCommand = async (c: Context<AppEnv>): Promise<Response> => {
  const commands = makeCommands({
    applicationId: c.env.APPLICATION_ID,
    webhookId: c.env.DISCORD_WEBHOOK_ID,
    webhookToken: c.env.DISCORD_WEBHOOK_TOKEN,
  });

  const interaction = await verifyRequest(c.req, c.env.PUBLIC_KEY);
  if (!interaction) {
    console.info("failed to verify with: ", c.req.header());
    return invalidRequestResponse();
  }

  console.log(interaction);
  try {
    const response = makeCommandResponse({ interaction, commands });
    return response;
  } catch (error) {
    console.error(error);
    return invalidRequestResponse();
  }
};
