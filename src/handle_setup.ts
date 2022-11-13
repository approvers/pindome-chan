import { ApplicationCommand, ENDPOINT, InteractionHandlers } from "./types.ts";

import { authorizationHeaders } from "./setup/headers.ts";

const TOKEN_URL = `${ENDPOINT}/oauth2/token`;

const getAuthorizationCode = async (
  { basicHeaders }: { basicHeaders: Headers },
): Promise<string> => {
  const headers = new Headers(basicHeaders);
  headers.set("Content-Type", "application/x-www-form-urlencoded");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      // eslint-disable-next-line camelcase
      grant_type: "client_credentials",
      scope: "applications.commands.update",
    }).toString(),
    headers,
  });
  if (!response.ok) {
    throw new Error("Failed to request an Authorization code.");
  }

  try {
    const data = (await response.json()) as { access_token: string };
    return data.access_token;
  } catch {
    throw new Error("Failed to parse the Authorization code response.");
  }
};

const deleteExistingCommands = async (
  { applicationId, guildId, headers }: {
    applicationId: string;
    guildId: string;
    headers: Headers;
  },
): Promise<void> => {
  const url = [
    ENDPOINT,
    "applications",
    applicationId,
    "guilds",
    guildId,
    "commands",
  ].join("/");
  const response = await fetch(url, { headers });
  const commands = (await response.json()) as readonly (ApplicationCommand & {
    id: string;
    application_id: string;
  })[];

  await Promise.all(
    commands.map(
      // eslint-disable-next-line camelcase
      (command) =>
        fetch(`${url}/${command.id}`, {
          method: "DELETE",
          headers,
        }),
    ),
  );
};

const createCommands = async (
  {
    applicationId,
    guildId,
    commands,
    headers,
  }: {
    applicationId: string;
    guildId: string;
    commands: InteractionHandlers;
    headers: Headers;
  },
): Promise<Response> => {
  const url = [
    ENDPOINT,
    "applications",
    applicationId,
    "guilds",
    guildId,
    "commands",
  ].join("/");

  const request = new Request(url, {
    method: "PUT",
    body: JSON.stringify(commands),
    headers: { "Content-Type": "application/json" },
  });

  const error = new Error("Setting commands failed!");

  try {
    const response = await fetch(request, { headers });
    if (!response.ok) {
      throw error;
    }
  } catch (error) {
    return new Response((error as Error).message, { status: 502 });
  }
  return new Response("OK");
};

export const handleSetup = async (
  { req, commands, applicationId, applicationSecret, guildId }: {
    req: Deno.RequestEvent;
    commands: InteractionHandlers;
    applicationId: string;
    applicationSecret: string;
    guildId: string;
  },
): Promise<void> => {
  console.info("started to setup");

  const basicHeaders = authorizationHeaders({
    username: applicationId,
    password: applicationSecret,
  });
  const bearer = await getAuthorizationCode({ basicHeaders });
  const bearerHeaders = authorizationHeaders({ bearer });

  try {
    await deleteExistingCommands({
      applicationId,
      guildId,
      headers: bearerHeaders,
    });
    const response = await createCommands(
      { applicationId, guildId, commands, headers: bearerHeaders },
    );
    return req.respondWith(response);
  } catch {
    return req.respondWith(
      new Response(
        "Failed to authenticate with Discord. " +
          "Are the Application ID and secret set correctly?",
        { status: 407 },
      ),
    );
  }
};
