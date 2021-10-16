import {
  Interaction,
  InteractionResponse,
  InteractionResponseType,
  InteractionType,
} from "../types";

export const pingPong =
  () =>
  async (req: Request): Promise<Response> => {
    const interaction = (await req.json()) as Interaction;

    if (interaction.type == InteractionType.Ping) {
      return new Response(
        JSON.stringify(<InteractionResponse>{
          type: InteractionResponseType.Pong,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    return new Response(null, {
      status: 400,
    });
  };
