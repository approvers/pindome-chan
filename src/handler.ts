import { ApplicationCommand, InteractionHandler } from "./types";
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
  guildId: string;
}

export const createHandler = ({
  commands,
  applicationId,
  applicationSecret,
  publicKey,
  guildId,
}: HandlerOptions): ((request: Request) => Response | Promise<Response>) => {
  router.method("POST", "/", interaction({ commands, publicKey }));
  router.method(
    "GET",
    "/setup",
    setup({
      applicationId,
      applicationSecret,
      commands,
      guildId,
    }),
  );
  return (request: Request) => router.route(request);
};
