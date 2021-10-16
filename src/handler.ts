import { ApplicationCommand, InteractionHandler } from "./types";
import { Router } from "./handler/router";
import { authorize } from "./handler/authorize";
import { interaction } from "./handler/interaction";
import { setup } from "./handler/setup";
import { pingPong } from "./handler/ping-pong";

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
  router.method("POST", "/", pingPong());
  router.method("POST", "/interactions", interaction({ commands }));
  router.method(
    "GET",
    "/setup",
    setup({
      applicationId,
      applicationSecret,
      commands,
    }),
  );
  router.addMiddleware(authorize({ publicKey }));
  return (request: Request) => router.route(request);
};
