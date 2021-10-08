import type { ApplicationCommand, InteractionHandler } from "./types";
import { Router } from "@glenstack/cf-workers-router";
import { authorize } from "./handler/authorize";
import { interaction } from "./handler/interaction";
import { setup } from "./handler/setup";

const APPLICATION_ID = process.env.APPLICATION_ID ?? "";
const APPLICATION_SECRET = process.env.APPLICATION_SECRET ?? "";
const PUBLIC_KEY = process.env.PUBLIC_KEY ?? "";

const router = new Router();

export const createHandler = ({
  commands,
}: {
  commands: [ApplicationCommand, InteractionHandler][];
}): ((request: Request) => Response | Promise<Response>) => {
  router.get("/", authorize({ applicationId: APPLICATION_ID }));
  router.post("/interaction", interaction({ publicKey: PUBLIC_KEY, commands }));
  router.get(
    "/setup",
    setup({
      applicationId: APPLICATION_ID,
      applicationSecret: APPLICATION_SECRET,
      commands,
    }),
  );
  return (request: Request) => router.route(request);
};
