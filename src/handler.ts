import type { ApplicationCommand, InteractionHandler } from "./types";
import { Router } from "@glenstack/cf-workers-router";
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
  router.post("/", authorize({ applicationId }));
  router.post("/interaction", interaction({ publicKey, commands }));
  router.get(
    "/setup",
    setup({
      applicationId,
      applicationSecret,
      commands,
    }),
  );
  return (request: Request) => router.route(request);
};
