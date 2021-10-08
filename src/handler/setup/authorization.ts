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
  let authorization;
  if ("username" in options || "password" in options) {
    const basicAuth = btoa(
      `${options.username || ""}:${options.password || ""}`,
    );
    authorization = `Basic ${basicAuth}`;
  } else if ("bearer" in options) {
    authorization = `Bearer ${options.bearer}`;
  } else {
    throw new Error("invalid options");
  }

  return addHeaders(prevFetch, {
    headers: { Authorization: authorization },
  });
};
