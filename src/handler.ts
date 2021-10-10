import {
  ApplicationCommand,
  Interaction,
  InteractionType,
  InteractionHandler,
  InteractionResponse,
  InteractionResponseType,
} from "./types";
import { Router } from "./handler/router";
import { authorize } from "./handler/authorize";
import { interaction } from "./handler/interaction";
import { setup } from "./handler/setup";

const router = new Router();

export interface HandlerOptions {
  commands: [ApplicationCommand, InteractionHandler][];
  applicationId: string;
  applicationSecret: string;
  publicKey: string;
}

export const createHandler = ({
  commands,
  applicationId,
  applicationSecret,
  publicKey,
}: HandlerOptions): ((request: Request) => Response | Promise<Response>) => {
  router.method("GET", "/", authorize({ applicationId }));
  router.method("POST", "/", async (req) => {
    const json = (await req.json()) as Interaction;
    switch (json.type) {
      case InteractionType.Ping:
        return new Response(
          new Blob([
            JSON.stringify(<InteractionResponse>{
              type: InteractionResponseType.Pong,
            }),
          ]),
          { status: 200 },
        );
    }
    return new Response(null, { status: 400 });
  });
  router.method("POST", "/interaction", interaction({ publicKey, commands }));
  router.method(
    "GET",
    "/setup",
    setup({
      applicationId,
      applicationSecret,
      commands,
    }),
  );
  return (request: Request) => router.route(request);
};
