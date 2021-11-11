import { ENDPOINT } from "./types";

const TOKEN_URL = `${ENDPOINT}/oauth2/token`;

const scopes = ["applications.commands.update", "messages.read"] as const;

export type OAuth2Scope = typeof scopes[number];

export const getAuthorizationCode = async (
  authedFetch: typeof fetch,
  scope: OAuth2Scope,
): Promise<string> => {
  const request = new Request(TOKEN_URL, {
    method: "POST",
    body: new URLSearchParams({
      // eslint-disable-next-line camelcase
      grant_type: "client_credentials",
      scope,
    }).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const response = await authedFetch(request);
  if (!response.ok) {
    throw new Error("Failed to request an Authorization code.");
  }

  try {
    const data = await response.json();
    return data.access_token;
  } catch {
    throw new Error("Failed to parse the Authorization code response.");
  }
};
