export type Method =
  | "CONNECT"
  | "DELETE"
  | "GET"
  | "HEAD"
  | "OPTIONS"
  | "PATCH"
  | "POST"
  | "PUT"
  | "TRACE";

const methodCondition = (method: Method) => (request: Request) =>
  method.toLowerCase() == request.method.toLowerCase();

export type PathMatcher = string | RegExp;

const pathCondition = (regExp: PathMatcher) => (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const matches = path.match(regExp);
  if (!matches) {
    return false;
  }
  return matches[0] === path;
};

export interface Condition {
  (request: Request): boolean;
}

export interface Handler {
  (request: Request): Response | Promise<Response>;
}

export interface Route {
  conditions: readonly Condition[];
  handler: Handler;
}

export interface Middleware {
  (next: Handler): Handler;
}

export class Router {
  private routes: Route[] = [];
  private middleware: Middleware = (x) => x;

  handle(conditions: readonly Condition[], handler: Handler): this {
    this.routes.push({
      conditions,
      handler,
    });
    return this;
  }

  method(method: Method, url: PathMatcher, handler: Handler): this {
    return this.handle([methodCondition(method), pathCondition(url)], handler);
  }
  all(handler: Handler): this {
    return this.handle([], handler);
  }

  route(request: Request): Response | Promise<Response> {
    const route = this.resolve(request);
    if (route === undefined) {
      return new Response(null, {
        status: 404,
      });
    }
    return this.middleware(route.handler)(request);
  }

  addMiddleware(middleware: Middleware): this {
    this.middleware = (x) => middleware(this.middleware(x));
    return this;
  }

  private resolve(request: Request): Route | undefined {
    return this.routes.find((route): boolean => {
      if (route.conditions.length === 0) {
        return true;
      }
      return route.conditions.every((condition) => condition(request));
    });
  }
}
