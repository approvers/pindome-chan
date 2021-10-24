import { addHeaders } from "./add-headers";

export type AuthorizationOptions =
  | {
      username?: string;
      password?: string;
    }
  | {
      bearer: string;
    };

export const authorization = (
  prevFetch: typeof fetch,
  options: AuthorizationOptions,
): typeof fetch => {
  let authKey;
  if ("username" in options || "password" in options) {
    const basicAuth = btoa(
      `${options.username || ""}:${options.password || ""}`,
    );
    authKey = `Basic ${basicAuth}`;
  } else if ("bearer" in options) {
    authKey = `Bearer ${options.bearer}`;
  } else {
    throw new Error("invalid options");
  }

  return addHeaders(prevFetch, {
    headers: { Authorization: authKey },
  });
};
