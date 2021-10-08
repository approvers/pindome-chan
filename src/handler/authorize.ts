export const authorize =
  ({ applicationId }: { applicationId: string }) =>
  async (): Promise<Response> => {
    const urlSearchParams = new URLSearchParams({
      client_id: applicationId,
      scope: encodeURIComponent("applications.commands"),
    });
    const redirectURL = new URL("https://discord.com/api/oauth2/authorize");
    redirectURL.search = urlSearchParams.toString();

    return new Response(null, {
      status: 301,
      headers: { Location: redirectURL.toString() },
    });
  };
