import { Interaction, InteractionHandlers, InteractionType } from "./types.ts";

import { ed } from "../deps.ts";

const invalidRequestResponse = (): Response =>
  new Response(null, { status: 401 });

const verifyRequest = async (
  request: Request,
  publicKey: string,
): Promise<boolean> => {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return false;
  }

  const body = await request.text();
  return ed.verify(signature, timestamp + body, publicKey);
};

const jsonResponse = (data: unknown) =>
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
      return jsonResponse({ type: 1 });

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
  if (!verifyRequest(req.request, publicKey)) {
    await req.respondWith(invalidRequestResponse());
    return;
  }

  try {
    const interaction = (await req.request.json()) as Interaction;

    const response = makeCommandResponse({ interaction, commands });
    return req.respondWith(response);
  } catch {
    return req.respondWith(invalidRequestResponse());
  }
};
