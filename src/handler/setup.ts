import { ApplicationCommand, ENDPOINT, InteractionHandler } from "../types";
import type { Handler } from "./router";
import { authorization } from "./setup/authorization";
import { getAuthorizationCode } from "../oauth-code";

const deleteExistingCommands = async (
  { applicationId, guildId }: { applicationId: string; guildId: string },
  authedFetch: typeof fetch,
): Promise<void> => {
  const url = [
    ENDPOINT,
    "applications",
    applicationId,
    "guilds",
    guildId,
    "commands",
  ].join("/");
  const response = await authedFetch(url);
  const commands = await response.json();

  await Promise.all(
    commands.map(
      // eslint-disable-next-line camelcase
      (command: ApplicationCommand & { id: string; application_id: string }) =>
        authedFetch(`${url}/${command.id}`, {
          method: "DELETE",
        }),
    ),
  );
};

const createCommands = (
  {
    applicationId,
    guildId,
    commands,
  }: {
    applicationId: string;
    guildId: string;
    commands: [ApplicationCommand, InteractionHandler][];
  },
  authedFetch: typeof fetch,
): Promise<Response> => {
  const url = [
    ENDPOINT,
    "applications",
    applicationId,
    "guilds",
    guildId,
    "commands",
  ].join("/");

  const promises = commands.map(async ([command]) => {
    const request = new Request(url, {
      method: "POST",
      body: JSON.stringify(command),
      headers: { "Content-Type": "application/json" },
    });

    const error = new Error(`Setting command ${command.name} failed!`);

    try {
      const response = await authedFetch(request);
      if (!response.ok) {
        throw error;
      }
      return response;
    } catch {
      throw error;
    }
  });

  return Promise.all(promises)
    .then(() => new Response("OK"))
    .catch((err) => new Response(err.message, { status: 502 }));
};

export const setup = ({
  applicationId,
  applicationSecret,
  guildId,
  commands,
}: {
  applicationId: string;
  applicationSecret: string;
  guildId: string;
  commands: [ApplicationCommand, InteractionHandler][];
}): Handler => {
  const basicAuthFetch = authorization(fetch, {
    username: applicationId,
    password: applicationSecret,
  });

  return async (): Promise<Response> => {
    try {
      const bearer = await getAuthorizationCode(
        basicAuthFetch,
        "applications.commands.update",
      );
      const authedFetch = authorization(fetch, { bearer });

      await deleteExistingCommands({ applicationId, guildId }, authedFetch);
      return await createCommands(
        { applicationId, guildId, commands },
        authedFetch,
      );
    } catch {
      return new Response(
        "Failed to authenticate with Discord. " +
          "Are the Application ID and secret set correctly?",
        { status: 407 },
      );
    }
  };
};
