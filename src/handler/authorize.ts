import {
  Interaction,
  InteractionResponse,
  InteractionResponseType,
  InteractionType,
} from "../types";

export const authorize =
  ({ applicationId }: { applicationId: string }) =>
  async (req: Request): Promise<Response> => {
    const interaction = (await req.json()) as Interaction;

    if (interaction.type == InteractionType.Ping) {
      return new Response(
        new Blob([
          JSON.stringify(<InteractionResponse>{
            type: InteractionResponseType.Pong,
          }),
        ]),
        {
          status: 200,
        },
      );
    }
    return new Response(null, {
      status: 400,
    });
  };
