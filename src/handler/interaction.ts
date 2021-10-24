import {
  ApplicationCommand,
  Interaction,
  InteractionHandler,
  InteractionType,
} from "../types";
import type { Handler } from "./router";
import { authorize } from "./authorize";

const jsonResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });

export const interactions = ({
  commands,
  publicKey,
}: {
  commands: [ApplicationCommand, InteractionHandler][];
  publicKey: string;
}): Handler =>
  authorize({ publicKey })(async (request: Request): Promise<Response> => {
    try {
      const interaction = (await request.json()) as Interaction;

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

        default:
          throw new Error("unreachable");
      }
    } catch {
      return new Response(null, { status: 400 });
    }
  });
