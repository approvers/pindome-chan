import nacl from "tweetnacl";
import {
  ApplicationCommand,
  InteractionHandler,
  Interaction,
  InteractionType,
} from "../types";

const HEX_SEGMENT = /.{1,2}/g;

const fromHexString = (hexString: string) =>
  new Uint8Array(
    hexString.match(HEX_SEGMENT)!.map((byte) => parseInt(byte, 16)),
  );

const jsonResponse = (data: any) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });

const makeValidator =
  ({ publicKey }: { publicKey: string }) =>
  async (request: Request) => {
    const signature = String(request.headers.get("X-Signature-Ed25519"));
    const timestamp = String(request.headers.get("X-Signature-Timestamp"));
    const body = await request.text();

    const isValid = nacl.sign.detached.verify(
      new TextEncoder().encode(timestamp + body),
      fromHexString(signature),
      fromHexString(publicKey),
    );

    if (!isValid) throw new Error("Invalid request");
  };

export const interaction = ({
  publicKey,
  commands,
}: {
  publicKey: string;
  commands: [ApplicationCommand, InteractionHandler][];
}) => {
  const validateRequest = makeValidator({ publicKey });

  return async (request: Request): Promise<Response> => {
    try {
      await validateRequest(request.clone());

      try {
        const interaction = (await request.json()) as Interaction;

        switch (interaction.type) {
          case InteractionType.Ping:
            return jsonResponse({ type: 1 });

          case InteractionType.ApplicationCommand:
            const found = commands.find(
              ([command, ..._ignore]) => command.name === interaction.data.name,
            );
            if (!found) {
              return new Response(null, { status: 400 });
            }
            const [, handler] = found;
            return jsonResponse(await handler(interaction));
        }
      } catch (e) {
        return new Response(null, { status: 400 });
      }
    } catch (e) {
      return new Response(null, { status: 401 });
    }
  };
};
