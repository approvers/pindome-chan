import {
  Interaction,
  InteractionHandlers,
  InteractionResponse,
  InteractionResponseType,
  InteractionType,
} from "./types.ts";

import { verify } from "ed25519";

const HEX_SEGMENT = /.{1,2}/gu;

const fromHexString = (hexString: string) =>
  new Uint8Array(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    hexString.match(HEX_SEGMENT)!.map((byte) => parseInt(byte, 16)),
  );

const invalidRequestResponse = (): Response =>
  new Response(null, { status: 401 });

const verifyRequest = async (
  request: Request,
  publicKey: string,
): Promise<Interaction | undefined> => {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return undefined;
  }

  const body = await request.text();
  if (
    verify(
      fromHexString(signature),
      new TextEncoder().encode(timestamp + body),
      fromHexString(publicKey),
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

const makeCommandResponse = async (
  { interaction, commands }: {
    interaction: Interaction;
    commands: InteractionHandlers;
  },
): Promise<Response> => {
  switch (interaction.type) {
    case InteractionType.Ping:
      return jsonResponse({ type: InteractionResponseType.Pong });

    case InteractionType.ApplicationCommand: {
      const found = commands.find(
        ([command]) => command.name === interaction.data.name,
      );
      if (!found) {
        return new Response(null, { status: 400 });
      }
      const [, handler] = found;
      return jsonResponse(await handler(interaction));
    }
  }
};

export const handleCommand = async ({ req, publicKey, commands }: {
  req: Deno.RequestEvent;
  publicKey: string;
  commands: InteractionHandlers;
}): Promise<void> => {
  const interaction = await verifyRequest(req.request, publicKey);
  if (!interaction) {
    console.info("failed to verify with: ", req.request.headers);
    await req.respondWith(invalidRequestResponse());
    return;
  }

  console.log(interaction);
  try {
    const response = makeCommandResponse({ interaction, commands });
    return req.respondWith(response);
  } catch (error) {
    console.error(error);
    return req.respondWith(invalidRequestResponse());
  }
};
