declare module 'itty-router' {
  export type RouteHandler = (
    request: Request,
    ...args: any[]
  ) => Response | Promise<Response> | void | Promise<void>;

  export interface RouterOptions {
    base?: string;
  }

  export interface Router {
    (options?: RouterOptions): Router;
    get: (path: string, ...handlers: RouteHandler[]) => Router;
    post: (path: string, ...handlers: RouteHandler[]) => Router;
    put: (path: string, ...handlers: RouteHandler[]) => Router;
    patch: (path: string, ...handlers: RouteHandler[]) => Router;
    delete: (path: string, ...handlers: RouteHandler[]) => Router;
    head: (path: string, ...handlers: RouteHandler[]) => Router;
    options: (path: string, ...handlers: RouteHandler[]) => Router;
    all: (path: string, ...handlers: RouteHandler[]) => Router;
    handle: (request: Request, ...args: any[]) => Promise<Response>;
    routes: () => RouteHandler[];
  }

  export function Router(options?: RouterOptions): Router;
}
