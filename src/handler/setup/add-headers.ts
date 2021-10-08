export const addHeaders =
  (
    prevFetch: typeof fetch,
    { headers }: { headers: HeadersInit },
  ): typeof fetch =>
  (...args) => {
    let request = new Request(...args);
    const prevHeaders = new Headers([...request.headers]);
    const newHeaders = new Headers(headers);

    return prevFetch(
      new Request(request, {
        headers: [...prevHeaders, ...newHeaders],
      }),
    );
  };
