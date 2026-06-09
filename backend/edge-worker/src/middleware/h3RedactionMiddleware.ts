export interface H3RedactionMiddlewareOptions {
  // Options for the middleware (to be defined later)
}

export class H3RedactionMiddleware {
  constructor(options?: H3RedactionMiddlewareOptions) {
    // Constructor
  }

  async processRequest(request: Request): Promise<Request> {
    // To be implemented
    return request;
  }

  async processResponse(response: Response): Promise<Response> {
    // To be implemented
    return response;
  }
}