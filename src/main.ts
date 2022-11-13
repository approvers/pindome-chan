import { config } from "../deps.ts";
import { extractEnv } from "./extract_env.ts";
import { handleCommand } from "./handle_command.ts";
import { handleSetup } from "./handle_setup.ts";
import { makeCommands } from "./commands.ts";

const {
  APPLICATION_ID,
  PUBLIC_KEY,
  GUILD_ID,
  DISCORD_WEBHOOK_ID,
  APPLICATION_SECRET,
  DISCORD_WEBHOOK_TOKEN,
} = extractEnv(
  [
    "ENVIRONMENT",
    "APPLICATION_ID",
    "PUBLIC_KEY",
    "GUILD_ID",
    "DISCORD_WEBHOOK_ID",
    "APPLICATION_SECRET",
    "DISCORD_WEBHOOK_TOKEN",
  ],
  {
    defaults: { ENVIRONMENT: "dev", ...config() },
  },
);

const commands = makeCommands({
  webhookId: DISCORD_WEBHOOK_ID,
  webhookToken: DISCORD_WEBHOOK_TOKEN,
});

const handleRequest = (req: Deno.RequestEvent): Promise<void> => {
  if (
    req.request.method === "GET" &&
    new URL(req.request.url).pathname === "/setup"
  ) {
    return handleSetup({
      req,
      applicationId: APPLICATION_ID,
      applicationSecret: APPLICATION_SECRET,
      guildId: GUILD_ID,
      commands,
    });
  }

  return handleCommand({ req, publicKey: PUBLIC_KEY, commands });
};

const server = Deno.listen({ port: 80 });

for await (const conn of server) {
  const http = Deno.serveHttp(conn);

  for await (const req of http) {
    await handleRequest(req);
  }
}
