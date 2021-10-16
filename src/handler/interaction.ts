import {
  ApplicationCommand,
  InteractionHandler,
  Interaction,
  InteractionType,
} from "../types";

const jsonResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });

export const interaction = ({
  commands,
}: {
  commands: [ApplicationCommand, InteractionHandler][];
}) => {
  return async (request: Request): Promise<Response> => {
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
  };
};
