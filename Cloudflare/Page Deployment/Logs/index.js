var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../../node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// ../../node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// ../../node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../../node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../../node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// ../../node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// ../../node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// ../../node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../../node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// ../../node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// ../../node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../../node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../../node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// ../../node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../../node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../../node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../../node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../../node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// ../../node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  __name(assertIs, "assertIs");
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  __name(assertNever, "assertNever");
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  __name(joinValues, "joinValues");
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = /* @__PURE__ */ __name((data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
}, "getParsedType");

// ../../node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = /* @__PURE__ */ __name((obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
}, "quotelessJson");
var ZodError = class _ZodError extends Error {
  static {
    __name(this, "ZodError");
  }
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = /* @__PURE__ */ __name((error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }, "processError");
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// ../../node_modules/zod/v3/locales/en.js
var errorMap = /* @__PURE__ */ __name((issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
}, "errorMap");
var en_default = errorMap;

// ../../node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
__name(setErrorMap, "setErrorMap");
function getErrorMap() {
  return overrideErrorMap;
}
__name(getErrorMap, "getErrorMap");

// ../../node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = /* @__PURE__ */ __name((params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
}, "makeIssue");
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
__name(addIssueToContext, "addIssueToContext");
var ParseStatus = class _ParseStatus {
  static {
    __name(this, "ParseStatus");
  }
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = /* @__PURE__ */ __name((value) => ({ status: "dirty", value }), "DIRTY");
var OK = /* @__PURE__ */ __name((value) => ({ status: "valid", value }), "OK");
var isAborted = /* @__PURE__ */ __name((x) => x.status === "aborted", "isAborted");
var isDirty = /* @__PURE__ */ __name((x) => x.status === "dirty", "isDirty");
var isValid = /* @__PURE__ */ __name((x) => x.status === "valid", "isValid");
var isAsync = /* @__PURE__ */ __name((x) => typeof Promise !== "undefined" && x instanceof Promise, "isAsync");

// ../../node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// ../../node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  static {
    __name(this, "ParseInputLazyPath");
  }
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = /* @__PURE__ */ __name((ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
}, "handleResult");
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = /* @__PURE__ */ __name((iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  }, "customMap");
  return { errorMap: customMap, description };
}
__name(processCreateParams, "processCreateParams");
var ZodType = class {
  static {
    __name(this, "ZodType");
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = /* @__PURE__ */ __name((val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    }, "getIssueProperties");
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = /* @__PURE__ */ __name(() => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      }), "setError");
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: /* @__PURE__ */ __name((data) => this["~validate"](data), "validate")
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
__name(timeRegexSource, "timeRegexSource");
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
__name(timeRegex, "timeRegex");
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
__name(datetimeRegex, "datetimeRegex");
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidIP, "isValidIP");
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
__name(isValidJWT, "isValidJWT");
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
__name(isValidCidr, "isValidCidr");
var ZodString = class _ZodString extends ZodType {
  static {
    __name(this, "ZodString");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
__name(floatSafeRemainder, "floatSafeRemainder");
var ZodNumber = class _ZodNumber extends ZodType {
  static {
    __name(this, "ZodNumber");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  static {
    __name(this, "ZodBigInt");
  }
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  static {
    __name(this, "ZodBoolean");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  static {
    __name(this, "ZodDate");
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  static {
    __name(this, "ZodSymbol");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  static {
    __name(this, "ZodUndefined");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  static {
    __name(this, "ZodNull");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  static {
    __name(this, "ZodAny");
  }
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  static {
    __name(this, "ZodUnknown");
  }
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  static {
    __name(this, "ZodNever");
  }
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  static {
    __name(this, "ZodVoid");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  static {
    __name(this, "ZodArray");
  }
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
__name(deepPartialify, "deepPartialify");
var ZodObject = class _ZodObject extends ZodType {
  static {
    __name(this, "ZodObject");
  }
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: /* @__PURE__ */ __name((issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }, "errorMap")
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...augmentation
      }), "shape")
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: /* @__PURE__ */ __name(() => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }), "shape"),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => shape, "shape")
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: /* @__PURE__ */ __name(() => newShape, "shape")
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: /* @__PURE__ */ __name(() => shape, "shape"),
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  static {
    __name(this, "ZodUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    __name(handleResults, "handleResults");
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = /* @__PURE__ */ __name((type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
}, "getDiscriminator");
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  static {
    __name(this, "ZodDiscriminatedUnion");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
__name(mergeValues, "mergeValues");
var ZodIntersection = class extends ZodType {
  static {
    __name(this, "ZodIntersection");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = /* @__PURE__ */ __name((parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    }, "handleParsed");
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  static {
    __name(this, "ZodTuple");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  static {
    __name(this, "ZodRecord");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  static {
    __name(this, "ZodMap");
  }
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  static {
    __name(this, "ZodSet");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    __name(finalizeSet, "finalizeSet");
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  static {
    __name(this, "ZodFunction");
  }
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    __name(makeArgsIssue, "makeArgsIssue");
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    __name(makeReturnsIssue, "makeReturnsIssue");
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  static {
    __name(this, "ZodLazy");
  }
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  static {
    __name(this, "ZodLiteral");
  }
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
__name(createZodEnum, "createZodEnum");
var ZodEnum = class _ZodEnum extends ZodType {
  static {
    __name(this, "ZodEnum");
  }
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  static {
    __name(this, "ZodNativeEnum");
  }
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  static {
    __name(this, "ZodPromise");
  }
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  static {
    __name(this, "ZodEffects");
  }
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: /* @__PURE__ */ __name((arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      }, "addIssue"),
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = /* @__PURE__ */ __name((acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      }, "executeRefinement");
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  static {
    __name(this, "ZodOptional");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  static {
    __name(this, "ZodNullable");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  static {
    __name(this, "ZodDefault");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  static {
    __name(this, "ZodCatch");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  static {
    __name(this, "ZodNaN");
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = /* @__PURE__ */ Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  static {
    __name(this, "ZodBranded");
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  static {
    __name(this, "ZodPipeline");
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = /* @__PURE__ */ __name(async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }, "handleAsync");
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  static {
    __name(this, "ZodReadonly");
  }
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = /* @__PURE__ */ __name((data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    }, "freeze");
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
__name(cleanParams, "cleanParams");
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
__name(custom, "custom");
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = /* @__PURE__ */ __name((cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params), "instanceOfType");
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = /* @__PURE__ */ __name(() => stringType().optional(), "ostring");
var onumber = /* @__PURE__ */ __name(() => numberType().optional(), "onumber");
var oboolean = /* @__PURE__ */ __name(() => booleanType().optional(), "oboolean");
var coerce = {
  string: /* @__PURE__ */ __name(((arg) => ZodString.create({ ...arg, coerce: true })), "string"),
  number: /* @__PURE__ */ __name(((arg) => ZodNumber.create({ ...arg, coerce: true })), "number"),
  boolean: /* @__PURE__ */ __name(((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })), "boolean"),
  bigint: /* @__PURE__ */ __name(((arg) => ZodBigInt.create({ ...arg, coerce: true })), "bigint"),
  date: /* @__PURE__ */ __name(((arg) => ZodDate.create({ ...arg, coerce: true })), "date")
};
var NEVER = INVALID;

// ../../node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const defaults = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: []
  };
  const opts = {
    ...defaults,
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// dist/index.js
var globalLogLevel = typeof globalThis.LOG_LEVEL === "string" ? globalThis.LOG_LEVEL : "info";
var correlationId;
function setCorrelationId(id) {
  correlationId = id;
}
__name(setCorrelationId, "setCorrelationId");
var levelOrder = { debug: 10, info: 20, warn: 30, error: 40 };
var REDACT_KEYS = ["authorization", "auth", "password", "apiKey", "token", "secret"];
function redactMeta(meta) {
  if (!meta) return meta;
  const clone = {};
  for (const k of Object.keys(meta)) {
    if (REDACT_KEYS.includes(k.toLowerCase())) {
      clone[k] = "[REDACTED]";
    } else {
      const v = meta[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        clone[k] = redactMeta(v);
      } else {
        clone[k] = v;
      }
    }
  }
  return clone;
}
__name(redactMeta, "redactMeta");
function log(level, message, meta) {
  if (levelOrder[level] < levelOrder[globalLogLevel]) return;
  const entry = {
    level,
    message,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    ...correlationId ? { meta: { correlationId } } : {}
  };
  if (meta) {
    entry.meta = { ...entry.meta || {}, ...redactMeta(meta) };
  }
  const line = JSON.stringify(entry);
  switch (level) {
    case "debug":
      console.debug(line);
      break;
    // eslint-disable-line no-console
    case "info":
      console.info(line);
      break;
    // eslint-disable-line no-console
    case "warn":
      console.warn(line);
      break;
    // eslint-disable-line no-console
    case "error":
      console.error(line);
      break;
  }
  return entry;
}
__name(log, "log");
var logger = {
  debug: /* @__PURE__ */ __name((m, meta) => log("debug", m, meta), "debug"),
  info: /* @__PURE__ */ __name((m, meta) => log("info", m, meta), "info"),
  warn: /* @__PURE__ */ __name((m, meta) => log("warn", m, meta), "warn"),
  error: /* @__PURE__ */ __name((m, meta) => log("error", m, meta), "error")
};
function extractError(err) {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (typeof err === "string") return { message: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: "Unknown error" };
  }
}
__name(extractError, "extractError");
var STATE_BOUNDARIES = {
  // Format: [minLng, minLat, maxLng, maxLat]
  AL: { name: "Alabama", bounds: [-88.5, 30.1, -84.7, 35] },
  AK: { name: "Alaska", bounds: [-179.1, 51.2, -129.9, 71.5] },
  AZ: { name: "Arizona", bounds: [-114.8, 31.3, -109, 37] },
  AR: { name: "Arkansas", bounds: [-94.6, 33, -89.6, 36.5] },
  CA: { name: "California", bounds: [-124.4, 32.5, -114.1, 42] },
  CO: { name: "Colorado", bounds: [-109, 36.9, -102, 41] },
  CT: { name: "Connecticut", bounds: [-73.7, 40.9, -71.7, 42] },
  DE: { name: "Delaware", bounds: [-75.8, 38.4, -75, 39.8] },
  FL: { name: "Florida", bounds: [-87.6, 24.4, -79.8, 31] },
  GA: { name: "Georgia", bounds: [-85.6, 30.3, -80.7, 35] },
  HI: { name: "Hawaii", bounds: [-160.3, 18.8, -154.8, 22.3] },
  ID: { name: "Idaho", bounds: [-117.2, 41.9, -111, 49] },
  IL: { name: "Illinois", bounds: [-91.5, 36.9, -87.4, 42.5] },
  IN: { name: "Indiana", bounds: [-88.1, 37.7, -84.6, 41.8] },
  IA: { name: "Iowa", bounds: [-96.6, 40.3, -90.1, 43.5] },
  KS: { name: "Kansas", bounds: [-102, 36.9, -94.5, 40] },
  KY: { name: "Kentucky", bounds: [-89.5, 36.4, -81.9, 39.1] },
  LA: { name: "Louisiana", bounds: [-94, 28.8, -88.7, 33] },
  ME: { name: "Maine", bounds: [-71, 42.9, -66.9, 47.4] },
  MD: { name: "Maryland", bounds: [-79.5, 37.8, -75, 39.7] },
  MA: { name: "Massachusetts", bounds: [-73.5, 41.1, -69.9, 42.8] },
  MI: { name: "Michigan", bounds: [-90.4, 41.6, -82.1, 48.3] },
  MN: { name: "Minnesota", bounds: [-97.2, 43.4, -89.4, 49.4] },
  MS: { name: "Mississippi", bounds: [-91.6, 30.1, -88, 35] },
  MO: { name: "Missouri", bounds: [-95.8, 35.9, -89, 40.6] },
  MT: { name: "Montana", bounds: [-116, 44.3, -104, 49] },
  NE: { name: "Nebraska", bounds: [-104, 39.9, -95.2, 43] },
  NV: { name: "Nevada", bounds: [-120, 35, -114, 42] },
  NH: { name: "New Hampshire", bounds: [-72.5, 42.6, -70.6, 45.3] },
  NJ: { name: "New Jersey", bounds: [-75.5, 38.9, -73.8, 41.3] },
  NM: { name: "New Mexico", bounds: [-109, 31.3, -103, 37] },
  NY: { name: "New York", bounds: [-79.8, 40.4, -71.7, 45] },
  NC: { name: "North Carolina", bounds: [-84.3, 33.8, -75.3, 36.6] },
  ND: { name: "North Dakota", bounds: [-104, 45.8, -96.4, 49] },
  OH: { name: "Ohio", bounds: [-84.8, 38.4, -80.5, 42.3] },
  OK: { name: "Oklahoma", bounds: [-103, 33.6, -94.4, 37] },
  OR: { name: "Oregon", bounds: [-124.5, 41.9, -116.4, 46.3] },
  PA: { name: "Pennsylvania", bounds: [-80.5, 39.7, -74.6, 42.5] },
  RI: { name: "Rhode Island", bounds: [-71.9, 41.1, -71.1, 42] },
  SC: { name: "South Carolina", bounds: [-83.3, 32, -78.5, 35.2] },
  SD: { name: "South Dakota", bounds: [-104, 42.4, -96.3, 45.9] },
  TN: { name: "Tennessee", bounds: [-90.3, 34.9, -81.6, 36.7] },
  TX: { name: "Texas", bounds: [-106.6, 25.8, -93.4, 36.5] },
  UT: { name: "Utah", bounds: [-114, 36.9, -109, 42] },
  VT: { name: "Vermont", bounds: [-73.4, 42.7, -71.4, 45] },
  VA: { name: "Virginia", bounds: [-83.6, 36.5, -75.1, 39.5] },
  WA: { name: "Washington", bounds: [-124.8, 45.5, -116.9, 49] },
  WV: { name: "West Virginia", bounds: [-82.6, 37.1, -77.7, 40.6] },
  WI: { name: "Wisconsin", bounds: [-92.9, 42.4, -86.7, 47.3] },
  WY: { name: "Wyoming", bounds: [-111, 40.9, -104, 45] },
  DC: { name: "District of Columbia", bounds: [-77.1, 38.8, -76.9, 38.9] }
};
async function detectStateFromCoordinates(latitude, longitude) {
  if (latitude < 24 || latitude > 50 || longitude < -125 || longitude > -65) {
    return null;
  }
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          "User-Agent": "AWhittleWandering/1.0"
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      const address = data?.address;
      if (address) {
        const stateName = address.state || address.region || address.county;
        if (stateName) {
          const normalizedName = stateName.toLowerCase();
          const stateEntry = Object.entries(STATE_BOUNDARIES).find(
            ([code, info]) => info.name.toLowerCase() === normalizedName
          );
          if (stateEntry) {
            return {
              name: stateEntry[1].name,
              code: stateEntry[0],
              confidence: "high"
            };
          }
        }
      }
    }
  } catch (error) {
    console.warn("Reverse geocoding failed, falling back to bounding box detection:", error);
  }
  for (const [code, stateInfo] of Object.entries(STATE_BOUNDARIES)) {
    const [minLng, minLat, maxLng, maxLat] = stateInfo.bounds;
    if (longitude >= minLng && longitude <= maxLng && latitude >= minLat && latitude <= maxLat) {
      return {
        name: stateInfo.name,
        code,
        confidence: "medium"
      };
    }
  }
  return null;
}
__name(detectStateFromCoordinates, "detectStateFromCoordinates");
async function updateStatesVisited(db, journeyId, stateCode, stateName, latitude, longitude, driveId) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await db.prepare(`
    INSERT INTO states_visited (
      journey_id, state_name, state_code, first_visited_date,
      first_drive_id, visit_count, entry_latitude, entry_longitude,
      last_updated, created_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    ON CONFLICT(journey_id, state_name) DO UPDATE SET
      visit_count = visit_count + 1,
      last_updated = ?,
      last_drive_id = ?
  `).bind(
    journeyId,
    stateName,
    stateCode,
    now,
    // first_visited_date
    driveId || null,
    latitude,
    longitude,
    now,
    // created_at
    now,
    // last_updated
    driveId || null
    // last_drive_id
  ).run();
}
__name(updateStatesVisited, "updateStatesVisited");
function extractErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}
__name(extractErrorMessage, "extractErrorMessage");
var TeslaDataIngestion = class {
  static {
    __name(this, "TeslaDataIngestion");
  }
  config;
  db;
  constructor(db, tessieApiKey, vehicleIdOrVin) {
    this.db = db;
    this.config = {
      apiKey: tessieApiKey,
      baseUrl: "https://api.tessie.com",
      vehicleIdOrVin
    };
  }
  normalizeIso(ts) {
    if (ts == null) return null;
    if (typeof ts === "number") {
      const ms = ts < 1e12 ? ts * 1e3 : ts;
      const date = new Date(ms);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    }
    if (typeof ts === "string") {
      const n = Number(ts);
      if (!Number.isNaN(n) && /^\d{9,13}$/.test(ts)) {
        const ms = ts.length === 13 ? n : n * 1e3;
        const date = new Date(ms);
        if (isNaN(date.getTime())) return null;
        return date.toISOString();
      }
      const d = new Date(ts);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return null;
  }
  async ensureVehicleAndJourney() {
    const vin = this.config.vehicleIdOrVin || "5YJYGDEE5LF027324";
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await this.db.prepare(
      `INSERT OR IGNORE INTO vehicles (id, vin, display_name, model, year, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind("midnight-shadow", vin, "Midnight Shadow", "Model Y", 2023, now, now).run();
    await this.db.prepare(
      `UPDATE vehicles SET vin = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(vin, "midnight-shadow").run();
    await this.db.prepare(
      `INSERT OR IGNORE INTO journeys (id, vehicle_id, name, description, start_date, target_states, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      "continental-usa-2025",
      "midnight-shadow",
      "A Whittle Wandering - Continental USA",
      "48 Continental States Tesla Model Y Road Trip Adventure",
      "2025-06-01",
      48,
      "active",
      now,
      now
    ).run();
  }
  /**
   * Main ingestion orchestrator - runs all data collection
   */
  async ingestAllData() {
    const startTime = Date.now();
    const errors = [];
    let totalRecords = 0;
    logger.info("Starting Tesla data ingestion");
    try {
      await this.ensureVehicleAndJourney();
      const stateResult = await this.ingestVehicleState();
      totalRecords += stateResult.recordsProcessed;
      if (!stateResult.success) errors.push(...stateResult.errors);
      const drivesResult = await this.ingestHistoricalDrives();
      totalRecords += drivesResult.recordsProcessed;
      if (!drivesResult.success) errors.push(...drivesResult.errors);
      const chargesResult = await this.ingestHistoricalCharges();
      totalRecords += chargesResult.recordsProcessed;
      if (!chargesResult.success) errors.push(...chargesResult.errors);
      await this.updateJourneyMetadata();
      const duration = Date.now() - startTime;
      logger.info("Data ingestion completed", { duration: `${duration}ms`, recordsProcessed: totalRecords });
      return {
        success: errors.length === 0,
        recordsProcessed: totalRecords,
        errors,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      logger.error("Data ingestion failed", { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        recordsProcessed: totalRecords,
        errors: [extractErrorMessage(error)],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  /**
   * Ingest current vehicle state (battery, location, etc.)
   */
  async ingestVehicleState() {
    logger.info("Ingesting current vehicle state");
    try {
      await this.ensureVehicleAndJourney();
      const stateData = await this.callTessieAPI(`/${this.config.vehicleIdOrVin}/state`);
      if (!stateData) {
        throw new Error("No vehicle state data received");
      }
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      await this.db.prepare(`
        INSERT OR REPLACE INTO vehicle_state (
          vehicle_id, vin, battery_level, battery_range, charging_state,
          latitude, longitude, heading, speed, odometer,
          inside_temp, outside_temp, power, locked, climate_on, shift_state,
          timestamp, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(
        "midnight-shadow",
        this.config.vehicleIdOrVin || "5YJYGDEE5LF027324",
        stateData.charge_state?.battery_level || 0,
        stateData.charge_state?.battery_range || 0,
        stateData.charge_state?.charging_state || "Unknown",
        stateData.drive_state?.latitude || 0,
        stateData.drive_state?.longitude || 0,
        stateData.drive_state?.heading || 0,
        stateData.drive_state?.speed || 0,
        stateData.vehicle_state?.odometer || 0,
        stateData.climate_state?.inside_temp || null,
        stateData.climate_state?.outside_temp || null,
        stateData.charge_state?.charger_power || 0,
        stateData.vehicle_state?.locked || false,
        stateData.climate_state?.is_climate_on || false,
        stateData.drive_state?.shift_state || null,
        nowIso
      ).run();
      try {
        await this.db.prepare(`
          INSERT INTO vehicle_state_history (
            vehicle_id, vin, battery_level, battery_range, charging_state,
            latitude, longitude, heading, speed, odometer,
            inside_temp, outside_temp, power, timestamp
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          "midnight-shadow",
          this.config.vehicleIdOrVin || "5YJYGDEE5LF027324",
          stateData.charge_state?.battery_level || 0,
          stateData.charge_state?.battery_range || 0,
          stateData.charge_state?.charging_state || "Unknown",
          stateData.drive_state?.latitude || 0,
          stateData.drive_state?.longitude || 0,
          stateData.drive_state?.heading || 0,
          stateData.drive_state?.speed || 0,
          stateData.vehicle_state?.odometer || 0,
          stateData.climate_state?.inside_temp || null,
          stateData.climate_state?.outside_temp || null,
          stateData.charge_state?.charger_power || 0,
          nowIso
        ).run();
      } catch (e) {
      }
      logger.info("Vehicle state ingested successfully");
      return { success: true, recordsProcessed: 1, errors: [], timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    } catch (error) {
      logger.error("Vehicle state ingestion failed", { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        recordsProcessed: 0,
        errors: [extractErrorMessage(error)],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  /**
   * Ingest historical drives from Tessie API
   */
  async ingestHistoricalDrives() {
    logger.info("Ingesting historical drives");
    try {
      await this.ensureVehicleAndJourney();
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1e3) / 1e3);
      const now = Math.floor(Date.now() / 1e3);
      const drivesData = await this.callTessieAPI(
        `/${this.config.vehicleIdOrVin}/drives?from=${thirtyDaysAgo}&to=${now}`
      );
      const driveResults = Array.isArray(drivesData?.results) ? drivesData.results : Array.isArray(drivesData) ? drivesData : [];
      if (!driveResults.length) {
        logger.warn("No drives data received");
        return { success: true, recordsProcessed: 0, errors: [], timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      }
      let recordsProcessed = 0;
      const errors = [];
      for (const drive of driveResults) {
        try {
          const startedAt = this.normalizeIso(drive.started_at);
          if (!startedAt) {
            errors.push(`Drive ${drive.id}: Invalid started_at timestamp: ${drive.started_at}`);
            continue;
          }
          let endedAt = this.normalizeIso(drive.ended_at);
          let durationMinutes;
          if (!endedAt) {
            if (typeof drive.started_at === "number" && typeof drive.ended_at === "number") {
              const startMs = drive.started_at < 1e12 ? drive.started_at * 1e3 : drive.started_at;
              const endMs = drive.ended_at < 1e12 ? drive.ended_at * 1e3 : drive.ended_at;
              const calculatedEnd = new Date(endMs);
              if (!isNaN(calculatedEnd.getTime()) && endMs > startMs) {
                endedAt = calculatedEnd.toISOString();
                durationMinutes = Math.round((endMs - startMs) / 6e4);
                logger.warn(`Drive ${drive.id}: Reconstructed ended_at from raw timestamps`);
              }
            }
            if (!endedAt && drive.ended_at && drive.started_at) {
              const rawDuration = typeof drive.ended_at === "number" && typeof drive.started_at === "number" ? Math.round((drive.ended_at - drive.started_at) / 60) : null;
              if (rawDuration !== null && rawDuration > 0) {
                const startDate = new Date(startedAt);
                const calculatedEndDate = new Date(startDate.getTime() + rawDuration * 6e4);
                endedAt = calculatedEndDate.toISOString();
                durationMinutes = rawDuration;
                logger.warn(`Drive ${drive.id}: Calculated ended_at from duration (${rawDuration} minutes)`);
              }
            }
            if (!endedAt) {
              endedAt = startedAt;
              durationMinutes = 0;
              errors.push(`Drive ${drive.id}: Invalid ended_at timestamp, using started_at (data quality issue)`);
              logger.error(`Drive ${drive.id}: Cannot parse ended_at (${drive.ended_at}), defaulting to started_at. This corrupts timeline data.`);
            }
          }
          if (durationMinutes === void 0) {
            durationMinutes = Math.round(
              (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 6e4
            );
          }
          await this.db.prepare(`
            INSERT OR REPLACE INTO drives (
              tessie_id, journey_id, vehicle_id, started_at, ended_at,
              start_address, end_address, start_latitude, start_longitude,
              end_latitude, end_longitude, distance_miles, duration_minutes,
              start_battery_level, end_battery_level, energy_used_kwh,
              outside_temp_avg
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            drive.id,
            "continental-usa-2025",
            "midnight-shadow",
            startedAt,
            endedAt,
            drive.starting_location || "Unknown",
            drive.ending_location || "Unknown",
            drive.starting_latitude || 0,
            drive.starting_longitude || 0,
            drive.ending_latitude || 0,
            drive.ending_longitude || 0,
            drive.odometer_distance || 0,
            durationMinutes,
            drive.starting_battery || 0,
            drive.ending_battery || 0,
            drive.energy_used || 0,
            drive.outside_temp || null
          ).run();
          try {
            if (drive.starting_latitude && drive.starting_longitude) {
              const startState = await detectStateFromCoordinates(
                drive.starting_latitude,
                drive.starting_longitude
              );
              if (startState) {
                await updateStatesVisited(
                  this.db,
                  "continental-usa-2025",
                  startState.code,
                  startState.name,
                  drive.starting_latitude,
                  drive.starting_longitude,
                  drive.id
                );
              }
            }
            if (drive.ending_latitude && drive.ending_longitude && (drive.ending_latitude !== drive.starting_latitude || drive.ending_longitude !== drive.starting_longitude)) {
              const endState = await detectStateFromCoordinates(
                drive.ending_latitude,
                drive.ending_longitude
              );
              if (endState) {
                await updateStatesVisited(
                  this.db,
                  "continental-usa-2025",
                  endState.code,
                  endState.name,
                  drive.ending_latitude,
                  drive.ending_longitude,
                  drive.id
                );
              }
            }
          } catch (stateError) {
            logger.warn(`Failed to update state tracking for drive ${drive.id}`, {
              error: extractErrorMessage(stateError)
            });
          }
          recordsProcessed++;
        } catch (driveError) {
          errors.push(`Drive ${drive.id}: ${extractErrorMessage(driveError)}`);
        }
      }
      logger.info("Processed drives", { count: recordsProcessed });
      return {
        success: errors.length === 0,
        recordsProcessed,
        errors,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      logger.error("Drives ingestion failed", { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        recordsProcessed: 0,
        errors: [extractErrorMessage(error)],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  /**
   * Ingest historical charge session data from Tessie API
   */
  async ingestHistoricalCharges() {
    logger.info("Ingesting historical charges");
    try {
      await this.ensureVehicleAndJourney();
      const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1e3) / 1e3);
      const now = Math.floor(Date.now() / 1e3);
      const chargesData = await this.callTessieAPI(
        `/${this.config.vehicleIdOrVin}/charges?from=${thirtyDaysAgo}&to=${now}`
      );
      const chargeResults = Array.isArray(chargesData?.results) ? chargesData.results : Array.isArray(chargesData) ? chargesData : [];
      if (!chargeResults.length) {
        logger.warn("No charges data received");
        return { success: true, recordsProcessed: 0, errors: [], timestamp: (/* @__PURE__ */ new Date()).toISOString() };
      }
      let recordsProcessed = 0;
      const errors = [];
      for (const charge of chargeResults) {
        try {
          const startedAt = this.normalizeIso(charge.started_at);
          if (!startedAt) {
            errors.push(`Charge ${charge.id}: Invalid started_at timestamp: ${charge.started_at}`);
            continue;
          }
          let endedAt = this.normalizeIso(charge.ended_at);
          if (charge.ended_at && !endedAt) {
            if (typeof charge.started_at === "number" && typeof charge.ended_at === "number") {
              const startMs = charge.started_at < 1e12 ? charge.started_at * 1e3 : charge.started_at;
              const endMs = charge.ended_at < 1e12 ? charge.ended_at * 1e3 : charge.ended_at;
              const calculatedEnd = new Date(endMs);
              if (!isNaN(calculatedEnd.getTime())) {
                endedAt = calculatedEnd.toISOString();
                logger.warn(`Charge ${charge.id}: Reconstructed ended_at from raw timestamps`);
              }
            }
            if (!endedAt && charge.ended_at) {
              errors.push(`Charge ${charge.id}: Invalid ended_at timestamp: ${charge.ended_at}, treating as ongoing`);
            }
          }
          await this.db.prepare(`
            INSERT OR REPLACE INTO charges (
              tessie_id, journey_id, vehicle_id, started_at, ended_at,
              location, latitude, longitude, energy_added_kwh,
              cost_usd, start_battery_level, end_battery_level,
              charger_type, charger_power_kw
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            charge.id,
            "continental-usa-2025",
            "midnight-shadow",
            startedAt,
            endedAt,
            charge.location || "Unknown",
            charge.latitude || 0,
            charge.longitude || 0,
            charge.energy_added || 0,
            charge.cost || 0,
            charge.starting_battery || 0,
            charge.ending_battery || 0,
            charge.charger_type || null,
            charge.charger_power || null
          ).run();
          recordsProcessed++;
        } catch (chargeError) {
          errors.push(`Charge ${charge.id}: ${extractErrorMessage(chargeError)}`);
        }
      }
      logger.info("Processed charges", { count: recordsProcessed });
      return {
        success: errors.length === 0,
        recordsProcessed,
        errors,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      logger.error("Charges ingestion failed", { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        recordsProcessed: 0,
        errors: [extractErrorMessage(error)],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
  }
  /**
   * Update journey metadata and statistics
   */
  async updateJourneyMetadata() {
    logger.info("Updating journey metadata");
    try {
      const stats = await this.db.prepare(`
        SELECT 
          COUNT(DISTINCT d.id) as total_drives,
          COALESCE(SUM(d.distance_miles), 0) as total_miles,
          MIN(d.started_at) as journey_start,
          MAX(d.ended_at) as journey_end
        FROM drives d 
        WHERE d.journey_id = 'continental-usa-2025'
      `).first();
      const charges = await this.db.prepare(
        `SELECT COUNT(*) as total_charges, COALESCE(SUM(cost_usd), 0) as total_cost
         FROM charges WHERE journey_id = 'continental-usa-2025'`
      ).first();
      const statesVisited = await this.db.prepare(
        `SELECT COUNT(*) as cnt FROM states_visited WHERE journey_id = 'continental-usa-2025'`
      ).first();
      await this.db.prepare(
        `UPDATE journeys
         SET total_miles = ?,
             total_drives = ?,
             total_charges = ?,
             total_states = ?,
             total_cost_usd = ?,
             start_date = COALESCE(start_date, ?),
             end_date = ?,
             updated_at = datetime('now')
         WHERE id = ?`
      ).bind(
        stats?.total_miles || 0,
        stats?.total_drives || 0,
        charges?.total_charges || 0,
        statesVisited?.cnt || 0,
        charges?.total_cost || 0,
        stats?.journey_start || "2025-06-01",
        stats?.journey_end || null,
        "continental-usa-2025"
      ).run();
      logger.info("Journey metadata updated");
    } catch (error) {
      logger.error("Journey metadata update failed", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
  /**
   * Make authenticated API call to Tessie
   */
  async callTessieAPI(endpoint) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json"
    };
    const sleep = /* @__PURE__ */ __name((ms) => new Promise((r) => setTimeout(r, ms)), "sleep");
    const timeoutMs = 1e4;
    const maxAttempts = 3;
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const to = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(to);
        if (!res.ok) {
          const shouldRetry = res.status === 429 || res.status >= 500 && res.status <= 599;
          if (shouldRetry && attempt < maxAttempts) {
            let retryAfterMs = 0;
            const ra = res.headers.get("Retry-After");
            const raSec = ra ? Number(ra) : NaN;
            if (Number.isFinite(raSec) && raSec > 0) retryAfterMs = Math.min(3e4, Math.round(raSec * 1e3));
            const backoffMs = Math.min(1e4, Math.round(250 * Math.pow(2, attempt - 1)));
            const jitterMs = Math.floor(Math.random() * 250);
            await sleep(Math.max(retryAfterMs, backoffMs + jitterMs));
            continue;
          }
          const body = await res.text().catch(() => "");
          throw new Error(`Tessie API error: ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 500)}` : ""}`);
        }
        const json = await res.json();
        if (endpoint.endsWith("/state")) {
          const stateSchema = external_exports.object({
            charge_state: external_exports.object({
              battery_level: external_exports.number().optional(),
              battery_range: external_exports.number().optional(),
              charging_state: external_exports.string().optional(),
              charger_power: external_exports.number().optional()
            }).optional(),
            drive_state: external_exports.object({
              latitude: external_exports.number().optional(),
              longitude: external_exports.number().optional(),
              heading: external_exports.number().optional(),
              speed: external_exports.number().optional(),
              shift_state: external_exports.string().optional()
            }).optional(),
            climate_state: external_exports.object({
              inside_temp: external_exports.number().optional(),
              outside_temp: external_exports.number().optional(),
              is_climate_on: external_exports.boolean().optional()
            }).optional(),
            vehicle_state: external_exports.object({
              odometer: external_exports.number().optional(),
              locked: external_exports.boolean().optional()
            }).optional()
          }).passthrough();
          const parsed = stateSchema.safeParse(json);
          if (!parsed.success) throw new Error("Tessie state payload validation failed");
          return parsed.data;
        }
        if (endpoint.includes("/drives") || endpoint.includes("/charges")) {
          const listSchema2 = external_exports.union([
            external_exports.object({ results: external_exports.array(external_exports.any()) }).passthrough(),
            external_exports.array(external_exports.any())
          ]);
          const parsed = listSchema2.safeParse(json);
          if (!parsed.success) throw new Error("Tessie list payload validation failed");
          return parsed.data;
        }
        return json;
      } catch (e) {
        clearTimeout(to);
        lastErr = e;
        if (attempt < maxAttempts) {
          const backoffMs = Math.min(1e4, Math.round(250 * Math.pow(2, attempt - 1)));
          const jitterMs = Math.floor(Math.random() * 250);
          await sleep(backoffMs + jitterMs);
          continue;
        }
      }
    }
    throw new Error(extractErrorMessage(lastErr));
  }
  /**
   * Health check - verify API connectivity and database access
   */
  async healthCheck() {
    try {
      const vehicleData = await this.callTessieAPI(`/${this.config.vehicleIdOrVin}`);
      const dbResult = await this.db.prepare("SELECT 1 as test").first();
      return {
        status: "healthy",
        details: {
          tessie_api: "connected",
          vehicle_found: !!vehicleData?.display_name,
          database: dbResult?.test === 1 ? "connected" : "error",
          last_check: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    } catch (error) {
      return {
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : String(error),
          last_check: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    }
  }
  extractErrorMessage(error) {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "Unknown error occurred";
  }
};
var CronDataController = class {
  static {
    __name(this, "CronDataController");
  }
  ingestion;
  db;
  constructor(db, tessieApiKey, vehicleVin) {
    this.db = db;
    this.ingestion = new TeslaDataIngestion(db, tessieApiKey, vehicleVin);
  }
  /**
   * Full data sync - runs every 30 minutes
   * Comprehensive update of all Tesla data
   */
  async fullDataSync() {
    const startTime = Date.now();
    try {
      logger.info("Starting scheduled full data sync");
      const result = await this.ingestion.ingestAllData();
      const duration = Date.now() - startTime;
      await this.logIngestionOperation("full_sync", result, duration);
      return new Response(JSON.stringify({
        success: result.success,
        operation: "full_sync",
        recordsProcessed: result.recordsProcessed,
        duration: `${duration}ms`,
        errors: result.errors,
        timestamp: result.timestamp,
        scheduledBy: "cron"
      }), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logIngestionOperation("full_sync", {
        success: false,
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, duration);
      return new Response(JSON.stringify({
        success: false,
        operation: "full_sync",
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        scheduledBy: "cron"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  /**
   * Quick vehicle state update - runs every 5 minutes
   * Updates current location, battery, etc.
   */
  async quickStateUpdate() {
    const startTime = Date.now();
    try {
      logger.info("Starting quick vehicle state update");
      const result = await this.ingestion.ingestVehicleState();
      const duration = Date.now() - startTime;
      await this.logIngestionOperation("vehicle_state", result, duration);
      return new Response(JSON.stringify({
        success: result.success,
        operation: "quick_state_update",
        recordsProcessed: result.recordsProcessed,
        duration: `${duration}ms`,
        errors: result.errors,
        timestamp: result.timestamp,
        scheduledBy: "cron"
      }), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logIngestionOperation("vehicle_state", {
        success: false,
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, duration);
      return new Response(JSON.stringify({
        success: false,
        operation: "quick_state_update",
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        scheduledBy: "cron"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  /**
   * Historical data backfill - runs daily
   * Ensures we have complete historical data
   */
  async historicalBackfill() {
    const startTime = Date.now();
    try {
      logger.info("Starting historical data backfill");
      const drivesResult = await this.ingestion.ingestHistoricalDrives();
      const chargesResult = await this.ingestion.ingestHistoricalCharges();
      const totalRecords = drivesResult.recordsProcessed + chargesResult.recordsProcessed;
      const allErrors = [...drivesResult.errors, ...chargesResult.errors];
      const success = drivesResult.success && chargesResult.success;
      const duration = Date.now() - startTime;
      await this.logIngestionOperation("historical_backfill", {
        success,
        recordsProcessed: totalRecords,
        errors: allErrors,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, duration);
      return new Response(JSON.stringify({
        success,
        operation: "historical_backfill",
        recordsProcessed: totalRecords,
        breakdown: {
          drives: drivesResult.recordsProcessed,
          charges: chargesResult.recordsProcessed
        },
        duration: `${duration}ms`,
        errors: allErrors,
        scheduledBy: "cron"
      }), {
        status: success ? 200 : 500,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logIngestionOperation("historical_backfill", {
        success: false,
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, duration);
      return new Response(JSON.stringify({
        success: false,
        operation: "historical_backfill",
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        scheduledBy: "cron"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  /**
   * Data quality check - runs hourly
   * Validates data integrity and flags issues
   */
  async dataQualityCheck() {
    const startTime = Date.now();
    try {
      logger.info("Starting data quality check");
      const issues = [];
      const stats = {};
      const latestDrive = await this.db.prepare(`
        SELECT MAX(started_at) as latest FROM drives WHERE journey_id = 'continental-usa-2025'
      `).first();
      const latestCharge = await this.db.prepare(`
        SELECT MAX(started_at) as latest FROM charges WHERE journey_id = 'continental-usa-2025'
      `).first();
      const latestState = await this.db.prepare(`
        SELECT MAX(timestamp) as latest FROM vehicle_state
      `).first();
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1e3;
      const latestTs = latestState?.latest;
      const latestMs = latestTs ? new Date(latestTs).getTime() : NaN;
      if (!latestTs || Number.isNaN(latestMs) || latestMs < twoHoursAgo) {
        issues.push("Vehicle state data is stale (>2 hours old)");
      }
      const duplicateDrives = await this.db.prepare(`
        SELECT COUNT(*) as count FROM (
          SELECT started_at, ended_at, COUNT(*) as dup_count
          FROM drives 
          GROUP BY started_at, ended_at 
          HAVING dup_count > 1
        )
      `).first();
      if (duplicateDrives?.count > 0) {
        issues.push(`Found ${duplicateDrives.count} duplicate drive records`);
      }
      stats.totalDrives = await this.db.prepare(`
        SELECT COUNT(*) as count FROM drives WHERE journey_id = 'continental-usa-2025'
      `).first();
      stats.totalCharges = await this.db.prepare(`
        SELECT COUNT(*) as count FROM charges WHERE journey_id = 'continental-usa-2025'
      `).first();
      stats.dataFreshness = {
        latestDrive: latestDrive?.latest,
        latestCharge: latestCharge?.latest,
        latestState: latestState?.latest
      };
      const duration = Date.now() - startTime;
      const success = issues.length === 0;
      await this.logIngestionOperation("data_quality_check", {
        success,
        recordsProcessed: 0,
        errors: issues,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, duration);
      return new Response(JSON.stringify({
        success,
        operation: "data_quality_check",
        issues,
        statistics: stats,
        duration: `${duration}ms`,
        scheduledBy: "cron"
      }), {
        status: success ? 200 : 200,
        // Always return 200 for quality checks
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logIngestionOperation("data_quality_check", {
        success: false,
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, duration);
      return new Response(JSON.stringify({
        success: false,
        operation: "data_quality_check",
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        scheduledBy: "cron"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  /**
   * AI/ML data processing - runs every 6 hours
   * Processes raw data for intelligent insights
   */
  async aiDataProcessing() {
    const startTime = Date.now();
    try {
      logger.info("Starting AI/ML data processing");
      let processedComponents = 0;
      const errors = [];
      try {
        await this.processRouteAnalysis();
        processedComponents++;
      } catch (error) {
        errors.push(`Route Analysis: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      try {
        await this.processEfficiencyTrends();
        processedComponents++;
      } catch (error) {
        errors.push(`Efficiency Trends: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      try {
        await this.processChargingPatterns();
        processedComponents++;
      } catch (error) {
        errors.push(`Charging Patterns: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
      const duration = Date.now() - startTime;
      const success = errors.length === 0;
      await this.logIngestionOperation("ai_processing", {
        success,
        recordsProcessed: processedComponents,
        errors,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, duration);
      return new Response(JSON.stringify({
        success,
        operation: "ai_data_processing",
        componentsProcessed: processedComponents,
        duration: `${duration}ms`,
        errors,
        scheduledBy: "cron"
      }), {
        status: success ? 200 : 500,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.logIngestionOperation("ai_processing", {
        success: false,
        recordsProcessed: 0,
        errors: [error instanceof Error ? error.message : "Unknown error"],
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }, duration);
      return new Response(JSON.stringify({
        success: false,
        operation: "ai_data_processing",
        error: error instanceof Error ? error.message : "Unknown error",
        duration: `${duration}ms`,
        scheduledBy: "cron"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  /**
   * Log ingestion operation for monitoring
   */
  async logIngestionOperation(operation, result, durationMs) {
    try {
      await this.db.prepare(`
        INSERT INTO ingestion_logs 
        (operation, records_processed, success, errors, duration_ms)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        operation,
        result.recordsProcessed || 0,
        result.success,
        JSON.stringify(result.errors || []),
        durationMs
      ).run();
    } catch (error) {
      logger.error("Failed to log ingestion operation", { error: error instanceof Error ? error.message : String(error) });
    }
  }
  /**
   * AI Processing Methods
   */
  async upsertApiCache(cacheKey, cacheType, data, ttlHours) {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1e3).toISOString();
    await this.db.prepare(
      `INSERT OR REPLACE INTO api_cache (cache_key, cache_data, cache_type, expires_at, metadata)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      cacheKey,
      JSON.stringify(data),
      cacheType,
      expiresAt,
      JSON.stringify({ generatedAt: (/* @__PURE__ */ new Date()).toISOString() })
    ).run();
  }
  async processRouteAnalysis() {
    const routeData = await this.db.prepare(`
      SELECT 
        d.*,
        LAG(end_latitude) OVER (ORDER BY started_at) as prev_lat,
        LAG(end_longitude) OVER (ORDER BY started_at) as prev_lng
      FROM drives d 
      WHERE d.journey_id = 'continental-usa-2025' 
      ORDER BY started_at
    `).all();
    const analysis = {
      totalSegments: routeData.results?.length || 0,
      avgDistance: routeData.results?.reduce((sum, d) => sum + (d.distance_miles || 0), 0) / (routeData.results?.length || 1),
      routeComplexity: "calculated",
      // Would implement actual complexity algorithm
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.upsertApiCache("component:route_analysis:current", "component", analysis, 6);
  }
  async processEfficiencyTrends() {
    const efficiencyData = await this.db.prepare(`
      SELECT 
        DATE(started_at) as drive_date,
        AVG(efficiency_miles_per_kwh) as avg_efficiency,
        COUNT(*) as drive_count,
        SUM(distance_miles) as total_miles
      FROM drives 
      WHERE journey_id = 'continental-usa-2025' 
        AND efficiency_miles_per_kwh IS NOT NULL
      GROUP BY DATE(started_at)
      ORDER BY drive_date
    `).all();
    const trends = {
      dailyEfficiency: efficiencyData.results || [],
      overallTrend: "stable",
      // Would implement trend analysis
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.upsertApiCache("component:efficiency_trends:current", "component", trends, 6);
  }
  async processChargingPatterns() {
    const chargingData = await this.db.prepare(`
      SELECT 
        charger_type,
        AVG(charging_efficiency_kw) as avg_efficiency,
        AVG(cost_per_kwh) as avg_cost_per_kwh,
        COUNT(*) as session_count,
        SUM(energy_added_kwh) as total_energy
      FROM charges 
      WHERE journey_id = 'continental-usa-2025'
        AND charging_efficiency_kw IS NOT NULL
      GROUP BY charger_type
    `).all();
    const patterns = {
      byChargerType: chargingData.results || [],
      totalSessions: chargingData.results?.reduce((sum, c) => sum + (c.session_count || 0), 0) || 0,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.upsertApiCache("component:charging_patterns:current", "component", patterns, 6);
  }
};
function buildJobs(env) {
  const tessieKey = env.TESSIE_API_TOKEN || env.TESSIE_API_KEY || "";
  const vin = env.TESLA_VIN || "";
  const controller = new CronDataController(env.TESLA_DB, tessieKey, vin);
  async function runAndAssertOk(promise, jobName) {
    const res = await promise;
    if (!res || typeof res.ok !== "boolean") return;
    if (!res.ok) {
      let bodyText = "";
      try {
        bodyText = await res.clone().text();
      } catch {
      }
      throw new Error(`Cron job ${jobName} failed with status ${res.status}${bodyText ? `: ${bodyText}` : ""}`);
    }
  }
  __name(runAndAssertOk, "runAndAssertOk");
  return {
    quick_state_update: /* @__PURE__ */ __name(async () => {
      await runAndAssertOk(controller.quickStateUpdate(), "quick_state_update");
    }, "quick_state_update"),
    full_sync: /* @__PURE__ */ __name(async () => {
      await runAndAssertOk(controller.fullDataSync(), "full_sync");
    }, "full_sync"),
    historical_backfill: /* @__PURE__ */ __name(async () => {
      await runAndAssertOk(controller.historicalBackfill(), "historical_backfill");
    }, "historical_backfill"),
    data_quality_check: /* @__PURE__ */ __name(async () => {
      await runAndAssertOk(controller.dataQualityCheck(), "data_quality_check");
    }, "data_quality_check"),
    ai_data_processing: /* @__PURE__ */ __name(async () => {
      await runAndAssertOk(controller.aiDataProcessing(), "ai_data_processing");
    }, "ai_data_processing")
  };
}
__name(buildJobs, "buildJobs");
async function ensureTable(db) {
  try {
    await db.prepare(`CREATE TABLE IF NOT EXISTS cron_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job TEXT NOT NULL,
      cron TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      success INTEGER NOT NULL,
      error TEXT
    )`).run();
  } catch {
  }
}
__name(ensureTable, "ensureTable");
async function persistCronRun(env, meta) {
  const db = env?.TESLA_DB;
  if (db) {
    await ensureTable(db);
    try {
      await db.prepare(`INSERT INTO cron_metrics (job, cron, started_at, finished_at, duration_ms, success, error)
        VALUES (?, ?, ?, ?, ?, ?, ?)`).bind(meta.job, meta.cron, meta.startedAt, meta.finishedAt, meta.durationMs, meta.success ? 1 : 0, meta.error || null).run();
      return;
    } catch {
    }
  }
  const kv = env?.AUTH_TOKENS;
  if (kv?.put) {
    try {
      await kv.put(`cron:last:${meta.job}`, JSON.stringify(meta), { expirationTtl: 604800 });
    } catch {
    }
  }
}
__name(persistCronRun, "persistCronRun");
function withTimeout(promise, ms, label) {
  let to;
  const timeout = new Promise((_, reject) => {
    to = setTimeout(() => reject(new Error(`Timeout after ${ms}ms in ${label}`)), ms);
  });
  return Promise.race([promise.finally(() => clearTimeout(to)), timeout]);
}
__name(withTimeout, "withTimeout");
async function recordRun(env, cron, job, fn, timeoutMs = 25e3) {
  const started = Date.now();
  try {
    await withTimeout(fn(), timeoutMs, job);
    await persistCronRun(env, { job, cron, startedAt: new Date(started).toISOString(), finishedAt: (/* @__PURE__ */ new Date()).toISOString(), durationMs: Date.now() - started, success: true });
    console.log(JSON.stringify({ level: "info", event: "cron.job.ok", job, cron, ms: Date.now() - started }));
  } catch (err) {
    await persistCronRun(env, { job, cron, startedAt: new Date(started).toISOString(), finishedAt: (/* @__PURE__ */ new Date()).toISOString(), durationMs: Date.now() - started, success: false, error: err?.message || String(err) });
    console.log(JSON.stringify({ level: "error", event: "cron.job.fail", job, cron, error: err?.message }));
  }
}
__name(recordRun, "recordRun");
function isAllowedOrigin(origin) {
  if (origin === "http://localhost:8080") return true;
  if (origin === "http://localhost:3000") return true;
  if (origin === "http://localhost:5173") return true;
  if (origin === "https://awhittlewandering.com") return true;
  if (origin === "https://www.awhittlewandering.com") return true;
  if (/^https:\/\/[a-z0-9-]+\.awhittlewandering\.com$/i.test(origin)) return true;
  if (origin === "https://awhittlewandering.pages.dev") return true;
  if (origin === "https://awhittlewandering-frontend.pages.dev") return true;
  if (origin === "https://awhittlewandering-site.pages.dev") return true;
  if (/^https:\/\/[a-z0-9-]+\.awhittlewandering-frontend\.pages\.dev$/i.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.awhittlewandering-site\.pages\.dev$/i.test(origin)) return true;
  if (/^https:\/\/([a-z0-9-]+\.)?awhittlewandering\.pages\.dev$/i.test(origin)) return true;
  return false;
}
__name(isAllowedOrigin, "isAllowedOrigin");
var corsMiddleware = cors({
  origin: /* @__PURE__ */ __name((origin) => {
    if (!origin) return null;
    return isAllowedOrigin(origin) ? origin : null;
  }, "origin"),
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-Client-ID", "Accept"],
  credentials: true,
  maxAge: 86400
});
async function securityHeaders(c, next) {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("X-XSS-Protection", "1; mode=block");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  c.res.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  if (c.req.path.startsWith("/api/")) {
    c.res.headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  }
}
__name(securityHeaders, "securityHeaders");
async function requestLogger(c, next) {
  const cid = crypto.randomUUID();
  setCorrelationId(cid);
  const start = Date.now();
  logger.info("request.start", { correlationId: cid, method: c.req.method, path: c.req.path });
  try {
    await next();
    logger.info("request.end", { correlationId: cid, status: c.res.status, durationMs: Date.now() - start });
  } catch (err) {
    logger.error("request.error", { correlationId: cid, error: err?.message });
    throw err;
  } finally {
    setCorrelationId(void 0);
  }
}
__name(requestLogger, "requestLogger");
async function analyticsLogger(c, next) {
  const start = Date.now();
  const ip = c.req.header("CF-Connecting-IP") || "unknown";
  const userAgent = c.req.header("User-Agent") || "unknown";
  await next();
  const duration = Date.now() - start;
  try {
    if (c.env?.TELEMETRY_ANALYTICS) {
      c.env.TELEMETRY_ANALYTICS.writeDataPoint({
        blobs: [
          c.req.method,
          c.req.url,
          ip,
          userAgent.substring(0, 100),
          c.res.status.toString()
        ],
        doubles: [duration, c.res.status],
        indexes: [c.req.method, c.res.status.toString()]
      });
    }
  } catch (error) {
    logger.warn("analytics.write.failed", { error: error?.message });
  }
  try {
    if (c.env?.TESLA_DB) {
      await c.env.TESLA_DB.prepare(`
        INSERT INTO analytics_events 
        (event_type, event_data, user_ip, user_agent, processing_time_ms, status_code)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        "api_call",
        JSON.stringify({
          method: c.req.method,
          path: new URL(c.req.url).pathname,
          query: new URL(c.req.url).search
        }),
        ip,
        userAgent,
        duration,
        c.res.status
      ).run();
    }
  } catch (error) {
    logger.warn("analytics.d1.failed", { error: error?.message });
  }
}
__name(analyticsLogger, "analyticsLogger");
var RateLimiter = class {
  static {
    __name(this, "RateLimiter");
  }
  buckets = /* @__PURE__ */ new Map();
  maxTokens;
  refillRate;
  // tokens per second
  constructor(maxTokens = 100, refillRate = 10) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
  }
  canProceed(ip) {
    const now = Date.now();
    let bucket = this.buckets.get(ip);
    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(ip, bucket);
      return true;
    }
    const timePassed = (now - bucket.lastRefill) / 1e3;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + timePassed * this.refillRate);
    bucket.lastRefill = now;
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }
  recordCall(ip) {
  }
};
var rateLimiter = new RateLimiter();
async function rateLimit(c, next) {
  const ip = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  if (!rateLimiter.canProceed(ip)) {
    return c.json({ error: "Rate limit exceeded" }, 429);
  }
  await next();
}
__name(rateLimit, "rateLimit");
async function errorHandler2(c, next) {
  try {
    await next();
  } catch (err) {
    const extracted = extractError(err);
    logger.error("request.unhandled_error", { path: c.req.path, error: extracted.message });
    const status = err?.status || 500;
    const message = err?.message || "Internal server error";
    return c.json({
      error: message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      path: c.req.path
    }, status);
  }
}
__name(errorHandler2, "errorHandler");
function getLatencySnapshot() {
  try {
    if (globalThis.__LAT_SNAPSHOT__) return globalThis.__LAT_SNAPSHOT__();
  } catch {
  }
  return null;
}
__name(getLatencySnapshot, "getLatencySnapshot");
var healthRouter = new Hono2();
healthRouter.get("/", async (c) => {
  const start = Date.now();
  const db = c.env?.TESLA_DB;
  const health = {
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: "3.0.0",
    service: "A Whittle Wandering - Unified Cloudflare Stack",
    resources: {
      d1_database: "unknown",
      r2_storage: "unknown",
      analytics_engine: "assumed",
      queue_system: c.env?.DATA_PROCESSOR ? "configured" : "not_configured"
    },
    ingestion: {},
    performance: {},
    warnings: []
  };
  if (db) {
    try {
      await db.prepare("SELECT 1").first();
      health.resources.d1_database = "operational";
    } catch (e) {
      health.resources.d1_database = "error";
      health.status = "degraded";
      const errorMsg = e instanceof Error ? e.message : String(e);
      health.warnings.push(`D1 database not reachable: ${errorMsg.substring(0, 100)}`);
      logger.error("D1 database error", { error: e instanceof Error ? e.message : String(e) });
    }
  } else {
    health.warnings.push("D1 database not configured");
  }
  if (c.env?.MEDIA_BUCKET) {
    try {
      await c.env.MEDIA_BUCKET.list({ limit: 1 });
      health.resources.r2_storage = "operational";
    } catch (e) {
      health.resources.r2_storage = "error";
      health.status = "degraded";
      const errorMsg = e instanceof Error ? e.message : String(e);
      health.warnings.push(`R2 storage not reachable: ${errorMsg.substring(0, 100)}`);
      logger.error("R2 storage error", { error: e instanceof Error ? e.message : String(e) });
    }
  } else {
    health.warnings.push("R2 storage not configured");
  }
  if (db) {
    try {
      let ageSec2 = /* @__PURE__ */ __name(function(ts) {
        return ts ? Math.round((nowMs - new Date(ts).getTime()) / 1e3) : null;
      }, "ageSec2");
      var ageSec = ageSec2;
      const lastVehicleState = await db.prepare(`SELECT timestamp FROM vehicle_state ORDER BY timestamp DESC LIMIT 1`).first();
      const lastDrive = await db.prepare(`SELECT COALESCE(ended_at, started_at) AS ts FROM drives ORDER BY ts DESC LIMIT 1`).first();
      const lastCharge = await db.prepare(`SELECT COALESCE(ended_at, started_at) AS ts FROM charges ORDER BY ts DESC LIMIT 1`).first();
      const statesVisited = await db.prepare(`SELECT COUNT(DISTINCT start_state) as cnt FROM drives WHERE start_state IS NOT NULL`).first();
      const driveCount = await db.prepare(`SELECT COUNT(1) as cnt FROM drives`).first();
      const chargeCount = await db.prepare(`SELECT COUNT(1) as cnt FROM charges`).first();
      const nowMs = Date.now();
      const vsTs = lastVehicleState?.timestamp;
      const driveTs = lastDrive?.ts;
      const chargeTs = lastCharge?.ts;
      const vehicleStateAge = ageSec2(vsTs);
      const driveDataAge = ageSec2(driveTs);
      const chargeDataAge = ageSec2(chargeTs);
      health.ingestion = {
        vehicleState: { lastUpdate: vsTs || null, ageSeconds: vehicleStateAge },
        drives: { lastUpdate: driveTs || null, ageSeconds: driveDataAge, total: driveCount?.cnt || 0 },
        charges: { lastUpdate: chargeTs || null, ageSeconds: chargeDataAge, total: chargeCount?.cnt || 0 },
        statesVisited: statesVisited?.cnt || 0
      };
      if (vehicleStateAge != null) {
        if (vehicleStateAge > 24 * 3600) {
          health.status = "unhealthy";
          health.warnings.push("Vehicle state older than 24h");
        } else if (vehicleStateAge > 6 * 3600) {
          health.status = "degraded";
          health.warnings.push("Vehicle state older than 6h");
        }
      } else {
        health.status = "degraded";
        health.warnings.push("No vehicle state data");
      }
    } catch (e) {
      health.status = "degraded";
      health.warnings.push("Failed to compute ingestion metrics");
    }
  }
  health.performance.responseTimeMs = Date.now() - start;
  const lat = getLatencySnapshot();
  if (lat) {
    health.performance.latency = lat;
  }
  return c.json(health, health.status === "unhealthy" ? 503 : 200);
});
healthRouter.get("/simple", async (c) => {
  return c.json({
    status: "ok",
    timestamp: Date.now(),
    service: "A Whittle Wandering API"
  });
});
var TelemetrySchema = external_exports.object({
  vin: external_exports.string(),
  timestamp: external_exports.string(),
  location: external_exports.object({
    latitude: external_exports.number(),
    longitude: external_exports.number()
  }),
  battery: external_exports.object({
    level: external_exports.number(),
    range: external_exports.number()
  }),
  charging: external_exports.object({
    state: external_exports.string(),
    power: external_exports.number().optional()
  }).optional(),
  vehicle: external_exports.object({
    state: external_exports.string(),
    odometer: external_exports.number().optional()
  }).optional()
});
var HealthResponseSchema = external_exports.object({
  status: external_exports.enum(["ok", "degraded", "unhealthy"]),
  timestamp: external_exports.string(),
  version: external_exports.string(),
  service: external_exports.string(),
  resources: external_exports.record(external_exports.string()),
  ingestion: external_exports.record(external_exports.any()).optional(),
  performance: external_exports.record(external_exports.number()).optional(),
  warnings: external_exports.array(external_exports.string()).optional()
});
var telemetryRouter = new Hono2();
telemetryRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const telemetryData = TelemetrySchema.parse(body);
    return c.json({
      ok: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      received: {
        vin: telemetryData.vin,
        timestamp: telemetryData.timestamp
      }
    });
  } catch (error) {
    return c.json({
      ok: false,
      error: error instanceof Error ? error.message : "Invalid telemetry data",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }, 400);
  }
});
telemetryRouter.get("/status", async (c) => {
  try {
    const db = c.env?.TESLA_DB;
    if (!db) {
      return c.json({ error: "Database not configured" }, 500);
    }
    const drives = await db.prepare(`SELECT COUNT(*) as cnt FROM drives`).first();
    const charges = await db.prepare(`SELECT COUNT(*) as cnt FROM charges`).first();
    const states = await db.prepare(`SELECT COUNT(DISTINCT start_state) as s FROM drives WHERE start_state IS NOT NULL`).first();
    const lastDrive = await db.prepare(`SELECT MAX(ended_at) as last_ended FROM drives`).first();
    const lastCharge = await db.prepare(`SELECT MAX(ended_at) as last_ended FROM charges`).first();
    return c.json({
      success: true,
      drives: drives?.cnt || 0,
      charges: charges?.cnt || 0,
      statesVisited: states?.s || 0,
      lastDriveAt: lastDrive?.last_ended || null,
      lastChargeAt: lastCharge?.last_ended || null,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    return c.json({
      success: false,
      error: "Status unavailable",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }, 500);
  }
});
var SimpleCache = class {
  static {
    __name(this, "SimpleCache");
  }
  cache = /* @__PURE__ */ new Map();
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
  set(key, data, ttlSeconds = 30) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1e3
    });
  }
  delete(key) {
    this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
};
var cache = new SimpleCache();
var CacheService = class {
  static {
    __name(this, "CacheService");
  }
  static async get(c, key) {
    const cached = cache.get(key);
    if (cached) return cached;
    if (c.env?.TESLA_DB) {
      try {
        const result = await c.env.TESLA_DB.prepare(`
          SELECT cache_data FROM api_cache
          WHERE cache_key = ? AND expires_at > datetime('now')
        `).bind(key).first();
        if (result?.cache_data) {
          const data = JSON.parse(result.cache_data);
          cache.set(key, data, 15);
          return data;
        }
      } catch (e) {
        console.warn("D1 cache read failed:", e);
      }
    }
    return null;
  }
  static async set(c, key, data, ttlSeconds = 30) {
    cache.set(key, data, ttlSeconds);
    if (c.env?.TESLA_DB) {
      try {
        const expiresAt = new Date(Date.now() + ttlSeconds * 1e3).toISOString();
        await c.env.TESLA_DB.prepare(`
          INSERT OR REPLACE INTO api_cache (cache_key, cache_data, cache_type, expires_at)
          VALUES (?, ?, 'json', ?)
        `).bind(key, JSON.stringify(data), expiresAt).run();
      } catch (e) {
        console.warn("D1 cache write failed:", e);
      }
    }
  }
  static async delete(c, key) {
    cache.delete(key);
    if (c.env?.TESLA_DB) {
      try {
        await c.env.TESLA_DB.prepare(`DELETE FROM api_cache WHERE cache_key = ?`).bind(key).run();
      } catch (e) {
        console.warn("D1 cache delete failed:", e);
      }
    }
  }
};
var unifiedDataRouter = new Hono2();
var JOURNEY_ID = "continental-usa-2025";
var VEHICLE_ID = "midnight-shadow";
var querySchema = external_exports.object({
  revalidate: external_exports.union([external_exports.literal("true"), external_exports.literal("false")]).optional(),
  limit: external_exports.string().regex(/^\d+$/).optional()
});
function isoToDateOnly(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}
__name(isoToDateOnly, "isoToDateOnly");
function daysSince(dateStr) {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  if (Number.isNaN(start.getTime())) return 0;
  const diffMs = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diffMs / (1e3 * 60 * 60 * 24)) + 1);
}
__name(daysSince, "daysSince");
function freshnessFromAgeSec(ageSec) {
  if (ageSec == null) return "unknown";
  if (ageSec <= 20 * 60) return "live";
  return "cached";
}
__name(freshnessFromAgeSec, "freshnessFromAgeSec");
async function buildUnifiedData(c, limit) {
  const db = c.env?.TESLA_DB;
  const skeleton = {
    overview: {
      tripName: "A Whittle Wandering - Continental USA",
      vehicle: "Midnight Shadow",
      startDate: "2025-06-01",
      daysElapsed: daysSince("2025-06-01"),
      totalMiles: 0,
      currentOdometer: 0,
      statesVisited: 0,
      totalStates: 48
    },
    currentStatus: {
      battery: { level: 0, range: 0, charging: "Unknown" },
      location: { coordinates: { lat: 0, lng: 0 }, city: "Unknown", state: "Unknown", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() },
      vehicle: { odometer: 0, speed: 0, heading: 0, temperature: { inside: void 0, outside: void 0 } }
    },
    timeline: { drives: [], charges: [] },
    liveData: { timestamp: Date.now(), vehicleState: {}, recentActivity: {} },
    tessieStatus: { connected: !!(c.env?.TESSIE_API_TOKEN || c.env?.TESSIE_API_KEY), lastUpdate: (/* @__PURE__ */ new Date()).toISOString(), dataFreshness: "unknown", error: void 0 }
  };
  if (!db) {
    logger.error("unified.build.error", { error: "Database binding not available" });
    skeleton.tessieStatus.error = "Database not configured";
    return skeleton;
  }
  try {
    await db.prepare("SELECT 1").first();
  } catch (dbError) {
    logger.error("unified.build.error", { error: `Database connection failed: ${dbError?.message || String(dbError)}` });
    skeleton.tessieStatus.error = `Database connection failed: ${dbError?.message || "Unknown error"}`;
    return skeleton;
  }
  try {
    const journeyRow = await db.prepare(
      `SELECT j.id, j.name, j.start_date, j.target_states, j.total_miles, v.display_name
       FROM journeys j
       LEFT JOIN vehicles v ON v.id = j.vehicle_id
       WHERE j.id = ? LIMIT 1`
    ).bind(JOURNEY_ID).first();
    const startDate = journeyRow?.start_date || skeleton.overview.startDate;
    skeleton.overview.tripName = journeyRow?.name || skeleton.overview.tripName;
    skeleton.overview.vehicle = journeyRow?.display_name || skeleton.overview.vehicle;
    skeleton.overview.startDate = startDate;
    skeleton.overview.daysElapsed = daysSince(startDate);
    skeleton.overview.totalStates = Number(journeyRow?.target_states || skeleton.overview.totalStates);
    const vs = await db.prepare(
      `SELECT battery_level, battery_range, charging_state, latitude, longitude, heading, speed, odometer,
              inside_temp, outside_temp, timestamp, state_name, city
       FROM vehicle_state
       WHERE vehicle_id = ?
       LIMIT 1`
    ).bind(VEHICLE_ID).first();
    const vsTs = vs?.timestamp;
    const ageSec = vsTs ? Math.round((Date.now() - new Date(vsTs).getTime()) / 1e3) : null;
    skeleton.tessieStatus.lastUpdate = vsTs || skeleton.tessieStatus.lastUpdate;
    skeleton.tessieStatus.dataFreshness = freshnessFromAgeSec(ageSec);
    if (vs) {
      skeleton.currentStatus.battery = {
        level: Number(vs.battery_level || 0),
        range: Number(vs.battery_range || 0),
        charging: vs.charging_state || "Unknown"
      };
      skeleton.currentStatus.location = {
        coordinates: { lat: Number(vs.latitude || 0), lng: Number(vs.longitude || 0) },
        city: vs.city || "Unknown",
        state: vs.state_name || "Unknown",
        lastUpdate: vsTs || (/* @__PURE__ */ new Date()).toISOString()
      };
      skeleton.currentStatus.vehicle = {
        odometer: Number(vs.odometer || 0),
        speed: Number(vs.speed || 0),
        heading: Number(vs.heading || 0),
        temperature: { inside: vs.inside_temp ?? void 0, outside: vs.outside_temp ?? void 0 }
      };
      skeleton.liveData.vehicleState = {
        charge_state: {
          battery_level: skeleton.currentStatus.battery.level,
          battery_range: skeleton.currentStatus.battery.range,
          charging_state: skeleton.currentStatus.battery.charging
        },
        drive_state: {
          latitude: skeleton.currentStatus.location.coordinates.lat,
          longitude: skeleton.currentStatus.location.coordinates.lng,
          heading: skeleton.currentStatus.vehicle.heading,
          speed: skeleton.currentStatus.vehicle.speed
        },
        climate_state: {
          inside_temp: skeleton.currentStatus.vehicle.temperature.inside,
          outside_temp: skeleton.currentStatus.vehicle.temperature.outside
        },
        vehicle_state: {
          odometer: skeleton.currentStatus.vehicle.odometer
        },
        timestamp: vsTs ? new Date(vsTs).getTime() : Date.now()
      };
    }
    const driveStats = await db.prepare(
      `SELECT COUNT(*) as total_drives, COALESCE(SUM(distance_miles), 0) as total_miles
       FROM drives WHERE journey_id = ?`
    ).bind(JOURNEY_ID).first();
    const chargeStats = await db.prepare(
      `SELECT COUNT(*) as total_charges FROM charges WHERE journey_id = ?`
    ).bind(JOURNEY_ID).first();
    const statesCount = await db.prepare(
      `SELECT COUNT(*) as cnt FROM states_visited WHERE journey_id = ?`
    ).bind(JOURNEY_ID).first();
    const computedMiles = Number(driveStats?.total_miles || 0);
    skeleton.overview.totalMiles = computedMiles || Number(journeyRow?.total_miles || 0);
    skeleton.overview.statesVisited = Number(statesCount?.cnt || 0);
    skeleton.overview.currentOdometer = skeleton.currentStatus.vehicle.odometer || skeleton.overview.currentOdometer;
    const drives = await db.prepare(
      `SELECT id, started_at, ended_at, start_address, end_address, distance_miles, duration_minutes, energy_used_kwh
       FROM drives
       WHERE journey_id = ?
       ORDER BY started_at DESC
       LIMIT ?`
    ).bind(JOURNEY_ID, limit).all();
    const charges = await db.prepare(
      `SELECT id, started_at, ended_at, location, energy_added_kwh, duration_minutes
       FROM charges
       WHERE journey_id = ?
       ORDER BY started_at DESC
       LIMIT ?`
    ).bind(JOURNEY_ID, limit).all();
    const driveRows = drives?.results || [];
    const chargeRows = charges?.results || [];
    skeleton.timeline.drives = driveRows.map((d) => ({
      id: d.id,
      date: isoToDateOnly(d.started_at) || isoToDateOnly(d.ended_at) || skeleton.overview.startDate,
      startLocation: d.start_address || "Unknown",
      endLocation: d.end_address || "Unknown",
      distance: Number(d.distance_miles || 0),
      duration: Number(d.duration_minutes || 0),
      energyUsed: Number(d.energy_used_kwh || 0)
    }));
    skeleton.timeline.charges = chargeRows.map((ch) => ({
      id: ch.id,
      date: isoToDateOnly(ch.started_at) || isoToDateOnly(ch.ended_at) || skeleton.overview.startDate,
      location: ch.location || "Unknown",
      energyAdded: Number(ch.energy_added_kwh || 0),
      duration: Number(ch.duration_minutes || 0)
    }));
    skeleton.liveData.recentActivity = {
      lastDrive: skeleton.timeline.drives[0],
      lastCharge: skeleton.timeline.charges[0]
    };
    return skeleton;
  } catch (err) {
    logger.error("unified.build.error", { error: err?.message });
    skeleton.tessieStatus.error = "Failed to build unified data";
    return skeleton;
  }
}
__name(buildUnifiedData, "buildUnifiedData");
unifiedDataRouter.get("/", async (c) => {
  try {
    const parsed = querySchema.safeParse(c.req.query());
    const limit = Math.min(50, Math.max(1, Number(parsed.success ? parsed.data.limit || "20" : 20)));
    const revalidate = parsed.success && parsed.data.revalidate === "true";
    const cacheKey = `unified_data_v3:limit=${limit}`;
    if (!revalidate) {
      const cached = await CacheService.get(c, cacheKey);
      if (cached) return c.json(cached);
    }
    const unified = await buildUnifiedData(c, limit);
    await CacheService.set(c, cacheKey, unified, 15);
    return c.json(unified);
  } catch (err) {
    logger.error("unified.endpoint.error", { error: err?.message, stack: err?.stack });
    const skeleton = {
      overview: { tripName: "Error", vehicle: "Error", startDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), daysElapsed: 0, totalMiles: 0, currentOdometer: 0, statesVisited: 0, totalStates: 48 },
      currentStatus: { battery: { level: 0, range: 0, charging: "Unknown" }, location: { coordinates: { lat: 0, lng: 0 }, city: "Unknown", state: "Unknown", lastUpdate: (/* @__PURE__ */ new Date()).toISOString() }, vehicle: { odometer: 0, speed: 0, heading: 0, temperature: { inside: void 0, outside: void 0 } } },
      timeline: { drives: [], charges: [] },
      liveData: { timestamp: Date.now(), vehicleState: {}, recentActivity: {} },
      tessieStatus: { connected: false, lastUpdate: (/* @__PURE__ */ new Date()).toISOString(), dataFreshness: "unknown", error: err?.message || "Unknown error" }
    };
    return c.json(skeleton, 200);
  }
});
var tripStatusRouter = new Hono2();
tripStatusRouter.get("/", async (c) => {
  return c.json({
    tripId: "continental-usa-2025",
    tripName: `A Whittle Wandering - ${(/* @__PURE__ */ new Date()).getFullYear()}`,
    status: "active",
    timestamp: Date.now()
  });
});
tripStatusRouter.get("/config", async (c) => {
  const config = {
    // Mapbox token from environment (prefer MAPBOX_API_TOKEN if available)
    mapboxToken: c.env?.MAPBOX_API_TOKEN || null,
    apiBaseUrl: "https://awhittlewandering-api.kd8jc7v8cd.workers.dev",
    appName: "A Whittle Wandering",
    apiVersion: "3.0.0",
    features: {
      liveTeslaData: !!(c.env?.TESSIE_API_TOKEN || c.env?.TESSIE_API_KEY),
      mapIntegration: !!c.env?.MAPBOX_API_TOKEN,
      realtimeUpdates: true
    },
    updateInterval: 3e4
    // 30 seconds
  };
  return c.json(config);
});
function b64urlToBytes(s) {
  const pad = "=".repeat((4 - s.length % 4) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
__name(b64urlToBytes, "b64urlToBytes");
function bytesToB64url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(bytesToB64url, "bytesToB64url");
function jsonToB64url(obj) {
  return bytesToB64url(new TextEncoder().encode(JSON.stringify(obj)));
}
__name(jsonToB64url, "jsonToB64url");
function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
__name(safeJsonParse, "safeJsonParse");
async function signJwtHS256(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const h = jsonToB64url(header);
  const p = jsonToB64url(payload);
  const data = new TextEncoder().encode(`${h}.${p}`);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  return `${h}.${p}.${bytesToB64url(sig)}`;
}
__name(signJwtHS256, "signJwtHS256");
async function verifyJwtHS256(token, secrets, nowSec = Math.floor(Date.now() / 1e3)) {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "format" };
  const [h, p, s] = parts;
  const headerJson = new TextDecoder().decode(b64urlToBytes(h));
  const payloadJson = new TextDecoder().decode(b64urlToBytes(p));
  const header = safeJsonParse(headerJson);
  const payload = safeJsonParse(payloadJson);
  if (!header || header.alg !== "HS256") return { ok: false, reason: "alg" };
  if (!payload || typeof payload !== "object") return { ok: false, reason: "payload" };
  const data = new TextEncoder().encode(`${h}.${p}`);
  const sig = b64urlToBytes(s);
  for (const secret of secrets) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const ok = await crypto.subtle.verify("HMAC", key, sig, data);
    if (!ok) continue;
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const nbf = typeof payload.nbf === "number" ? payload.nbf : null;
    if (nbf != null && nowSec < nbf) return { ok: false, reason: "nbf" };
    if (exp != null && nowSec >= exp) return { ok: false, reason: "exp" };
    return { ok: true, payload };
  }
  return { ok: false, reason: "sig" };
}
__name(verifyJwtHS256, "verifyJwtHS256");
var adminRouter = new Hono2();
adminRouter.post("/auth/token", async (c) => {
  const env = c.env;
  const jwtSecret = String(env?.JWT_SECRET || "").trim();
  if (!jwtSecret) {
    return c.json({ ok: false, error: "JWT_SECRET not configured" }, 503);
  }
  const nowSec = Math.floor(Date.now() / 1e3);
  const ttlSec = 60 * 60;
  const payload = {
    admin: true,
    scope: "admin",
    iat: nowSec,
    exp: nowSec + ttlSec,
    jti: (() => {
      try {
        return crypto.randomUUID();
      } catch {
        return String(nowSec);
      }
    })()
  };
  const token = await signJwtHS256(payload, jwtSecret);
  return c.json({ ok: true, token, expiresInSec: ttlSec });
});
adminRouter.post("/cache/clear", async (c) => {
  try {
    await CacheService.delete(c, "unified_data_latest_v2");
    const env = c.env;
    if (env?.TESLA_DB) {
      await env.TESLA_DB.prepare(`DELETE FROM api_cache WHERE cache_key LIKE 'unified_data%'`).run();
    }
    return c.json({
      success: true,
      message: "Cache cleared",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to clear cache",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }, 500);
  }
});
adminRouter.get("/status", async (c) => {
  const env = c.env;
  const status = {
    service: "A Whittle Wandering Admin",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    adminTokenConfigured: !!env?.ADMIN_TOKEN,
    dbAvailable: !!env?.TESLA_DB,
    tessieConfigured: !!(env?.TESSIE_API_TOKEN || env?.TESSIE_API_KEY),
    environment: env?.ENVIRONMENT || "unknown",
    platformMode: env?.PLATFORM_MODE || "live"
  };
  return c.json(status);
});
adminRouter.post("/ingest", async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: "No DB bound" }, 500);
  const tessieKey = env.TESSIE_API_TOKEN || env.TESSIE_API_KEY || "";
  if (!tessieKey) return c.json({ ok: false, error: "No Tessie API key configured" }, 503);
  let vin = env.TESLA_VIN || "";
  if (!vin) {
    try {
      const vehicle = await env.TESLA_DB.prepare(
        "SELECT vin FROM vehicles WHERE id = ?"
      ).bind("midnight-shadow").first();
      vin = vehicle?.vin || "";
    } catch (e) {
    }
  }
  if (!vin || vin === "UNKNOWN_VIN") {
    return c.json({ ok: false, error: "VIN not configured. Set TESLA_VIN secret or update vehicles table." }, 503);
  }
  try {
    const ingestion = new TeslaDataIngestion(env.TESLA_DB, tessieKey, vin);
    const result = await ingestion.ingestAllData();
    try {
      await env.TESLA_DB.prepare(`
        INSERT INTO ingestion_logs
        (operation, records_processed, success, errors, duration_ms, api_calls_made, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        "manual_ingest",
        result.recordsProcessed,
        result.success,
        JSON.stringify(result.errors),
        0,
        // duration not tracked for manual
        0,
        // api calls not tracked
        result.timestamp
      ).run();
    } catch (logError) {
      console.error("Failed to log manual ingestion:", logError);
    }
    return c.json({
      ok: true,
      operation: "manual_ingest",
      success: result.success,
      recordsProcessed: result.recordsProcessed,
      errors: result.errors,
      timestamp: result.timestamp,
      message: result.success ? `Successfully ingested ${result.recordsProcessed} records` : `Ingestion completed with ${result.errors.length} errors`
    }, result.success ? 200 : 207);
  } catch (error) {
    console.error("Manual ingestion failed:", error);
    return c.json({
      ok: false,
      operation: "manual_ingest",
      error: error.message || "Unknown error during ingestion",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }, 500);
  }
});
adminRouter.get("/cron/metrics", async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: "No DB bound" }, 500);
  try {
    const rows = await env.TESLA_DB.prepare(`SELECT job, cron, started_at, finished_at, duration_ms, success, error
      FROM cron_metrics ORDER BY id DESC LIMIT 25`).all();
    return c.json({ ok: true, count: rows.results?.length || 0, rows: rows.results });
  } catch (e) {
    return c.json({ ok: false, error: e?.message || "query failed" }, 500);
  }
});
var dataQuerySchema = external_exports.object({
  limit: external_exports.string().regex(/^\d+$/).optional(),
  offset: external_exports.string().regex(/^\d+$/).optional()
});
var RESOURCES = {
  vehicles: { sql: `SELECT id, vin, display_name, vehicle_type, model, year, color, created_at, updated_at FROM vehicles` },
  journeys: { sql: `SELECT id, vehicle_id, name, description, start_date, end_date, total_states, target_states, total_miles, total_drives, total_charges, total_energy_used_kwh, total_cost_usd, overall_efficiency_miles_per_kwh, status, created_at, updated_at FROM journeys` },
  vehicle_state: { sql: `SELECT vehicle_id, vin, battery_level, battery_range, charging_state, latitude, longitude, heading, speed, odometer, inside_temp, outside_temp, shift_state, power, locked, climate_on, car_version, timestamp, state_name, city, address, created_at, updated_at FROM vehicle_state` },
  vehicle_state_history: { sql: `SELECT id, vehicle_id, vin, battery_level, battery_range, charging_state, latitude, longitude, heading, speed, odometer, inside_temp, outside_temp, power, timestamp, created_at FROM vehicle_state_history` },
  drives: { sql: `SELECT id, tessie_id, vehicle_id, journey_id, started_at, ended_at, start_address, end_address, start_latitude, start_longitude, end_latitude, end_longitude, start_state, end_state, distance_miles, duration_minutes, energy_used_kwh, average_speed, max_speed, start_battery_level, end_battery_level, outside_temp_avg, efficiency_miles_per_kwh, route_complexity, created_at FROM drives` },
  charges: { sql: `SELECT id, tessie_id, vehicle_id, journey_id, started_at, ended_at, location, latitude, longitude, state_name, city, charger_type, charger_power_kw, energy_added_kwh, energy_used_kwh, charge_rate_avg, charge_rate_max, peak_charging_rate, start_battery_level, end_battery_level, start_range, end_range, miles_added, cost_usd, cost_per_kwh, duration_minutes, is_supercharger, charge_port_type, charging_efficiency_kw, charging_network, created_at FROM charges` },
  states_visited: { sql: `SELECT id, journey_id, state_name, state_code, first_visited_date, first_drive_id, visit_count, total_miles_in_state, total_time_minutes, entry_latitude, entry_longitude, entry_address, is_current_state, last_updated, created_at FROM states_visited` },
  daily_analytics: { sql: `SELECT id, journey_id, date, total_drives, total_distance_miles, total_energy_used_kwh, total_charges, total_energy_added_kwh, total_cost_usd, avg_speed_mph, max_speed_mph, efficiency_miles_per_kwh, avg_charge_rate_kw, supercharger_sessions, destination_charges, total_charge_time_minutes, states_visited_count, cities_visited_count, created_at, updated_at FROM daily_analytics` },
  efficiency_metrics: { sql: `SELECT id, journey_id, vehicle_id, date, miles_driven, energy_consumed_kwh, efficiency_miles_per_kwh, avg_outside_temp_f, avg_speed_mph, elevation_gain_ft, highway_miles_percent, city_miles_percent, created_at FROM efficiency_metrics` },
  ingestion_logs: { sql: `SELECT id, operation, records_processed, success, errors, duration_ms, api_calls_made, timestamp FROM ingestion_logs` },
  api_cache: { sql: `SELECT cache_key, cache_type, expires_at, created_at, metadata FROM api_cache` },
  media: { sql: `SELECT id, journey_id, vehicle_id, filename, original_filename, mime_type, file_size, r2_object_key, title, description, latitude, longitude, state_name, city, address, taken_at, drive_id, charge_id, tags, is_favorite, view_count, created_at, updated_at FROM media` }
  // Deliberately exclude analytics_events (contains IP/user-agent) from generic export.
};
adminRouter.get("/data/:resource", async (c) => {
  const env = c.env;
  if (!env?.TESLA_DB) return c.json({ ok: false, error: "No DB bound" }, 500);
  const resource = c.req.param("resource");
  const def = RESOURCES[resource];
  if (!def) return c.json({ ok: false, error: "Unknown resource", allowed: Object.keys(RESOURCES) }, 400);
  const parsed = dataQuerySchema.safeParse(c.req.query());
  const limit = Math.min(200, Math.max(1, Number(parsed.success ? parsed.data.limit || "50" : 50)));
  const offset = Math.max(0, Number(parsed.success ? parsed.data.offset || "0" : 0));
  try {
    const rows = await env.TESLA_DB.prepare(`${def.sql} LIMIT ? OFFSET ?`).bind(limit, offset).all();
    return c.json({
      ok: true,
      resource,
      limit,
      offset,
      count: rows?.results?.length || 0,
      rows: rows?.results || []
    });
  } catch (e) {
    return c.json({ ok: false, error: e?.message || "query failed" }, 500);
  }
});
var componentRouter = new Hono2();
var JOURNEY_ID2 = "continental-usa-2025";
var VEHICLE_ID2 = "midnight-shadow";
var limitSchema = external_exports.object({
  limit: external_exports.string().regex(/^\d+$/).optional()
});
function safeLimit(q, def = 25) {
  const parsed = limitSchema.safeParse(q);
  const n = parsed.success ? Number(parsed.data.limit || def) : def;
  return Math.min(100, Math.max(1, n));
}
__name(safeLimit, "safeLimit");
componentRouter.get("/overview", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 200);
  try {
    const journey = await db.prepare(
      `SELECT id, name, start_date, target_states, total_miles, total_drives, total_charges, status
       FROM journeys WHERE id = ? LIMIT 1`
    ).bind(JOURNEY_ID2).first();
    const vs = await db.prepare(
      `SELECT odometer FROM vehicle_state WHERE vehicle_id = ? LIMIT 1`
    ).bind(VEHICLE_ID2).first();
    return c.json({
      ok: true,
      journeyId: JOURNEY_ID2,
      tripName: journey?.name || "A Whittle Wandering - Continental USA",
      startDate: journey?.start_date || "2025-06-01",
      totalStates: Number(journey?.target_states || 48),
      statesVisited: Number((await db.prepare(`SELECT COUNT(*) as cnt FROM states_visited WHERE journey_id = ?`).bind(JOURNEY_ID2).first())?.cnt || 0),
      totalMiles: Number(journey?.total_miles || 0),
      totalDrives: Number(journey?.total_drives || 0),
      totalCharges: Number(journey?.total_charges || 0),
      currentOdometer: Number(vs?.odometer || 0),
      status: journey?.status || "active",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (err) {
    logger.error("component.overview.error", { error: err?.message });
    return c.json({ ok: false, error: "Failed to fetch overview" }, 200);
  }
});
componentRouter.get("/current-status", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 200);
  try {
    const vs = await db.prepare(
      `SELECT battery_level, battery_range, charging_state, latitude, longitude, heading, speed, odometer,
              inside_temp, outside_temp, timestamp, state_name, city
       FROM vehicle_state WHERE vehicle_id = ? LIMIT 1`
    ).bind(VEHICLE_ID2).first();
    if (!vs) return c.json({ ok: false, error: "No vehicle state" }, 200);
    return c.json({
      ok: true,
      battery: {
        level: Number(vs.battery_level || 0),
        range: Number(vs.battery_range || 0),
        charging: vs.charging_state || "Unknown"
      },
      location: {
        coordinates: { lat: Number(vs.latitude || 0), lng: Number(vs.longitude || 0) },
        city: vs.city || "Unknown",
        state: vs.state_name || "Unknown",
        lastUpdate: vs.timestamp || (/* @__PURE__ */ new Date()).toISOString()
      },
      vehicle: {
        odometer: Number(vs.odometer || 0),
        speed: Number(vs.speed || 0),
        heading: Number(vs.heading || 0),
        temperature: { inside: vs.inside_temp ?? null, outside: vs.outside_temp ?? null }
      }
    });
  } catch (err) {
    logger.error("component.currentStatus.error", { error: err?.message });
    return c.json({ ok: false, error: "Failed to fetch current status" }, 200);
  }
});
componentRouter.get("/states-progress", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured", states: [] }, 200);
  try {
    const rows = await db.prepare(
      `SELECT state_name, state_code, first_visited_date, visit_count, total_miles_in_state, is_current_state
       FROM states_visited WHERE journey_id = ?
       ORDER BY first_visited_date ASC, state_name ASC`
    ).bind(JOURNEY_ID2).all();
    return c.json({ ok: true, states: rows?.results || [] });
  } catch (err) {
    logger.error("component.statesProgress.error", { error: err?.message });
    return c.json({ ok: false, error: "Failed to fetch states progress", states: [] }, 200);
  }
});
componentRouter.get("/recent-drives", async (c) => {
  const db = c.env?.TESLA_DB;
  const limit = safeLimit(c.req.query(), 10);
  if (!db) return c.json({ ok: false, error: "Database not configured", drives: [] }, 200);
  try {
    const rows = await db.prepare(
      `SELECT id, started_at, ended_at, start_address, end_address, distance_miles, duration_minutes, energy_used_kwh, start_state, end_state
       FROM drives WHERE journey_id = ?
       ORDER BY started_at DESC
       LIMIT ?`
    ).bind(JOURNEY_ID2, limit).all();
    return c.json({ ok: true, drives: rows?.results || [] });
  } catch (err) {
    logger.error("component.recentDrives.error", { error: err?.message });
    return c.json({ ok: false, error: "Failed to fetch recent drives", drives: [] }, 200);
  }
});
var analyticsRouter = new Hono2();
var JOURNEY_ID3 = "continental-usa-2025";
var querySchema2 = external_exports.object({
  limit: external_exports.string().regex(/^\d+$/).optional()
});
function limitOf(q, def) {
  const parsed = querySchema2.safeParse(q);
  const n = parsed.success ? Number(parsed.data.limit || def) : def;
  return Math.min(365, Math.max(1, n));
}
__name(limitOf, "limitOf");
analyticsRouter.get("/comprehensive", async (c) => {
  const db = c.env?.TESLA_DB;
  const limit = limitOf(c.req.query(), 90);
  if (!db) return c.json({ ok: false, error: "Database not configured", daily: [] }, 200);
  try {
    const rows = await db.prepare(
      `SELECT date, total_drives, total_distance_miles, total_energy_used_kwh, total_charges, total_energy_added_kwh,
              total_cost_usd, avg_speed_mph, max_speed_mph, efficiency_miles_per_kwh, supercharger_sessions,
              total_charge_time_minutes, states_visited_count, cities_visited_count
       FROM daily_analytics
       WHERE journey_id = ?
       ORDER BY date DESC
       LIMIT ?`
    ).bind(JOURNEY_ID3, limit).all();
    return c.json({ ok: true, daily: rows?.results || [] });
  } catch (err) {
    logger.error("analytics.comprehensive.error", { error: err?.message });
    return c.json({ ok: false, error: "Failed to fetch analytics", daily: [] }, 200);
  }
});
analyticsRouter.get("/efficiency", async (c) => {
  const db = c.env?.TESLA_DB;
  const limit = limitOf(c.req.query(), 120);
  if (!db) return c.json({ ok: false, error: "Database not configured", efficiency: [] }, 200);
  try {
    const rows = await db.prepare(
      `SELECT date, miles_driven, energy_consumed_kwh, efficiency_miles_per_kwh, avg_outside_temp_f, avg_speed_mph
       FROM efficiency_metrics
       WHERE journey_id = ?
       ORDER BY date DESC
       LIMIT ?`
    ).bind(JOURNEY_ID3, limit).all();
    return c.json({ ok: true, efficiency: rows?.results || [] });
  } catch (err) {
    logger.error("analytics.efficiency.error", { error: err?.message });
    return c.json({ ok: false, error: "Failed to fetch efficiency analytics", efficiency: [] }, 200);
  }
});
analyticsRouter.get("/charging", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured", byChargerType: [] }, 200);
  try {
    const rows = await db.prepare(
      `SELECT charger_type,
              COUNT(*) as session_count,
              COALESCE(SUM(energy_added_kwh), 0) as total_energy_added_kwh,
              COALESCE(AVG(cost_per_kwh), 0) as avg_cost_per_kwh,
              COALESCE(AVG(duration_minutes), 0) as avg_duration_minutes
       FROM charges
       WHERE journey_id = ?
       GROUP BY charger_type
       ORDER BY session_count DESC`
    ).bind(JOURNEY_ID3).all();
    return c.json({ ok: true, byChargerType: rows?.results || [] });
  } catch (err) {
    logger.error("analytics.charging.error", { error: err?.message });
    return c.json({ ok: false, error: "Failed to fetch charging analytics", byChargerType: [] }, 200);
  }
});
var vehicleRouter = new Hono2();
var JOURNEY_ID4 = "continental-usa-2025";
var VEHICLE_ID3 = "midnight-shadow";
function ageSeconds(ts) {
  if (!ts) return null;
  const ms = new Date(ts).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.round((Date.now() - ms) / 1e3);
}
__name(ageSeconds, "ageSeconds");
vehicleRouter.get("/state/enhanced", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 200);
  try {
    const vs = await db.prepare(
      `SELECT * FROM vehicle_state WHERE vehicle_id = ? LIMIT 1`
    ).bind(VEHICLE_ID3).first();
    const lastDrive = await db.prepare(
      `SELECT id, started_at, ended_at, start_address, end_address, distance_miles
       FROM drives WHERE journey_id = ?
       ORDER BY started_at DESC LIMIT 1`
    ).bind(JOURNEY_ID4).first();
    const lastCharge = await db.prepare(
      `SELECT id, started_at, ended_at, location, energy_added_kwh
       FROM charges WHERE journey_id = ?
       ORDER BY started_at DESC LIMIT 1`
    ).bind(JOURNEY_ID4).first();
    const ts = vs?.timestamp;
    return c.json({
      ok: true,
      vehicleId: VEHICLE_ID3,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      state: vs || null,
      freshness: {
        lastUpdate: ts || null,
        ageSeconds: ageSeconds(ts)
      },
      recent: {
        lastDrive: lastDrive || null,
        lastCharge: lastCharge || null
      }
    });
  } catch (err) {
    logger.error("vehicle.state.enhanced.error", { error: err?.message });
    return c.json({ ok: false, error: "Failed to fetch enhanced vehicle state" }, 200);
  }
});
var aiRouter = new Hono2();
var optimizeSchema = external_exports.object({
  start: external_exports.object({ lat: external_exports.number(), lng: external_exports.number() }),
  end: external_exports.object({ lat: external_exports.number(), lng: external_exports.number() }),
  waypoints: external_exports.array(external_exports.object({ lat: external_exports.number(), lng: external_exports.number() })).optional(),
  constraints: external_exports.record(external_exports.any()).optional()
});
var journalSchema = external_exports.object({
  date: external_exports.string().optional(),
  highlights: external_exports.array(external_exports.string()).optional(),
  context: external_exports.record(external_exports.any()).optional()
});
function aiUnavailable(c) {
  return c.json({
    ok: false,
    error: "AI not configured",
    hint: "Bind Cloudflare AI (env.AI) and set AI_MODEL_NAME / AI gateway if used.",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }, 503);
}
__name(aiUnavailable, "aiUnavailable");
aiRouter.post("/route/optimize", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "Malformed JSON body" }, 400);
  }
  const parsed = optimizeSchema.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: "Validation failed", issues: parsed.error.issues }, 400);
  if (!c.env?.AI || typeof c.env.AI.run !== "function") return aiUnavailable(c);
  try {
    const prompt = `Optimize an EV road trip route.
Start: ${parsed.data.start.lat},${parsed.data.start.lng}
End: ${parsed.data.end.lat},${parsed.data.end.lng}
Waypoints: ${JSON.stringify(parsed.data.waypoints || [])}
Constraints: ${JSON.stringify(parsed.data.constraints || {})}

Return JSON only with keys: summary, suggestedStops (array), notes.`;
    const model = c.env?.AI_MODEL_NAME || "@cf/meta/llama-3.1-8b-instruct";
    const result = await withTimeout(
      c.env.AI.run(model, { prompt }),
      12e3,
      "ai.route.optimize"
    );
    return c.json({ ok: true, model, result, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    logger.error("ai.route.optimize.error", { error: err?.message });
    return c.json({ ok: false, error: "AI request failed", timestamp: (/* @__PURE__ */ new Date()).toISOString() }, 502);
  }
});
aiRouter.post("/journal/generate", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "Malformed JSON body" }, 400);
  }
  const parsed = journalSchema.safeParse(body);
  if (!parsed.success) return c.json({ ok: false, error: "Validation failed", issues: parsed.error.issues }, 400);
  if (!c.env?.AI || typeof c.env.AI.run !== "function") return aiUnavailable(c);
  try {
    const model = c.env?.AI_MODEL_NAME || "@cf/meta/llama-3.1-8b-instruct";
    const prompt = `Write a concise travel journal entry for a Tesla road trip day.
Date: ${parsed.data.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}
Highlights: ${JSON.stringify(parsed.data.highlights || [])}
Context JSON: ${JSON.stringify(parsed.data.context || {})}

Return JSON only with keys: title, entry, bulletHighlights.`;
    const result = await withTimeout(
      c.env.AI.run(model, { prompt }),
      12e3,
      "ai.journal.generate"
    );
    return c.json({ ok: true, model, result, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (err) {
    logger.error("ai.journal.generate.error", { error: err?.message });
    return c.json({ ok: false, error: "AI request failed", timestamp: (/* @__PURE__ */ new Date()).toISOString() }, 502);
  }
});
var metaRouter = new Hono2();
metaRouter.get("/routes", async (c) => {
  return c.json({
    ok: true,
    version: "3.0.0",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    endpoints: {
      core: [
        "/api/v1/health",
        "/api/v1/unified-data",
        "/api/v1/telemetry",
        "/api/v1/trip-status",
        "/api/v1/trip/status (alias)"
      ],
      components: [
        "/api/v1/component/overview",
        "/api/v1/component/current-status",
        "/api/v1/component/states-progress",
        "/api/v1/component/recent-drives"
      ],
      analytics: [
        "/api/v1/analytics/comprehensive",
        "/api/v1/analytics/efficiency",
        "/api/v1/analytics/charging"
      ],
      vehicle: [
        "/api/v1/vehicle/state/enhanced"
      ],
      ai: [
        "/api/v1/route/optimize",
        "/api/v1/journal/generate"
      ],
      admin: [
        "/api/v1/admin/status",
        "/api/v1/admin/cache/clear",
        "/api/v1/admin/cron/metrics"
      ]
    }
  });
});
var JOURNEY_SCHEMA = `
-- Tesla Journey Database Schema
-- Each journey gets an isolated database with this schema

PRAGMA foreign_keys = ON;

-- Vehicle information
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  display_name TEXT,
  model TEXT,
  year INTEGER,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Current vehicle state (single row, updated frequently)
CREATE TABLE IF NOT EXISTS vehicle_state (
  vehicle_id TEXT PRIMARY KEY,
  vin TEXT NOT NULL,
  battery_level INTEGER DEFAULT 0,
  battery_range REAL DEFAULT 0,
  charging_state TEXT DEFAULT 'Unknown',
  latitude REAL DEFAULT 0,
  longitude REAL DEFAULT 0,
  heading REAL DEFAULT 0,
  speed REAL DEFAULT 0,
  odometer REAL DEFAULT 0,
  inside_temp REAL,
  outside_temp REAL,
  shift_state TEXT,
  power INTEGER,
  locked BOOLEAN DEFAULT FALSE,
  climate_on BOOLEAN DEFAULT FALSE,
  car_version TEXT,
  timestamp DATETIME NOT NULL,
  state_name TEXT,
  city TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Historical vehicle state snapshots
CREATE TABLE IF NOT EXISTS vehicle_state_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id TEXT NOT NULL,
  battery_level INTEGER,
  latitude REAL,
  longitude REAL,
  speed REAL,
  odometer REAL,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Drive sessions
CREATE TABLE IF NOT EXISTS drives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tessie_id INTEGER UNIQUE,
  vehicle_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME NOT NULL,
  start_address TEXT,
  end_address TEXT,
  start_latitude REAL,
  start_longitude REAL,
  end_latitude REAL,
  end_longitude REAL,
  start_state TEXT,
  end_state TEXT,
  distance_miles REAL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  energy_used_kwh REAL DEFAULT 0,
  average_speed REAL DEFAULT 0,
  max_speed REAL DEFAULT 0,
  start_battery_level INTEGER,
  end_battery_level INTEGER,
  starting_range REAL,
  ending_range REAL,
  outside_temp_avg REAL,
  efficiency_miles_per_kwh REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- Charging sessions
CREATE TABLE IF NOT EXISTS charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tessie_id INTEGER UNIQUE,
  vehicle_id TEXT NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  location TEXT,
  latitude REAL,
  longitude REAL,
  state_name TEXT,
  city TEXT,
  charger_type TEXT,
  charger_power_kw REAL,
  energy_added_kwh REAL DEFAULT 0,
  start_battery_level INTEGER,
  end_battery_level INTEGER,
  start_range REAL,
  end_range REAL,
  miles_added INTEGER DEFAULT 0,
  cost_usd REAL,
  duration_minutes INTEGER DEFAULT 0,
  is_supercharger BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

-- States visited
CREATE TABLE IF NOT EXISTS states_visited (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  state_name TEXT NOT NULL UNIQUE,
  state_code TEXT,
  first_visited_at DATETIME,
  first_drive_id INTEGER,
  visit_count INTEGER DEFAULT 1,
  total_miles REAL DEFAULT 0,
  entry_latitude REAL,
  entry_longitude REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (first_drive_id) REFERENCES drives(id)
);

-- Media metadata (files stored in R2)
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  file_size INTEGER,
  r2_object_key TEXT UNIQUE NOT NULL,
  media_type TEXT, -- 'photo', 'video', 'audio', 'transcript'
  title TEXT,
  description TEXT,
  latitude REAL,
  longitude REAL,
  state_name TEXT,
  city TEXT,
  taken_at DATETIME,
  drive_id INTEGER,
  charge_id INTEGER,
  tags TEXT, -- JSON array
  transcription TEXT, -- For voice recordings
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (drive_id) REFERENCES drives(id),
  FOREIGN KEY (charge_id) REFERENCES charges(id)
);

-- Daily analytics
CREATE TABLE IF NOT EXISTS daily_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  total_drives INTEGER DEFAULT 0,
  total_distance_miles REAL DEFAULT 0,
  total_energy_used_kwh REAL DEFAULT 0,
  total_charges INTEGER DEFAULT 0,
  total_energy_added_kwh REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  efficiency_miles_per_kwh REAL,
  states_visited_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ingestion logs
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  errors TEXT,
  duration_ms INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_drives_dates ON drives(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_drives_states ON drives(start_state, end_state);
CREATE INDEX IF NOT EXISTS idx_charges_dates ON charges(started_at, ended_at);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_location ON media(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vehicle_state_history_time ON vehicle_state_history(timestamp DESC);
`;
var JourneyProvisioningService = class {
  static {
    __name(this, "JourneyProvisioningService");
  }
  env;
  accountId;
  apiToken;
  constructor(env) {
    this.env = env;
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID || "";
    this.apiToken = env.CLOUDFLARE_API_TOKEN || "";
  }
  /**
   * Check if provisioning is properly configured
   */
  isConfigured() {
    return !!(this.accountId && this.apiToken);
  }
  /**
   * Generate a safe database/bucket name from journey details
   */
  generateResourceName(journeyId, prefix) {
    const sanitized = journeyId.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").substring(0, 40);
    return `${prefix}-${sanitized}`;
  }
  /**
   * Create a new D1 database via Cloudflare API
   */
  async createD1Database(journeyId) {
    if (!this.isConfigured()) {
      logger.error("Provisioning not configured: missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN");
      return null;
    }
    const dbName = this.generateResourceName(journeyId, "journey-db");
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name: dbName })
        }
      );
      const data = await response.json();
      if (!data.success) {
        logger.error("Failed to create D1 database", { errors: data.errors, journeyId });
        return null;
      }
      const dbId = data.result.uuid;
      logger.info("Created D1 database", { dbId, dbName, journeyId });
      await this.applySchemaToDatabase(dbId);
      return { id: dbId, name: dbName };
    } catch (error) {
      logger.error("Error creating D1 database", { error, journeyId });
      return null;
    }
  }
  /**
   * Apply the journey schema to a database
   */
  async applySchemaToDatabase(databaseId) {
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${databaseId}/raw`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ sql: JOURNEY_SCHEMA })
        }
      );
      const data = await response.json();
      if (!data.success) {
        logger.error("Failed to apply schema to D1 database", { errors: data.errors, databaseId });
        return false;
      }
      logger.info("Applied schema to D1 database", { databaseId });
      return true;
    } catch (error) {
      logger.error("Error applying schema to D1 database", { error, databaseId });
      return false;
    }
  }
  /**
   * Create a new R2 bucket via Cloudflare API
   */
  async createR2Bucket(journeyId) {
    if (!this.isConfigured()) {
      logger.error("Provisioning not configured: missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN");
      return null;
    }
    const bucketName = this.generateResourceName(journeyId, "journey-media");
    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name: bucketName })
        }
      );
      const data = await response.json();
      if (!data.success) {
        const alreadyExists = data.errors?.some(
          (e) => e.message?.includes("already exists") || e.code === 10004
        );
        if (alreadyExists) {
          logger.info("R2 bucket already exists", { bucketName, journeyId });
          return bucketName;
        }
        logger.error("Failed to create R2 bucket", { errors: data.errors, journeyId });
        return null;
      }
      logger.info("Created R2 bucket", { bucketName, journeyId });
      return bucketName;
    } catch (error) {
      logger.error("Error creating R2 bucket", { error, journeyId });
      return null;
    }
  }
  /**
   * Register a new journey in the platform registry
   */
  async registerJourney(userId, name, options = {}) {
    const journeyId = `journey-${crypto.randomUUID()}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await this.env.TESLA_DB.prepare(`
        INSERT INTO journey_registry (
          id, user_id, name, description, vehicle_vin, tessie_api_key,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        journeyId,
        userId,
        name,
        options.description || null,
        options.vehicleVin || null,
        options.tessieApiKey || null,
        now,
        now
      ).run();
      return {
        id: journeyId,
        user_id: userId,
        name,
        description: options.description,
        vehicle_vin: options.vehicleVin,
        tessie_api_key: options.tessieApiKey,
        status: "pending",
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      logger.error("Failed to register journey", { error, userId, name });
      return null;
    }
  }
  /**
   * Provision resources for a journey (D1 + R2)
   */
  async provisionJourney(journeyId) {
    const errors = [];
    let d1Result = null;
    let r2BucketName = null;
    await this.updateJourneyStatus(journeyId, "provisioning");
    d1Result = await this.createD1Database(journeyId);
    if (!d1Result) {
      errors.push("Failed to create D1 database");
    }
    r2BucketName = await this.createR2Bucket(journeyId);
    if (!r2BucketName) {
      errors.push("Failed to create R2 bucket");
    }
    if (d1Result || r2BucketName) {
      await this.env.TESLA_DB.prepare(`
        UPDATE journey_registry 
        SET d1_database_id = ?,
            d1_database_name = ?,
            r2_bucket_name = ?,
            status = ?,
            updated_at = ?
        WHERE id = ?
      `).bind(
        d1Result?.id || null,
        d1Result?.name || null,
        r2BucketName,
        errors.length === 0 ? "active" : "pending",
        (/* @__PURE__ */ new Date()).toISOString(),
        journeyId
      ).run();
    }
    const success = errors.length === 0;
    if (success) {
      await this.updateJourneyStatus(journeyId, "active");
    }
    return {
      success,
      journey_id: journeyId,
      d1_database_id: d1Result?.id,
      d1_database_name: d1Result?.name,
      r2_bucket_name: r2BucketName || void 0,
      errors
    };
  }
  /**
   * Update journey status
   */
  async updateJourneyStatus(journeyId, status) {
    await this.env.TESLA_DB.prepare(`
      UPDATE journey_registry SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, (/* @__PURE__ */ new Date()).toISOString(), journeyId).run();
  }
  /**
   * Get journey by ID
   */
  async getJourney(journeyId) {
    const result = await this.env.TESLA_DB.prepare(`
      SELECT * FROM journey_registry WHERE id = ?
    `).bind(journeyId).first();
    return result;
  }
  /**
   * List all journeys for a user
   */
  async listUserJourneys(userId) {
    const result = await this.env.TESLA_DB.prepare(`
      SELECT * FROM journey_registry WHERE user_id = ? ORDER BY created_at DESC
    `).bind(userId).all();
    return result.results || [];
  }
  /**
   * Delete journey and its resources
   */
  async deleteJourney(journeyId) {
    const journey = await this.getJourney(journeyId);
    if (!journey) return false;
    const errors = [];
    if (journey.d1_database_id) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${journey.d1_database_id}`,
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${this.apiToken}`
            }
          }
        );
        const data = await response.json();
        if (!data.success) {
          errors.push(`Failed to delete D1: ${JSON.stringify(data.errors)}`);
        }
      } catch (error) {
        errors.push(`Error deleting D1: ${error}`);
      }
    }
    if (journey.r2_bucket_name) {
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/r2/buckets/${journey.r2_bucket_name}`,
          {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${this.apiToken}`
            }
          }
        );
        const data = await response.json();
        if (!data.success) {
          logger.warn("Failed to delete R2 bucket (may not be empty)", {
            bucket: journey.r2_bucket_name,
            errors: data.errors
          });
        }
      } catch (error) {
        errors.push(`Error deleting R2: ${error}`);
      }
    }
    await this.updateJourneyStatus(journeyId, "deleted");
    return errors.length === 0;
  }
};
async function requireUser(c, next) {
  const jwtCur = String(c.env?.JWT_SECRET || "").trim();
  const jwtPrev = String(c.env?.JWT_SECRET_PREVIOUS || "").trim();
  const secrets = [jwtCur, jwtPrev].filter(Boolean);
  if (!secrets.length) return c.json({ ok: false, error: "Auth not configured" }, 500);
  const authz = c.req.header("Authorization") || "";
  if (!authz.startsWith("Bearer ")) return c.json({ ok: false, error: "Missing bearer token" }, 401);
  const token = authz.slice(7).trim();
  const verified = await verifyJwtHS256(token, secrets);
  if (!verified.ok) return c.json({ ok: false, error: "Invalid token" }, 401);
  const p = verified.payload || {};
  const id = String(p.sub || "").trim();
  if (!id) return c.json({ ok: false, error: "Invalid token payload" }, 401);
  c.set("user", {
    id,
    email: typeof p.email === "string" ? p.email : void 0,
    admin: p.admin === true || p.role === "admin",
    mfa: p.mfa === true,
    role: typeof p.role === "string" ? p.role : void 0
  });
  await next();
}
__name(requireUser, "requireUser");
var journeysRouter = new Hono2();
var createJourneySchema = external_exports.object({
  name: external_exports.string().min(3).max(100),
  description: external_exports.string().max(500).optional(),
  vehicle_vin: external_exports.string().length(17).optional(),
  tessie_api_key: external_exports.string().min(10).optional(),
  start_date: external_exports.string().optional(),
  // ISO date
  target_states: external_exports.number().min(1).max(50).default(48)
});
var updateJourneySchema = external_exports.object({
  name: external_exports.string().min(3).max(100).optional(),
  description: external_exports.string().max(500).optional(),
  vehicle_vin: external_exports.string().length(17).optional(),
  tessie_api_key: external_exports.string().min(10).optional()
});
journeysRouter.get("/", async (c) => {
  const userId = c.req.query("user_id") || "default-user";
  const provisioner = new JourneyProvisioningService(c.env);
  const journeys = await provisioner.listUserJourneys(userId);
  return c.json({
    success: true,
    journeys,
    count: journeys.length
  });
});
var followPrefsSchema = external_exports.object({
  notify_waypoints: external_exports.boolean().optional(),
  notify_state_crossings: external_exports.boolean().optional(),
  notify_photos: external_exports.boolean().optional(),
  notify_charging: external_exports.boolean().optional(),
  notify_security: external_exports.boolean().optional()
});
journeysRouter.post("/:id/follow", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  const journeyId = c.req.param("id");
  const journey = await db.prepare(`SELECT id FROM journey_registry WHERE id = ? AND status != 'deleted'`).bind(journeyId).first();
  if (!journey?.id) return c.json({ ok: false, error: "Journey not found" }, 404);
  const followId = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO journey_follows (id, journey_id, user_id, created_at, unfollowed_at)
       VALUES (?, ?, ?, datetime('now'), NULL)
       ON CONFLICT(journey_id, user_id) DO UPDATE SET unfollowed_at=NULL`
  ).bind(followId, journeyId, user.id).run();
  await db.prepare(
    `INSERT INTO journey_follow_notification_prefs
        (journey_id, user_id, notify_waypoints, notify_state_crossings, notify_photos, notify_charging, notify_security, created_at, updated_at)
       VALUES (?, ?, 1, 1, 1, 0, 1, datetime('now'), datetime('now'))
       ON CONFLICT(journey_id, user_id) DO NOTHING`
  ).bind(journeyId, user.id).run();
  return c.json({ ok: true, following: true });
});
journeysRouter.post("/:id/unfollow", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  const journeyId = c.req.param("id");
  await db.prepare(`UPDATE journey_follows SET unfollowed_at = datetime('now') WHERE journey_id = ? AND user_id = ?`).bind(journeyId, user.id).run();
  return c.json({ ok: true, following: false });
});
journeysRouter.get("/:id/follow/settings", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  const journeyId = c.req.param("id");
  const follow = await db.prepare(`SELECT unfollowed_at FROM journey_follows WHERE journey_id = ? AND user_id = ? LIMIT 1`).bind(journeyId, user.id).first();
  const following = !!follow && !follow.unfollowed_at;
  const prefs = await db.prepare(
    `SELECT notify_waypoints, notify_state_crossings, notify_photos, notify_charging, notify_security
       FROM journey_follow_notification_prefs
       WHERE journey_id = ? AND user_id = ? LIMIT 1`
  ).bind(journeyId, user.id).first();
  return c.json({
    ok: true,
    following,
    prefs: prefs || {
      notify_waypoints: 1,
      notify_state_crossings: 1,
      notify_photos: 1,
      notify_charging: 0,
      notify_security: 1
    }
  });
});
journeysRouter.put("/:id/follow/settings", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  const journeyId = c.req.param("id");
  let body;
  try {
    body = followPrefsSchema.parse(await c.req.json());
  } catch (e) {
    return c.json({ ok: false, error: "Validation failed", issues: e?.issues }, 400);
  }
  const existing = await db.prepare(
    `SELECT notify_waypoints, notify_state_crossings, notify_photos, notify_charging, notify_security
       FROM journey_follow_notification_prefs
       WHERE journey_id = ? AND user_id = ? LIMIT 1`
  ).bind(journeyId, user.id).first();
  const merged = {
    notify_waypoints: body.notify_waypoints ?? (existing ? !!existing.notify_waypoints : true),
    notify_state_crossings: body.notify_state_crossings ?? (existing ? !!existing.notify_state_crossings : true),
    notify_photos: body.notify_photos ?? (existing ? !!existing.notify_photos : true),
    notify_charging: body.notify_charging ?? (existing ? !!existing.notify_charging : false),
    notify_security: body.notify_security ?? (existing ? !!existing.notify_security : true)
  };
  await db.prepare(
    `INSERT INTO journey_follow_notification_prefs
        (journey_id, user_id, notify_waypoints, notify_state_crossings, notify_photos, notify_charging, notify_security, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(journey_id, user_id) DO UPDATE SET
         notify_waypoints=excluded.notify_waypoints,
         notify_state_crossings=excluded.notify_state_crossings,
         notify_photos=excluded.notify_photos,
         notify_charging=excluded.notify_charging,
         notify_security=excluded.notify_security,
         updated_at=datetime('now')`
  ).bind(
    journeyId,
    user.id,
    merged.notify_waypoints ? 1 : 0,
    merged.notify_state_crossings ? 1 : 0,
    merged.notify_photos ? 1 : 0,
    merged.notify_charging ? 1 : 0,
    merged.notify_security ? 1 : 0
  ).run();
  return c.json({ ok: true, prefs: merged });
});
journeysRouter.get("/:id", async (c) => {
  const journeyId = c.req.param("id");
  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);
  if (!journey) {
    return c.json({ success: false, error: "Journey not found" }, 404);
  }
  const sanitized = {
    ...journey,
    tessie_api_key: journey.tessie_api_key ? "***" + journey.tessie_api_key.slice(-4) : null
  };
  return c.json({
    success: true,
    journey: sanitized
  });
});
journeysRouter.post("/", async (c) => {
  let body;
  try {
    const json = await c.req.json();
    const result = createJourneySchema.safeParse(json);
    if (!result.success) {
      return c.json({
        success: false,
        error: "Validation failed",
        issues: result.error.issues
      }, 400);
    }
    body = result.data;
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const provisioner = new JourneyProvisioningService(c.env);
  if (!provisioner.isConfigured()) {
    return c.json({
      success: false,
      error: "Resource provisioning not configured. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN secrets.",
      code: "PROVISIONING_NOT_CONFIGURED"
    }, 503);
  }
  const userId = c.req.query("user_id") || "default-user";
  const journey = await provisioner.registerJourney(userId, body.name, {
    description: body.description,
    vehicleVin: body.vehicle_vin,
    tessieApiKey: body.tessie_api_key
  });
  if (!journey) {
    return c.json({
      success: false,
      error: "Failed to register journey"
    }, 500);
  }
  const provisionResult = await provisioner.provisionJourney(journey.id);
  await logAuditEvent(c.env.TESLA_DB, {
    user_id: userId,
    journey_id: journey.id,
    action: "create_journey",
    details: JSON.stringify({
      name: body.name,
      provisioning_success: provisionResult.success,
      d1_created: !!provisionResult.d1_database_id,
      r2_created: !!provisionResult.r2_bucket_name
    })
  });
  if (!provisionResult.success) {
    return c.json({
      success: false,
      error: "Journey created but resource provisioning failed",
      journey_id: journey.id,
      provisioning_errors: provisionResult.errors
    }, 207);
  }
  return c.json({
    success: true,
    journey: {
      id: journey.id,
      name: journey.name,
      status: "active",
      resources: {
        d1_database_id: provisionResult.d1_database_id,
        d1_database_name: provisionResult.d1_database_name,
        r2_bucket_name: provisionResult.r2_bucket_name
      }
    },
    message: "Journey created and resources provisioned successfully"
  }, 201);
});
journeysRouter.patch("/:id", async (c) => {
  const journeyId = c.req.param("id");
  let body;
  try {
    const json = await c.req.json();
    const result = updateJourneySchema.safeParse(json);
    if (!result.success) {
      return c.json({
        success: false,
        error: "Validation failed",
        issues: result.error.issues
      }, 400);
    }
    body = result.data;
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);
  if (!journey) {
    return c.json({ success: false, error: "Journey not found" }, 404);
  }
  const updates = [];
  const values = [];
  if (body.name) {
    updates.push("name = ?");
    values.push(body.name);
  }
  if (body.description !== void 0) {
    updates.push("description = ?");
    values.push(body.description);
  }
  if (body.vehicle_vin) {
    updates.push("vehicle_vin = ?");
    values.push(body.vehicle_vin);
  }
  if (body.tessie_api_key) {
    updates.push("tessie_api_key = ?");
    values.push(body.tessie_api_key);
  }
  if (updates.length === 0) {
    return c.json({ success: false, error: "No fields to update" }, 400);
  }
  updates.push("updated_at = ?");
  values.push((/* @__PURE__ */ new Date()).toISOString());
  values.push(journeyId);
  await c.env.TESLA_DB.prepare(`
    UPDATE journey_registry SET ${updates.join(", ")} WHERE id = ?
  `).bind(...values).run();
  return c.json({
    success: true,
    message: "Journey updated"
  });
});
journeysRouter.delete("/:id", async (c) => {
  const journeyId = c.req.param("id");
  const forceDelete = c.req.query("force") === "true";
  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);
  if (!journey) {
    return c.json({ success: false, error: "Journey not found" }, 404);
  }
  if (journey.status === "deleted") {
    return c.json({ success: false, error: "Journey already deleted" }, 410);
  }
  if (journey.status === "active" && !forceDelete) {
    return c.json({
      success: false,
      error: "Journey is active. Use ?force=true to delete.",
      code: "ACTIVE_JOURNEY"
    }, 400);
  }
  const deleted = await provisioner.deleteJourney(journeyId);
  await logAuditEvent(c.env.TESLA_DB, {
    user_id: journey.user_id,
    journey_id: journeyId,
    action: "delete_journey",
    details: JSON.stringify({ force: forceDelete, success: deleted })
  });
  return c.json({
    success: deleted,
    message: deleted ? "Journey and resources deleted" : "Journey marked as deleted but some resources may remain"
  });
});
journeysRouter.post("/:id/provision", async (c) => {
  const journeyId = c.req.param("id");
  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);
  if (!journey) {
    return c.json({ success: false, error: "Journey not found" }, 404);
  }
  if (journey.status === "active") {
    return c.json({
      success: false,
      error: "Journey already provisioned",
      resources: {
        d1_database_id: journey.d1_database_id,
        r2_bucket_name: journey.r2_bucket_name
      }
    }, 400);
  }
  const result = await provisioner.provisionJourney(journeyId);
  return c.json({
    success: result.success,
    journey_id: journeyId,
    resources: {
      d1_database_id: result.d1_database_id,
      d1_database_name: result.d1_database_name,
      r2_bucket_name: result.r2_bucket_name
    },
    errors: result.errors.length > 0 ? result.errors : void 0
  });
});
journeysRouter.get("/:id/status", async (c) => {
  const journeyId = c.req.param("id");
  const provisioner = new JourneyProvisioningService(c.env);
  const journey = await provisioner.getJourney(journeyId);
  if (!journey) {
    return c.json({ success: false, error: "Journey not found" }, 404);
  }
  return c.json({
    success: true,
    journey_id: journeyId,
    status: journey.status,
    resources: {
      d1_configured: !!journey.d1_database_id,
      d1_database_name: journey.d1_database_name,
      r2_configured: !!journey.r2_bucket_name,
      r2_bucket_name: journey.r2_bucket_name
    },
    tessie_configured: !!journey.tessie_api_key,
    created_at: journey.created_at,
    updated_at: journey.updated_at
  });
});
async function logAuditEvent(db, event) {
  try {
    await db.prepare(`
      INSERT INTO platform_audit_log (user_id, journey_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      event.user_id || null,
      event.journey_id || null,
      event.action,
      event.details || null,
      event.ip_address || null,
      event.user_agent || null
    ).run();
  } catch (error) {
    logger.warn("Failed to log audit event", { error, action: event.action });
  }
}
__name(logAuditEvent, "logAuditEvent");
var DEFAULT_CONFIGS = [
  { provider: "serper", monthlyLimit: 2500, resetDay: 1 },
  { provider: "brave", monthlyLimit: 2e3, dailyLimit: 100, resetDay: 1 },
  { provider: "tavily", monthlyLimit: 1e3, resetDay: 1 },
  { provider: "nominatim", dailyLimit: 1e3, minuteLimit: 1, monthlyLimit: 3e4 },
  // OSM rate limits
  { provider: "cloudflare_ai", monthlyLimit: 1e4, resetDay: 1 }
  // Workers AI has generous limits
];
var ApiRateLimitTracker = class {
  static {
    __name(this, "ApiRateLimitTracker");
  }
  db;
  configs;
  // In-memory cache for hot path (minute-level tracking)
  minuteCache = /* @__PURE__ */ new Map();
  constructor(db, customConfigs) {
    this.db = db;
    this.configs = /* @__PURE__ */ new Map();
    for (const config of DEFAULT_CONFIGS) {
      this.configs.set(config.provider, config);
    }
    if (customConfigs) {
      for (const config of customConfigs) {
        this.configs.set(config.provider, config);
      }
    }
  }
  /**
   * Record an API request (call after each API call)
   */
  async recordRequest(provider, success, latencyMs, errorCode) {
    const now = /* @__PURE__ */ new Date();
    this.updateMinuteCache(provider);
    try {
      await this.db.prepare(`
        INSERT INTO api_rate_limits (
          provider, request_date, request_hour, request_minute,
          success_count, error_count, total_latency_ms, last_error_code, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(provider, request_date, request_hour, request_minute) DO UPDATE SET
          success_count = success_count + ?,
          error_count = error_count + ?,
          total_latency_ms = total_latency_ms + ?,
          last_error_code = COALESCE(?, last_error_code),
          updated_at = ?
      `).bind(
        provider,
        now.toISOString().split("T")[0],
        // YYYY-MM-DD
        now.getUTCHours(),
        now.getUTCMinutes(),
        success ? 1 : 0,
        success ? 0 : 1,
        latencyMs,
        errorCode || null,
        now.toISOString(),
        // ON CONFLICT values
        success ? 1 : 0,
        success ? 0 : 1,
        latencyMs,
        errorCode || null,
        now.toISOString()
      ).run();
    } catch (error) {
      logger.warn("Failed to record API request", { error, provider });
    }
  }
  /**
   * Check if a provider is available (not rate limited)
   */
  async isProviderAvailable(provider) {
    const status = await this.getProviderStatus(provider);
    return status.isAvailable;
  }
  /**
   * Get detailed status for a provider
   */
  async getProviderStatus(provider) {
    const config = this.configs.get(provider) || {
      provider,
      monthlyLimit: 1e3,
      resetDay: 1
    };
    const now = /* @__PURE__ */ new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const currentDate = now.toISOString().split("T")[0];
    const monthlyResult = await this.db.prepare(`
      SELECT COALESCE(SUM(success_count + error_count), 0) as total
      FROM api_rate_limits
      WHERE provider = ? AND request_date LIKE ?
    `).bind(provider, `${currentMonth}%`).first();
    const monthlyUsed = monthlyResult?.total || 0;
    const dailyResult = await this.db.prepare(`
      SELECT COALESCE(SUM(success_count + error_count), 0) as total
      FROM api_rate_limits
      WHERE provider = ? AND request_date = ?
    `).bind(provider, currentDate).first();
    const dailyUsed = dailyResult?.total || 0;
    const minuteUsed = this.getMinuteUsage(provider);
    const lastRequest = await this.db.prepare(`
      SELECT MAX(updated_at) as last_at
      FROM api_rate_limits
      WHERE provider = ?
    `).bind(provider).first();
    const nextReset = this.calculateNextReset(config);
    const monthlyRemaining = config.monthlyLimit - monthlyUsed;
    const dailyRemaining = config.dailyLimit ? config.dailyLimit - dailyUsed : null;
    const minuteRemaining = config.minuteLimit ? config.minuteLimit - minuteUsed : null;
    const isAvailable = monthlyRemaining > 0 && (dailyRemaining === null || dailyRemaining > 0) && (minuteRemaining === null || minuteRemaining > 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const avgDailyUsage = monthlyUsed / dayOfMonth;
    const estimatedDaysRemaining = avgDailyUsage > 0 ? Math.floor(monthlyRemaining / avgDailyUsage) : null;
    return {
      provider,
      isAvailable,
      monthlyUsed,
      monthlyLimit: config.monthlyLimit,
      monthlyRemaining,
      dailyUsed,
      dailyLimit: config.dailyLimit || null,
      dailyRemaining,
      minuteUsed,
      minuteLimit: config.minuteLimit || null,
      lastRequestAt: lastRequest?.last_at || null,
      nextResetAt: nextReset.toISOString(),
      percentUsed: Math.round(monthlyUsed / config.monthlyLimit * 100),
      estimatedDaysRemaining
    };
  }
  /**
   * Get status for all configured providers
   */
  async getAllProviderStatuses() {
    const statuses = [];
    for (const provider of this.configs.keys()) {
      statuses.push(await this.getProviderStatus(provider));
    }
    return statuses.sort((a, b) => a.percentUsed - b.percentUsed);
  }
  /**
   * Get the best available provider (most remaining quota)
   */
  async getBestAvailableProvider(preferredOrder) {
    const statuses = await this.getAllProviderStatuses();
    const available = statuses.filter((s) => s.isAvailable);
    if (available.length === 0) return null;
    if (preferredOrder) {
      for (const provider of preferredOrder) {
        const status = available.find((s) => s.provider === provider);
        if (status) return status.provider;
      }
    }
    return available.sort((a, b) => b.monthlyRemaining - a.monthlyRemaining)[0].provider;
  }
  /**
   * Get usage analytics for a time period
   */
  async getUsageAnalytics(days = 30) {
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];
    const byProviderResult = await this.db.prepare(`
      SELECT 
        provider,
        SUM(success_count) as success,
        SUM(error_count) as errors,
        SUM(success_count + error_count) as total,
        AVG(total_latency_ms / NULLIF(success_count + error_count, 0)) as avg_latency
      FROM api_rate_limits
      WHERE request_date >= ?
      GROUP BY provider
    `).bind(startDateStr).all();
    const byDayResult = await this.db.prepare(`
      SELECT 
        request_date as date,
        SUM(success_count + error_count) as total
      FROM api_rate_limits
      WHERE request_date >= ?
      GROUP BY request_date
      ORDER BY request_date
    `).bind(startDateStr).all();
    const byProvider = {};
    let totalRequests = 0;
    let totalSuccess = 0;
    for (const row of byProviderResult.results || []) {
      byProvider[row.provider] = {
        total: row.total,
        success: row.success,
        errors: row.errors,
        avgLatency: Math.round(row.avg_latency || 0)
      };
      totalRequests += row.total;
      totalSuccess += row.success;
    }
    return {
      byProvider,
      byDay: byDayResult.results || [],
      totalRequests,
      successRate: totalRequests > 0 ? Math.round(totalSuccess / totalRequests * 100) : 100
    };
  }
  /**
   * Predict when quota will be exhausted at current rate
   */
  async predictQuotaExhaustion(provider) {
    const status = await this.getProviderStatus(provider);
    if (status.estimatedDaysRemaining === null) {
      return {
        willExhaust: false,
        exhaustionDate: null,
        daysUntilExhaustion: null,
        recommendation: "Not enough data to predict"
      };
    }
    const now = /* @__PURE__ */ new Date();
    const resetDate = new Date(status.nextResetAt);
    const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1e3 * 60 * 60 * 24));
    const willExhaust = status.estimatedDaysRemaining < daysUntilReset;
    let exhaustionDate = null;
    if (willExhaust && status.estimatedDaysRemaining > 0) {
      const exhaustDate = /* @__PURE__ */ new Date();
      exhaustDate.setDate(exhaustDate.getDate() + status.estimatedDaysRemaining);
      exhaustionDate = exhaustDate.toISOString().split("T")[0];
    }
    let recommendation = "Usage is sustainable";
    if (willExhaust) {
      if (status.percentUsed > 80) {
        recommendation = "Consider adding additional search providers";
      } else {
        recommendation = "Monitor usage - may need to reduce search frequency";
      }
    }
    return {
      willExhaust,
      exhaustionDate,
      daysUntilExhaustion: status.estimatedDaysRemaining,
      recommendation
    };
  }
  // Private helpers
  updateMinuteCache(provider) {
    const now = Date.now();
    const windowStart = Math.floor(now / 6e4) * 6e4;
    const cached = this.minuteCache.get(provider);
    if (cached && cached.windowStart === windowStart) {
      cached.count++;
    } else {
      this.minuteCache.set(provider, { count: 1, windowStart });
    }
  }
  getMinuteUsage(provider) {
    const now = Date.now();
    const windowStart = Math.floor(now / 6e4) * 6e4;
    const cached = this.minuteCache.get(provider);
    if (cached && cached.windowStart === windowStart) {
      return cached.count;
    }
    return 0;
  }
  calculateNextReset(config) {
    const now = /* @__PURE__ */ new Date();
    const resetDay = config.resetDay || 1;
    const resetHour = config.resetHour || 0;
    let nextReset = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      resetDay,
      resetHour,
      0,
      0
    ));
    if (now >= nextReset) {
      nextReset = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() + 1,
        resetDay,
        resetHour,
        0,
        0
      ));
    }
    return nextReset;
  }
};
var placeCache = /* @__PURE__ */ new Map();
var DynamicPlaceIntelligence = class {
  static {
    __name(this, "DynamicPlaceIntelligence");
  }
  env;
  rateLimitTracker = null;
  constructor(env) {
    this.env = env;
    if (env.TESLA_DB) {
      this.rateLimitTracker = new ApiRateLimitTracker(env.TESLA_DB);
    }
  }
  /**
   * Get the rate limit tracker for external access
   */
  getRateLimitTracker() {
    return this.rateLimitTracker;
  }
  /**
   * Main entry point: Analyze a stop location
   */
  async analyzeStop(lat, lng, durationMinutes, arrivedAt, departedAt) {
    const place = await this.identifyPlace(lat, lng);
    const activity = await this.inferActivity(place, durationMinutes, arrivedAt, departedAt);
    const isOvernight = this.isOvernightStay(arrivedAt, departedAt);
    const isLikelyHome = await this.checkIfHome(lat, lng);
    const isLikelyWork = await this.checkIfWork(lat, lng, arrivedAt);
    return {
      place,
      inferred_activity: activity,
      is_overnight: isOvernight,
      is_likely_home: isLikelyHome,
      is_likely_work: isLikelyWork
    };
  }
  /**
   * Step 1: Identify the place at given coordinates
   */
  async identifyPlace(lat, lng) {
    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (placeCache.has(cacheKey)) {
      return placeCache.get(cacheKey);
    }
    let place = await this.reverseGeocode(lat, lng);
    if (place.name && !place.place_type) {
      place = await this.enrichWithSearch(place);
    }
    if (!place.place_type && this.env.AI) {
      place = await this.classifyWithAI(place);
    }
    placeCache.set(cacheKey, place);
    return place;
  }
  /**
   * Reverse geocode using OpenStreetMap Nominatim
   * Rate limit aware: OSM has strict limits (1 req/sec, 1000/day)
   */
  async reverseGeocode(lat, lng) {
    if (this.rateLimitTracker) {
      const isAvailable = await this.rateLimitTracker.isProviderAvailable("nominatim");
      if (!isAvailable) {
        logger.warn("Nominatim rate limited, returning empty place");
        return this.createEmptyPlace(lat, lng);
      }
    }
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&extratags=1&namedetails=1&zoom=18`;
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "AWhittleWandering-Tesla-Tracker/1.0"
        }
      });
      const latencyMs = Date.now() - startTime;
      if (!response.ok) {
        if (this.rateLimitTracker) {
          await this.rateLimitTracker.recordRequest("nominatim", false, latencyMs, response.status.toString());
        }
        throw new Error(`Geocode failed: ${response.status}`);
      }
      if (this.rateLimitTracker) {
        await this.rateLimitTracker.recordRequest("nominatim", true, latencyMs);
      }
      const data = await response.json();
      const address = data.address || {};
      const extratags = data.extratags || {};
      let placeType = null;
      let placeDescription = null;
      if (data.type && data.class) {
        placeType = `${data.class}:${data.type}`;
      }
      if (extratags.description) {
        placeDescription = extratags.description;
      }
      if (extratags.cuisine) {
        placeDescription = `${extratags.cuisine} restaurant`;
        placeType = "restaurant";
      }
      if (extratags.sport === "golf") {
        placeType = "golf_course";
      }
      return {
        latitude: lat,
        longitude: lng,
        name: data.name || address.amenity || address.shop || address.leisure || null,
        address: this.formatAddress(address),
        city: address.city || address.town || address.village || null,
        state: address.state || null,
        country: address.country || null,
        place_type: placeType,
        place_description: placeDescription,
        business_hours: extratags.opening_hours || null,
        raw_geocode: data,
        confidence: data.name ? 0.7 : 0.4,
        source: "geocode"
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      if (this.rateLimitTracker) {
        await this.rateLimitTracker.recordRequest("nominatim", false, latencyMs, "ERROR");
      }
      logger.warn("Reverse geocode failed", { error, lat, lng });
      return this.createEmptyPlace(lat, lng);
    }
  }
  /**
   * Enrich place info with web search using fallback chain:
   * Serper (2,500/mo) → Brave (2,000/mo) → Tavily (1,000/mo) → AI
   * 
   * Rate limit aware: skips providers at capacity to reduce latency
   */
  async enrichWithSearch(place) {
    if (!place.name) return place;
    const searchQuery = [
      place.name,
      place.city,
      place.state,
      "what is"
    ].filter(Boolean).join(" ");
    const providers = [
      { name: "serper", fn: /* @__PURE__ */ __name(() => this.searchWithSerper(searchQuery), "fn"), key: this.env.SERPER_API_KEY },
      { name: "brave", fn: /* @__PURE__ */ __name(() => this.searchWithBrave(searchQuery), "fn"), key: this.env.BRAVE_API_KEY },
      { name: "tavily", fn: /* @__PURE__ */ __name(() => this.searchWithTavily(searchQuery), "fn"), key: this.env.TAVILY_API_KEY }
    ];
    try {
      for (const provider of providers) {
        if (!provider.key) continue;
        if (this.rateLimitTracker) {
          const isAvailable = await this.rateLimitTracker.isProviderAvailable(provider.name);
          if (!isAvailable) {
            logger.info(`Skipping ${provider.name} - at rate limit capacity`);
            continue;
          }
        }
        const startTime = Date.now();
        try {
          const searchResult = await provider.fn();
          const latencyMs = Date.now() - startTime;
          if (this.rateLimitTracker) {
            await this.rateLimitTracker.recordRequest(provider.name, true, latencyMs);
          }
          if (searchResult) {
            logger.info(`Place search succeeded with ${provider.name}`, {
              place: place.name,
              latencyMs
            });
            return {
              ...place,
              place_type: searchResult.type || place.place_type,
              place_description: searchResult.description || place.place_description,
              business_hours: searchResult.hours || place.business_hours,
              raw_search: { ...searchResult.raw, provider: searchResult.provider },
              confidence: 0.85,
              source: "search"
            };
          }
        } catch (providerError) {
          const latencyMs = Date.now() - startTime;
          const errorCode = providerError?.status?.toString() || "ERROR";
          if (this.rateLimitTracker) {
            await this.rateLimitTracker.recordRequest(provider.name, false, latencyMs, errorCode);
          }
          logger.warn(`${provider.name} search failed, trying next provider`, {
            error: providerError,
            latencyMs,
            errorCode
          });
          continue;
        }
      }
      if (this.env.AI) {
        const startTime = Date.now();
        try {
          const aiResult = await this.searchWithAI(searchQuery, place);
          const latencyMs = Date.now() - startTime;
          if (this.rateLimitTracker) {
            await this.rateLimitTracker.recordRequest("cloudflare_ai", true, latencyMs);
          }
          if (aiResult) {
            return {
              ...place,
              ...aiResult,
              confidence: 0.8,
              source: "ai"
            };
          }
        } catch (aiError) {
          const latencyMs = Date.now() - startTime;
          if (this.rateLimitTracker) {
            await this.rateLimitTracker.recordRequest("cloudflare_ai", false, latencyMs, "AI_ERROR");
          }
        }
      }
    } catch (error) {
      logger.warn("Place search failed", { error, name: place.name });
    }
    return place;
  }
  /**
   * Search using Serper API (Google Search)
   * Free tier: 2,500 queries/month
   * Docs: https://serper.dev/
   */
  async searchWithSerper(query) {
    if (!this.env.SERPER_API_KEY) return null;
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": this.env.SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: query,
        num: 3
      })
    });
    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status}`);
    }
    const data = await response.json();
    const kg = data.knowledgeGraph;
    if (kg) {
      return {
        type: kg.type || null,
        description: kg.description || null,
        hours: kg.hours || null,
        raw: data,
        provider: "serper"
      };
    }
    const organic = data.organic?.[0];
    if (organic) {
      return {
        type: null,
        description: organic.snippet || null,
        hours: null,
        raw: data,
        provider: "serper"
      };
    }
    return null;
  }
  /**
   * Search using Brave Search API
   * Free tier: 2,000 queries/month
   * Docs: https://brave.com/search/api/
   */
  async searchWithBrave(query) {
    if (!this.env.BRAVE_API_KEY) return null;
    const params = new URLSearchParams({
      q: query,
      count: "5",
      result_filter: "web"
    });
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": this.env.BRAVE_API_KEY
      }
    });
    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }
    const data = await response.json();
    const infobox = data.infobox;
    if (infobox) {
      return {
        type: infobox.type || infobox.subtype || null,
        description: infobox.description || null,
        hours: null,
        raw: data,
        provider: "brave"
      };
    }
    const webResult = data.web?.results?.[0];
    if (webResult) {
      return {
        type: null,
        description: webResult.description || null,
        hours: null,
        raw: data,
        provider: "brave"
      };
    }
    return null;
  }
  /**
   * Search using Tavily API (AI-optimized search)
   * Free tier: 1,000 queries/month
   * Docs: https://tavily.com/
   */
  async searchWithTavily(query) {
    if (!this.env.TAVILY_API_KEY) return null;
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: this.env.TAVILY_API_KEY,
        query,
        search_depth: "basic",
        include_answer: true,
        max_results: 3
      })
    });
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }
    const data = await response.json();
    if (data.answer) {
      const typeMatch = data.answer.match(/\b(golf course|restaurant|hotel|cafe|bar|museum|park|hospital|airport|stadium|gym|spa|salon|mall|store|shop|dealership|garage|mechanic|bank|pharmacy|school|church|theater|cinema)\b/i);
      return {
        type: typeMatch ? typeMatch[1].toLowerCase().replace(/\s+/g, "_") : null,
        description: data.answer,
        hours: null,
        raw: data,
        provider: "tavily"
      };
    }
    const result = data.results?.[0];
    if (result) {
      return {
        type: null,
        description: result.content || null,
        hours: null,
        raw: data,
        provider: "tavily"
      };
    }
    return null;
  }
  /**
   * Use Cloudflare AI to search and understand a place
   */
  async searchWithAI(query, place) {
    if (!this.env.AI) return null;
    try {
      const prompt = `You are analyzing a location. Given the following information, determine what type of place this is and what activities typically happen there.

Place name: ${place.name}
Address: ${place.address || "Unknown"}
City: ${place.city || "Unknown"}
State: ${place.state || "Unknown"}
Raw geocode type: ${place.place_type || "Unknown"}

Respond in JSON format:
{
  "place_type": "short_identifier like 'golf_course', 'steakhouse', 'car_dealership'",
  "place_description": "brief description of what this place is",
  "typical_activities": ["list", "of", "activities"],
  "typical_duration_minutes": {"min": 30, "max": 120}
}`;
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300
      });
      const text = response.response || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          place_type: parsed.place_type,
          place_description: parsed.place_description
        };
      }
    } catch (error) {
      logger.warn("AI place classification failed", { error });
    }
    return null;
  }
  /**
   * Classify place using AI when other methods fail
   */
  async classifyWithAI(place) {
    if (!this.env.AI || !place.name) return place;
    try {
      const prompt = `What type of business or place is "${place.name}" in ${place.city || "Unknown city"}, ${place.state || "Unknown state"}? 
      
Respond with just a short identifier like: golf_course, restaurant, hotel, gas_station, shopping_mall, hospital, park, etc.`;
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 50
      });
      const text = (response.response || "").toLowerCase().trim();
      const typeMatch = text.match(/\b(golf_course|restaurant|hotel|gas_station|shopping|hospital|park|gym|cafe|bar|airport|museum|beach|supermarket|bank|pharmacy|school|church|stadium|theater|spa|salon|dealership|mechanic|store|office|warehouse|factory)\b/);
      if (typeMatch) {
        return {
          ...place,
          place_type: typeMatch[1],
          confidence: 0.6,
          source: "ai"
        };
      }
    } catch (error) {
      logger.warn("AI classification failed", { error });
    }
    return place;
  }
  /**
   * Step 2: Infer activity based on place, duration, and time
   */
  async inferActivity(place, durationMinutes, arrivedAt, departedAt) {
    if (durationMinutes < 5) return null;
    if (this.env.AI) {
      return this.inferActivityWithAI(place, durationMinutes, arrivedAt, departedAt);
    }
    return this.inferActivityBasic(place, durationMinutes);
  }
  /**
   * Use AI to infer what activity occurred
   */
  async inferActivityWithAI(place, durationMinutes, arrivedAt, departedAt) {
    if (!this.env.AI) return null;
    const timeOfDay = arrivedAt.getHours();
    const dayOfWeek = arrivedAt.toLocaleDateString("en-US", { weekday: "long" });
    const formattedDuration = this.formatDuration(durationMinutes);
    const prompt = `A Tesla vehicle stopped at the following location. Based on the place, duration, and timing, what activity most likely occurred?

Place: ${place.name || "Unknown"}
Type: ${place.place_type || place.place_description || "Unknown"}
City: ${place.city || "Unknown"}
Duration: ${formattedDuration}
Day: ${dayOfWeek}
Arrival time: ${arrivedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}

Respond in JSON format:
{
  "activity": "brief description of what the person likely did",
  "confidence": 0.0 to 1.0,
  "reasoning": "why you think this",
  "alternatives": ["other", "possible", "activities"]
}

Examples:
- Golf course, 3.5 hours, Saturday morning \u2192 "Played 18 holes of golf"
- Restaurant, 1.5 hours, Friday evening \u2192 "Had dinner"
- Supercharger, 25 minutes \u2192 "Charged vehicle"`;
    try {
      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200
      });
      const text = response.response || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          activity: parsed.activity,
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || "",
          duration_minutes: durationMinutes,
          alternative_activities: parsed.alternatives
        };
      }
    } catch (error) {
      logger.warn("AI activity inference failed", { error });
    }
    return null;
  }
  /**
   * Basic activity inference without AI
   */
  inferActivityBasic(place, durationMinutes) {
    const type = place.place_type?.toLowerCase() || "";
    const name = place.name?.toLowerCase() || "";
    if (type.includes("golf") || name.includes("golf") || name.includes("country club")) {
      let activity = "Visited golf course";
      if (durationMinutes >= 150) activity = "Played a round of golf (18 holes)";
      else if (durationMinutes >= 60) activity = "Played 9 holes or practiced";
      else if (durationMinutes >= 30) activity = "Used driving range";
      return {
        activity,
        confidence: 0.75,
        reasoning: `Duration of ${this.formatDuration(durationMinutes)} at golf course`,
        duration_minutes: durationMinutes
      };
    }
    if (type.includes("restaurant") || type.includes("food") || name.includes("grill") || name.includes("kitchen")) {
      let activity = "Visited restaurant";
      if (durationMinutes >= 90) activity = "Had a leisurely meal";
      else if (durationMinutes >= 45) activity = "Had a meal";
      else activity = "Quick bite";
      return {
        activity,
        confidence: 0.7,
        reasoning: `Duration of ${this.formatDuration(durationMinutes)} at restaurant`,
        duration_minutes: durationMinutes
      };
    }
    if (type.includes("charging") || name.includes("supercharger") || name.includes("charger")) {
      return {
        activity: durationMinutes > 45 ? "Full charge" : "Quick charge",
        confidence: 0.9,
        reasoning: "EV charging station",
        duration_minutes: durationMinutes
      };
    }
    if (type.includes("hotel") || type.includes("motel") || type.includes("inn") || name.includes("hotel") || name.includes("inn")) {
      if (durationMinutes >= 360) {
        return {
          activity: "Overnight stay",
          confidence: 0.85,
          reasoning: `Extended stay of ${this.formatDuration(durationMinutes)}`,
          duration_minutes: durationMinutes
        };
      }
    }
    if (place.name) {
      return {
        activity: `Stopped at ${place.name}`,
        confidence: 0.5,
        reasoning: "Unable to determine specific activity",
        duration_minutes: durationMinutes
      };
    }
    return null;
  }
  /**
   * Check if this is an overnight stay
   */
  isOvernightStay(arrivedAt, departedAt) {
    if (!departedAt) return false;
    const arrivalHour = arrivedAt.getHours();
    const departureHour = departedAt.getHours();
    if (arrivalHour >= 20 && departureHour >= 5 && departureHour <= 12) {
      const hoursStayed = (departedAt.getTime() - arrivedAt.getTime()) / (1e3 * 60 * 60);
      return hoursStayed >= 6;
    }
    return false;
  }
  /**
   * Check if this location is likely home
   */
  async checkIfHome(lat, lng) {
    if (!this.env.TESLA_DB) return false;
    try {
      const result = await this.env.TESLA_DB.prepare(`
        SELECT COUNT(DISTINCT date(arrived_at)) as nights
        FROM stops
        WHERE ABS(latitude - ?) < 0.001
          AND ABS(longitude - ?) < 0.001
          AND is_overnight = TRUE
      `).bind(lat, lng).first();
      return (result?.nights || 0) >= 5;
    } catch {
      return false;
    }
  }
  /**
   * Check if this location is likely work
   */
  async checkIfWork(lat, lng, arrivedAt) {
    if (!this.env.TESLA_DB) return false;
    const dayOfWeek = arrivedAt.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    try {
      const result = await this.env.TESLA_DB.prepare(`
        SELECT COUNT(DISTINCT date(arrived_at)) as days
        FROM stops
        WHERE ABS(latitude - ?) < 0.001
          AND ABS(longitude - ?) < 0.001
          AND strftime('%w', arrived_at) BETWEEN '1' AND '5'
          AND strftime('%H', arrived_at) BETWEEN '07' AND '10'
          AND duration_minutes >= 240
      `).bind(lat, lng).first();
      return (result?.days || 0) >= 5;
    } catch {
      return false;
    }
  }
  /**
   * Allow user to correct a place classification
   */
  async correctPlace(lat, lng, corrections) {
    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    const existing = placeCache.get(cacheKey);
    if (existing) {
      const corrected = {
        ...existing,
        ...corrections,
        confidence: 1,
        source: "user_defined"
      };
      placeCache.set(cacheKey, corrected);
    }
    if (this.env.TESLA_DB) {
      try {
        await this.env.TESLA_DB.prepare(`
          INSERT INTO known_places (latitude, longitude, name, category, is_favorite, created_at, updated_at)
          VALUES (?, ?, ?, ?, FALSE, datetime('now'), datetime('now'))
          ON CONFLICT(latitude, longitude) DO UPDATE SET
            name = ?,
            category = ?,
            updated_at = datetime('now')
        `).bind(
          lat,
          lng,
          corrections.name || "",
          corrections.place_type || "",
          corrections.name || "",
          corrections.place_type || ""
        ).run();
      } catch (error) {
        logger.warn("Failed to save place correction", { error });
      }
    }
  }
  // Helper methods
  createEmptyPlace(lat, lng) {
    return {
      latitude: lat,
      longitude: lng,
      name: null,
      address: null,
      city: null,
      state: null,
      country: null,
      place_type: null,
      place_description: null,
      business_hours: null,
      confidence: 0,
      source: "geocode"
    };
  }
  formatAddress(address) {
    const parts = [];
    if (address.house_number && address.road) {
      parts.push(`${address.house_number} ${address.road}`);
    } else if (address.road) {
      parts.push(address.road);
    }
    if (address.city || address.town || address.village) {
      parts.push(address.city || address.town || address.village);
    }
    if (address.state) {
      parts.push(address.state);
    }
    return parts.length > 0 ? parts.join(", ") : null;
  }
  formatDuration(minutes) {
    if (minutes < 60) return `${Math.round(minutes)} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (mins === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
    return `${hours}h ${mins}m`;
  }
};
var placesRouter = new Hono2();
placesRouter.get("/providers", async (c) => {
  const providers = [
    {
      name: "serper",
      configured: !!c.env.SERPER_API_KEY,
      freeQuota: "2,500/month",
      docs: "https://serper.dev/"
    },
    {
      name: "brave",
      configured: !!c.env.BRAVE_API_KEY,
      freeQuota: "2,000/month",
      docs: "https://brave.com/search/api/"
    },
    {
      name: "tavily",
      configured: !!c.env.TAVILY_API_KEY,
      freeQuota: "1,000/month",
      docs: "https://tavily.com/"
    },
    {
      name: "cloudflare_ai",
      configured: !!c.env.AI,
      freeQuota: "Included with Workers",
      docs: "https://developers.cloudflare.com/workers-ai/"
    }
  ];
  const totalFreeQueries = providers.filter((p) => p.configured && p.name !== "cloudflare_ai").reduce((sum, p) => {
    const num = parseInt(p.freeQuota.replace(/,/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);
  return c.json({
    success: true,
    providers,
    totalConfigured: providers.filter((p) => p.configured).length,
    estimatedFreeQueries: totalFreeQueries,
    fallbackOrder: ["serper", "brave", "tavily", "cloudflare_ai"]
  });
});
placesRouter.get("/rate-limits", async (c) => {
  const tracker = new ApiRateLimitTracker(c.env.TESLA_DB);
  try {
    const statuses = await tracker.getAllProviderStatuses();
    const analytics = await tracker.getUsageAnalytics(30);
    const bestProvider = await tracker.getBestAvailableProvider([
      "serper",
      "brave",
      "tavily",
      "cloudflare_ai"
    ]);
    return c.json({
      success: true,
      providers: statuses,
      bestAvailableProvider: bestProvider,
      analytics: {
        last30Days: analytics
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger.error("Failed to get rate limit status", { error });
    return c.json({
      success: false,
      error: "Failed to get rate limit status",
      message: "Rate limit table may not exist - run migrations"
    }, 500);
  }
});
placesRouter.get("/rate-limits/:provider", async (c) => {
  const provider = c.req.param("provider");
  const tracker = new ApiRateLimitTracker(c.env.TESLA_DB);
  try {
    const status = await tracker.getProviderStatus(provider);
    const prediction = await tracker.predictQuotaExhaustion(provider);
    return c.json({
      success: true,
      provider,
      status,
      prediction,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    logger.error("Failed to get provider rate limit status", { error, provider });
    return c.json({ success: false, error: "Failed to get rate limit status" }, 500);
  }
});
placesRouter.post("/identify", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const { latitude, longitude } = body;
  if (latitude === void 0 || longitude === void 0) {
    return c.json({ success: false, error: "latitude and longitude required" }, 400);
  }
  const intelligence = new DynamicPlaceIntelligence(c.env);
  const place = await intelligence.identifyPlace(latitude, longitude);
  return c.json({
    success: true,
    place
  });
});
placesRouter.post("/analyze-stop", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const { latitude, longitude, duration_minutes, arrived_at, departed_at } = body;
  if (latitude === void 0 || longitude === void 0) {
    return c.json({ success: false, error: "latitude and longitude required" }, 400);
  }
  if (!duration_minutes && !arrived_at) {
    return c.json({ success: false, error: "duration_minutes or arrived_at required" }, 400);
  }
  const arrivedAtDate = arrived_at ? new Date(arrived_at) : /* @__PURE__ */ new Date();
  const departedAtDate = departed_at ? new Date(departed_at) : void 0;
  const duration = duration_minutes || (departedAtDate ? (departedAtDate.getTime() - arrivedAtDate.getTime()) / (1e3 * 60) : 60);
  const intelligence = new DynamicPlaceIntelligence(c.env);
  const analysis = await intelligence.analyzeStop(
    latitude,
    longitude,
    duration,
    arrivedAtDate,
    departedAtDate
  );
  return c.json({
    success: true,
    analysis: {
      place: analysis.place,
      activity: analysis.inferred_activity,
      flags: {
        is_overnight: analysis.is_overnight,
        is_likely_home: analysis.is_likely_home,
        is_likely_work: analysis.is_likely_work
      }
    }
  });
});
placesRouter.post("/correct", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const { latitude, longitude, name, place_type, place_description } = body;
  if (latitude === void 0 || longitude === void 0) {
    return c.json({ success: false, error: "latitude and longitude required" }, 400);
  }
  const intelligence = new DynamicPlaceIntelligence(c.env);
  await intelligence.correctPlace(latitude, longitude, {
    name,
    place_type,
    place_description
  });
  return c.json({
    success: true,
    message: "Place correction saved"
  });
});
placesRouter.get("/stops/:journeyId", async (c) => {
  const journeyId = c.req.param("journeyId");
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const result = await c.env.TESLA_DB.prepare(`
    SELECT * FROM stops 
    WHERE journey_id = ?
    ORDER BY arrived_at DESC
    LIMIT ? OFFSET ?
  `).bind(journeyId, limit, offset).all();
  return c.json({
    success: true,
    stops: result.results || [],
    count: result.results?.length || 0,
    pagination: { limit, offset }
  });
});
placesRouter.get("/stops/:journeyId/activities", async (c) => {
  const journeyId = c.req.param("journeyId");
  const days = parseInt(c.req.query("days") || "30");
  const activities = await c.env.TESLA_DB.prepare(`
    SELECT 
      inferred_activity,
      place_type,
      place_name,
      COUNT(*) as count,
      SUM(duration_minutes) as total_minutes,
      AVG(duration_minutes) as avg_minutes
    FROM stops
    WHERE journey_id = ?
      AND inferred_activity IS NOT NULL
      AND arrived_at >= datetime('now', '-' || ? || ' days')
    GROUP BY inferred_activity, place_type
    ORDER BY count DESC
  `).bind(journeyId, days).all();
  const places = await c.env.TESLA_DB.prepare(`
    SELECT 
      place_name,
      place_type,
      city,
      state_name,
      COUNT(*) as visit_count,
      SUM(duration_minutes) as total_time
    FROM stops
    WHERE journey_id = ?
      AND place_name IS NOT NULL
      AND arrived_at >= datetime('now', '-' || ? || ' days')
    GROUP BY place_name
    ORDER BY visit_count DESC
    LIMIT 20
  `).bind(journeyId, days).all();
  return c.json({
    success: true,
    summary: {
      period_days: days,
      activities: activities.results || [],
      top_places: places.results || []
    }
  });
});
placesRouter.post("/batch-analyze", async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }
  const { stops } = body;
  if (!Array.isArray(stops)) {
    return c.json({ success: false, error: "stops array required" }, 400);
  }
  const intelligence = new DynamicPlaceIntelligence(c.env);
  const results = [];
  for (const stop of stops.slice(0, 20)) {
    try {
      const analysis = await intelligence.analyzeStop(
        stop.latitude,
        stop.longitude,
        stop.duration_minutes || 60,
        new Date(stop.arrived_at || Date.now()),
        stop.departed_at ? new Date(stop.departed_at) : void 0
      );
      results.push({
        input: stop,
        analysis
      });
    } catch (error) {
      results.push({
        input: stop,
        error: "Analysis failed"
      });
    }
  }
  return c.json({
    success: true,
    results,
    processed: results.length
  });
});
function b64urlEncodeBytes(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  const b64 = btoa(s);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
__name(b64urlEncodeBytes, "b64urlEncodeBytes");
function b64urlDecodeToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - b64.length % 4);
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
__name(b64urlDecodeToBytes, "b64urlDecodeToBytes");
function b64urlEncodeJson(obj) {
  return b64urlEncodeBytes(new TextEncoder().encode(JSON.stringify(obj)));
}
__name(b64urlEncodeJson, "b64urlEncodeJson");
var ITERATIONS = 31e4;
var DK_LEN = 32;
async function pbkdf2(password, saltBytes) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    DK_LEN * 8
  );
  return new Uint8Array(bits);
}
__name(pbkdf2, "pbkdf2");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const dk = await pbkdf2(password, salt);
  return {
    password_hash: b64urlEncodeBytes(dk),
    password_salt: b64urlEncodeBytes(salt),
    password_algo: "pbkdf2_sha256_v1"
  };
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, record) {
  if (!record?.password_hash || !record?.password_salt) return false;
  if (record.password_algo !== "pbkdf2_sha256_v1") return false;
  const salt = b64urlDecodeToBytes(record.password_salt);
  const dk = await pbkdf2(password, salt);
  const a = b64urlEncodeBytes(dk);
  if (a.length !== record.password_hash.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ record.password_hash.charCodeAt(i);
  return diff === 0;
}
__name(verifyPassword, "verifyPassword");
async function signJwtHS2562(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const h = b64urlEncodeJson(header);
  const p = b64urlEncodeJson(payload);
  const data = `${h}.${p}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64urlEncodeBytes(sig)}`;
}
__name(signJwtHS2562, "signJwtHS2562");
var bodySchema = external_exports.object({
  action: external_exports.enum(["login", "register"]),
  email: external_exports.string().email(),
  password: external_exports.string().min(10).max(200),
  displayName: external_exports.string().min(1).max(120).optional()
});
async function issueJwt(c, user, mfa) {
  const secret = String(c.env?.JWT_SECRET || "").trim();
  if (!secret) return null;
  const db = c.env?.TESLA_DB;
  const roleRow = db ? await db.prepare(`SELECT role, is_admin FROM users WHERE id = ? LIMIT 1`).bind(user.id).first() : null;
  const role = String(roleRow?.role || (user.is_admin ? "admin" : "user"));
  const isAdmin = !!(roleRow?.is_admin || role === "admin" || role === "owner");
  const ownerEmail = String(c.env?.OWNER_EMAIL || "joe@awhittlewandering.com").toLowerCase().trim();
  const effectiveRole = user.email.toLowerCase().trim() === ownerEmail ? "owner" : role;
  const effectiveAdmin = effectiveRole === "admin" || effectiveRole === "owner" || isAdmin;
  const nowSec = Math.floor(Date.now() / 1e3);
  return await signJwtHS2562(
    {
      iss: "awhittlewandering",
      sub: user.id,
      email: user.email,
      admin: effectiveAdmin,
      role: effectiveRole,
      mfa,
      iat: nowSec,
      exp: nowSec + 60 * 60 * 12
      // 12h
    },
    secret
  );
}
__name(issueJwt, "issueJwt");
var authRouter = new Hono2();
authRouter.post("/", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  let body;
  try {
    body = bodySchema.parse(await c.req.json());
  } catch (e) {
    return c.json({ ok: false, error: "Validation failed", issues: e?.issues }, 400);
  }
  const email = body.email.toLowerCase().trim();
  if (body.action === "register") {
    const id = crypto.randomUUID();
    const pw = await hashPassword(body.password);
    try {
      await db.prepare(
        `INSERT INTO users (id, email, display_name, is_active, is_admin, role, created_at, updated_at, password_hash, password_salt, password_algo, password_updated_at)
           VALUES (?, ?, ?, 1, 0, 'user', datetime('now'), datetime('now'), ?, ?, ?, datetime('now'))`
      ).bind(
        id,
        email,
        body.displayName || null,
        pw.password_hash,
        pw.password_salt,
        pw.password_algo
      ).run();
    } catch (err) {
      logger.warn("Register failed", { email, err: String(err?.message || err) });
      return c.json({ ok: false, error: "Registration failed" }, 400);
    }
    const token2 = await issueJwt(c, { id, email, is_admin: false }, false);
    return c.json({ ok: true, action: "register", token: token2, user: { id, email, admin: false, role: "user" } }, 201);
  }
  const user = await db.prepare(
    `SELECT id, email, display_name, is_admin, role, password_hash, password_salt, password_algo
       FROM users
       WHERE email = ? AND is_active = 1
       LIMIT 1`
  ).bind(email).first();
  if (!user?.id || !user.password_hash || !user.password_salt || !user.password_algo) {
    return c.json({ ok: false, error: "Invalid credentials" }, 401);
  }
  const ok = await verifyPassword(body.password, {
    password_hash: user.password_hash,
    password_salt: user.password_salt,
    password_algo: "pbkdf2_sha256_v1"
  });
  if (!ok) return c.json({ ok: false, error: "Invalid credentials" }, 401);
  c.executionCtx?.waitUntil?.(
    db.prepare(`UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).bind(user.id).run().then(() => void 0)
  );
  const ownerEmail = String(c.env?.OWNER_EMAIL || "joe@awhittlewandering.com").toLowerCase().trim();
  const role = String(user.role || (user.is_admin ? "admin" : "user"));
  const effectiveRole = user.email.toLowerCase().trim() === ownerEmail ? "owner" : role;
  const isAdmin = !!user.is_admin || effectiveRole === "admin" || effectiveRole === "owner";
  if (isAdmin) {
    const factor = await db.prepare(
      `SELECT id FROM mfa_factors
         WHERE user_id = ? AND revoked_at IS NULL AND verified_at IS NOT NULL
         LIMIT 1`
    ).bind(user.id).first();
    if (!factor?.id) {
      return c.json(
        { ok: false, code: "mfa_setup_required", message: "Admin accounts must enable TOTP MFA." },
        403
      );
    }
    const kv = c.env?.AUTH_TOKENS;
    if (!kv) return c.json({ ok: false, error: "Auth challenge store not configured" }, 500);
    const challengeId = crypto.randomUUID();
    await kv.put(
      `mfa_challenge:${challengeId}`,
      JSON.stringify({ userId: user.id, factorId: factor.id, createdAt: Date.now() }),
      { expirationTtl: 300 }
    );
    return c.json({
      ok: true,
      action: "login",
      mfaRequired: true,
      challengeId,
      factorType: "totp",
      role: effectiveRole
    });
  }
  const token = await issueJwt(c, { id: user.id, email: user.email, is_admin: isAdmin }, false);
  return c.json({
    ok: true,
    action: "login",
    token,
    user: { id: user.id, email: user.email, admin: isAdmin, role: effectiveRole }
  });
});
authRouter.get("/me", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  const row = await db.prepare(`SELECT id, email, display_name, role, is_admin FROM users WHERE id = ? LIMIT 1`).bind(user.id).first();
  if (!row?.id) return c.json({ ok: false, error: "User not found" }, 404);
  const ownerEmail = String(c.env?.OWNER_EMAIL || "joe@awhittlewandering.com").toLowerCase().trim();
  const baseRole = String(row.role || (row.is_admin ? "admin" : "user"));
  const role = String(row.email).toLowerCase().trim() === ownerEmail ? "owner" : baseRole;
  const isAdmin = !!row.is_admin || role === "admin" || role === "owner";
  const j = await db.prepare(`SELECT COUNT(1) as cnt FROM journey_registry WHERE user_id = ? AND status != 'deleted'`).bind(user.id).first();
  const journeyCount = Number(j?.cnt || 0);
  const journeyOwner = journeyCount > 0;
  const f = await db.prepare(
    `SELECT 1 as ok FROM mfa_factors
       WHERE user_id = ? AND revoked_at IS NULL AND verified_at IS NOT NULL
       LIMIT 1`
  ).bind(user.id).first();
  const mfaEnabled = !!f?.ok;
  const mfaRequired = isAdmin || journeyOwner;
  return c.json({
    ok: true,
    user: {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role,
      admin: isAdmin
    },
    journeyOwner,
    mfaEnabled,
    mfaRequired
  });
});
var ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = value << 8 | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[value >>> bits - 5 & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[value << 5 - bits & 31];
  return output;
}
__name(base32Encode, "base32Encode");
function base32Decode(input) {
  const clean = input.toUpperCase().replace(/=+$/g, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = ALPHABET.indexOf(clean[i]);
    if (idx < 0) continue;
    value = value << 5 | idx;
    bits += 5;
    if (bits >= 8) {
      out.push(value >>> bits - 8 & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}
__name(base32Decode, "base32Decode");
function generateTotpSecretBase32() {
  const secret = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(secret);
}
__name(generateTotpSecretBase32, "generateTotpSecretBase32");
function buildOtpAuthUri(secretBase32, cfg) {
  const digits = cfg.digits ?? 6;
  const periodSec = cfg.periodSec ?? 30;
  const label = `${cfg.issuer}:${cfg.accountName}`;
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer: cfg.issuer,
    digits: String(digits),
    period: String(periodSec),
    algorithm: "SHA1"
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}
__name(buildOtpAuthUri, "buildOtpAuthUri");
function toCounterBytes(counter) {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter >>> 0);
  return new Uint8Array(buf);
}
__name(toCounterBytes, "toCounterBytes");
async function hmacSha1(keyBytes, msgBytes) {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, msgBytes);
  return new Uint8Array(sig);
}
__name(hmacSha1, "hmacSha1");
async function hotp(secretBase32, counter, digits) {
  const key = base32Decode(secretBase32);
  const msg = toCounterBytes(counter);
  const mac = await hmacSha1(key, msg);
  const offset = mac[mac.length - 1] & 15;
  const bin = (mac[offset] & 127) << 24 | (mac[offset + 1] & 255) << 16 | (mac[offset + 2] & 255) << 8 | mac[offset + 3] & 255;
  const mod = 10 ** digits;
  return String(bin % mod).padStart(digits, "0");
}
__name(hotp, "hotp");
async function verifyTotpCode(secretBase32, code, nowMs = Date.now()) {
  const digits = 6;
  const periodSec = 30;
  const t = Math.floor(nowMs / 1e3);
  const counter = Math.floor(t / periodSec);
  const normalized = String(code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  for (const delta of [-1, 0, 1]) {
    const expected = await hotp(secretBase32, counter + delta, digits);
    if (expected === normalized) return true;
  }
  return false;
}
__name(verifyTotpCode, "verifyTotpCode");
async function keyFromString(secret) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
__name(keyFromString, "keyFromString");
async function sealText(plaintext, secret) {
  const key = await keyFromString(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const blob = { v: 1, iv: b64urlEncodeBytes(iv), ct: b64urlEncodeBytes(ct) };
  return JSON.stringify(blob);
}
__name(sealText, "sealText");
async function openText(sealed, secret) {
  let parsed;
  try {
    parsed = JSON.parse(sealed);
  } catch {
    return null;
  }
  if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.ct) return null;
  const key = await keyFromString(secret);
  try {
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64urlDecodeToBytes(parsed.iv) },
      key,
      b64urlDecodeToBytes(parsed.ct)
    );
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}
__name(openText, "openText");
async function sha256B64Url(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return b64urlEncodeBytes(digest);
}
__name(sha256B64Url, "sha256B64Url");
var mfaRouter = new Hono2();
var enrollSchema = external_exports.object({
  friendlyName: external_exports.string().min(1).max(120).optional()
});
var verifySchema = external_exports.object({
  factorId: external_exports.string().min(10),
  code: external_exports.string().min(6).max(12)
});
var challengeVerifySchema = external_exports.object({
  challengeId: external_exports.string().min(10),
  code: external_exports.string().min(6).max(12)
});
function requireMfaKey(c) {
  const k = String(c.env?.MFA_TOTP_ENCRYPTION_KEY || "").trim();
  return k || null;
}
__name(requireMfaKey, "requireMfaKey");
async function issueJwt2(c, userId, email, role, isAdmin) {
  const secret = String(c.env?.JWT_SECRET || "").trim();
  if (!secret) return null;
  const nowSec = Math.floor(Date.now() / 1e3);
  return signJwtHS2562(
    {
      iss: "awhittlewandering",
      sub: userId,
      email,
      admin: isAdmin,
      role,
      mfa: true,
      iat: nowSec,
      exp: nowSec + 60 * 60 * 12
    },
    secret
  );
}
__name(issueJwt2, "issueJwt2");
mfaRouter.post("/totp/enroll", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const key = requireMfaKey(c);
  if (!key) return c.json({ ok: false, error: "MFA encryption key not configured" }, 500);
  let body;
  try {
    body = enrollSchema.parse(await c.req.json());
  } catch (e) {
    return c.json({ ok: false, error: "Validation failed", issues: e?.issues }, 400);
  }
  const user = c.get("user");
  const u = await db.prepare(`SELECT email, role, is_admin FROM users WHERE id = ? LIMIT 1`).bind(user.id).first();
  if (!u?.email) return c.json({ ok: false, error: "User not found" }, 404);
  const secretBase32 = generateTotpSecretBase32();
  const issuer = "AWhittleWandering";
  const accountName = String(u.email);
  const uri = buildOtpAuthUri(secretBase32, { issuer, accountName });
  const factorId = crypto.randomUUID();
  const secretEnc = await sealText(secretBase32, key);
  await db.prepare(
    `INSERT INTO mfa_factors (id, user_id, factor_type, friendly_name, secret_enc, created_at)
       VALUES (?, ?, 'totp', ?, ?, datetime('now'))`
  ).bind(factorId, user.id, body.friendlyName || "Authenticator", secretEnc).run();
  logger.info("mfa_totp_enroll", { userId: user.id, factorId });
  return c.json({ ok: true, factorId, uri });
});
mfaRouter.post("/totp/verify", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const key = requireMfaKey(c);
  if (!key) return c.json({ ok: false, error: "MFA encryption key not configured" }, 500);
  let body;
  try {
    body = verifySchema.parse(await c.req.json());
  } catch (e) {
    return c.json({ ok: false, error: "Validation failed", issues: e?.issues }, 400);
  }
  const user = c.get("user");
  const factor = await db.prepare(
    `SELECT id, secret_enc, verified_at, revoked_at
       FROM mfa_factors
       WHERE id = ? AND user_id = ? AND factor_type = 'totp'
       LIMIT 1`
  ).bind(body.factorId, user.id).first();
  if (!factor?.id || factor.revoked_at) return c.json({ ok: false, error: "Factor not found" }, 404);
  if (factor.verified_at) return c.json({ ok: false, error: "Factor already verified" }, 409);
  const secretBase32 = await openText(String(factor.secret_enc), key);
  if (!secretBase32) return c.json({ ok: false, error: "Failed to decrypt secret" }, 500);
  const ok = await verifyTotpCode(secretBase32, body.code);
  if (!ok) return c.json({ ok: false, error: "Invalid code" }, 400);
  await db.prepare(`UPDATE mfa_factors SET verified_at = datetime('now') WHERE id = ? AND user_id = ?`).bind(body.factorId, user.id).run();
  const pepper = String(c.env?.RECOVERY_CODE_PEPPER || c.env?.MFA_TOTP_ENCRYPTION_KEY || "").trim();
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const raw2 = crypto.getRandomValues(new Uint8Array(10));
    const code = Array.from(raw2).map((b) => (b % 36).toString(36)).join("").slice(0, 10).toUpperCase();
    const formatted = `${code.slice(0, 5)}-${code.slice(5)}`;
    codes.push(formatted);
  }
  for (const code of codes) {
    const codeHash = await sha256B64Url(`${pepper}:${user.id}:${code}`);
    await db.prepare(`INSERT INTO mfa_recovery_codes (id, user_id, code_hash, created_at) VALUES (?, ?, ?, datetime('now'))`).bind(crypto.randomUUID(), user.id, codeHash).run();
  }
  logger.info("mfa_totp_verify", { userId: user.id, factorId: body.factorId });
  return c.json({ ok: true, recoveryCodes: codes });
});
mfaRouter.post("/challenge/verify", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const key = requireMfaKey(c);
  if (!key) return c.json({ ok: false, error: "MFA encryption key not configured" }, 500);
  const kv = c.env?.AUTH_TOKENS;
  if (!kv) return c.json({ ok: false, error: "Auth challenge store not configured" }, 500);
  let body;
  try {
    body = challengeVerifySchema.parse(await c.req.json());
  } catch (e) {
    return c.json({ ok: false, error: "Validation failed", issues: e?.issues }, 400);
  }
  const stored = await kv.get(`mfa_challenge:${body.challengeId}`, { type: "json" });
  if (!stored?.userId || !stored?.factorId) return c.json({ ok: false, error: "Invalid or expired challenge" }, 400);
  const factor = await db.prepare(
    `SELECT secret_enc, revoked_at, verified_at
       FROM mfa_factors
       WHERE id = ? AND user_id = ? AND factor_type = 'totp'
       LIMIT 1`
  ).bind(String(stored.factorId), String(stored.userId)).first();
  if (!factor?.secret_enc || factor.revoked_at || !factor.verified_at) {
    return c.json({ ok: false, error: "Factor not valid" }, 400);
  }
  const secretBase32 = await openText(String(factor.secret_enc), key);
  if (!secretBase32) return c.json({ ok: false, error: "Failed to decrypt secret" }, 500);
  const ok = await verifyTotpCode(secretBase32, body.code);
  if (!ok) return c.json({ ok: false, error: "Invalid code" }, 400);
  await kv.delete(`mfa_challenge:${body.challengeId}`);
  const userRow = await db.prepare(`SELECT id, email, role, is_admin FROM users WHERE id = ? LIMIT 1`).bind(String(stored.userId)).first();
  if (!userRow?.id || !userRow?.email) return c.json({ ok: false, error: "User not found" }, 404);
  const ownerEmail = String(c.env?.OWNER_EMAIL || "joe@awhittlewandering.com").toLowerCase().trim();
  const role = String(userRow.role || (userRow.is_admin ? "admin" : "user"));
  const effectiveRole = String(userRow.email).toLowerCase().trim() === ownerEmail ? "owner" : role;
  const isAdmin = !!userRow.is_admin || effectiveRole === "admin" || effectiveRole === "owner";
  const token = await issueJwt2(c, userRow.id, userRow.email, effectiveRole, isAdmin);
  logger.info("mfa_challenge_verify", { userId: userRow.id });
  return c.json({ ok: true, token, user: { id: userRow.id, email: userRow.email, role: effectiveRole, admin: isAdmin } });
});
var pushRouter = new Hono2();
var subscribeSchema = external_exports.object({
  endpoint: external_exports.string().url(),
  keys: external_exports.object({
    p256dh: external_exports.string().min(10),
    auth: external_exports.string().min(6)
  })
});
pushRouter.post("/subscribe", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  let body;
  try {
    body = subscribeSchema.parse(await c.req.json());
  } catch (e) {
    return c.json({ ok: false, error: "Validation failed", issues: e?.issues }, 400);
  }
  const ua = c.req.header("User-Agent") || "";
  const uaHash = ua ? await sha256B64Url(ua) : null;
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, ua_hash, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(user_id, endpoint) DO UPDATE SET
         p256dh=excluded.p256dh,
         auth=excluded.auth,
         ua_hash=excluded.ua_hash,
         last_seen_at=datetime('now'),
         revoked_at=NULL`
  ).bind(id, user.id, body.endpoint, body.keys.p256dh, body.keys.auth, uaHash).run();
  return c.json({ ok: true });
});
var unsubscribeSchema = external_exports.object({
  endpoint: external_exports.string().url()
});
pushRouter.post("/unsubscribe", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  let body;
  try {
    body = unsubscribeSchema.parse(await c.req.json());
  } catch (e) {
    return c.json({ ok: false, error: "Validation failed", issues: e?.issues }, 400);
  }
  await db.prepare(`UPDATE push_subscriptions SET revoked_at = datetime('now') WHERE user_id = ? AND endpoint = ?`).bind(user.id, body.endpoint).run();
  return c.json({ ok: true });
});
var notificationsRouter = new Hono2();
var listSchema = external_exports.object({
  limit: external_exports.coerce.number().min(1).max(100).default(25),
  cursor: external_exports.string().optional(),
  // created_at ISO cursor (best-effort)
  unreadOnly: external_exports.coerce.boolean().optional()
});
notificationsRouter.get("/", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  const parsed = listSchema.safeParse({
    limit: c.req.query("limit"),
    cursor: c.req.query("cursor"),
    unreadOnly: c.req.query("unreadOnly")
  });
  if (!parsed.success) return c.json({ ok: false, error: "Validation failed", issues: parsed.error.issues }, 400);
  const { limit, cursor, unreadOnly } = parsed.data;
  const where = ["user_id = ?"];
  const bind = [user.id];
  if (unreadOnly) where.push("read_at IS NULL");
  if (cursor) {
    where.push("created_at < ?");
    bind.push(cursor);
  }
  const rows = await db.prepare(
    `SELECT id, journey_id, notification_type, title, body, metadata_json, created_at, read_at
       FROM notifications
       WHERE ${where.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT ?`
  ).bind(...bind, limit).all();
  const results = rows.results || [];
  const nextCursor = results.length ? results[results.length - 1].created_at : null;
  return c.json({ ok: true, notifications: results, nextCursor });
});
var markReadSchema = external_exports.object({
  read: external_exports.boolean().default(true)
});
notificationsRouter.post("/:id/read", requireUser, async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) return c.json({ ok: false, error: "Database not configured" }, 500);
  const user = c.get("user");
  const id = c.req.param("id");
  let body;
  try {
    body = markReadSchema.parse(await c.req.json().catch(() => ({})));
  } catch (e) {
    return c.json({ ok: false, error: "Validation failed", issues: e?.issues }, 400);
  }
  if (body.read) {
    await db.prepare(`UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?`).bind(id, user.id).run();
  } else {
    await db.prepare(`UPDATE notifications SET read_at = NULL WHERE id = ? AND user_id = ?`).bind(id, user.id).run();
  }
  return c.json({ ok: true });
});
function parseCSV(csvContent) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;
  for (let i = 0; i < csvContent.length; i++) {
    const char = csvContent[i];
    const nextChar = csvContent[i + 1];
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\n" || char === "\r") {
        if (currentField || currentRow.length > 0) {
          currentRow.push(currentField.trim());
          if (currentRow.some((f) => f.length > 0)) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = "";
        }
        if (char === "\r" && nextChar === "\n") {
          i++;
        }
      } else {
        currentField += char;
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }
  return rows;
}
__name(parseCSV, "parseCSV");
function csvToObjects(rows) {
  if (rows.length === 0) return [];
  const headers = rows[0];
  const data = rows.slice(1);
  return data.map((row) => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || "";
    });
    return obj;
  });
}
__name(csvToObjects, "csvToObjects");
var TeslaDriveRowSchema = external_exports.object({
  // Temporal
  "Start Time": external_exports.string(),
  "End Time": external_exports.string(),
  // Location
  "Start Address": external_exports.string().optional(),
  "End Address": external_exports.string().optional(),
  "Start Latitude": external_exports.string(),
  "Start Longitude": external_exports.string(),
  "End Latitude": external_exports.string(),
  "End Longitude": external_exports.string(),
  // Distance and energy
  "Distance (mi)": external_exports.string(),
  "Energy Used (kWh)": external_exports.string().optional(),
  // Battery
  "Start Battery": external_exports.string().optional(),
  "End Battery": external_exports.string().optional(),
  // Speed
  "Average Speed (mph)": external_exports.string().optional(),
  "Max Speed (mph)": external_exports.string().optional(),
  // Temperature
  "Outside Temp (avg)": external_exports.string().optional(),
  "Inside Temp (avg)": external_exports.string().optional(),
  // Additional fields
  "Duration (minutes)": external_exports.string().optional(),
  "Odometer (start)": external_exports.string().optional(),
  "Odometer (end)": external_exports.string().optional()
}).passthrough();
var TeslaChargeRowSchema = external_exports.object({
  // Temporal
  "Start Time": external_exports.string(),
  "End Time": external_exports.string().optional(),
  // Location
  "Location": external_exports.string().optional(),
  "Latitude": external_exports.string(),
  "Longitude": external_exports.string(),
  // Charger info
  "Charger Type": external_exports.string().optional(),
  "Is Supercharger": external_exports.string().optional(),
  // Energy
  "Energy Added (kWh)": external_exports.string(),
  "Energy Used (kWh)": external_exports.string().optional(),
  // Battery
  "Start Battery": external_exports.string().optional(),
  "End Battery": external_exports.string().optional(),
  // Cost
  "Cost": external_exports.string().optional(),
  // Additional fields
  "Duration (minutes)": external_exports.string().optional(),
  "Odometer": external_exports.string().optional()
}).passthrough();
async function generateHash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex.substring(0, 32);
}
__name(generateHash, "generateHash");
async function generateDriveDedupeKey(startTime, startLat, startLng, endLat, endLng) {
  const data = `${startTime}|${startLat.toFixed(6)}|${startLng.toFixed(6)}|${endLat.toFixed(6)}|${endLng.toFixed(6)}`;
  return generateHash(data);
}
__name(generateDriveDedupeKey, "generateDriveDedupeKey");
async function generateEnergyDedupeKey(startTime, lat, lng, energyAdded) {
  const data = `${startTime}|${lat.toFixed(6)}|${lng.toFixed(6)}|${energyAdded.toFixed(2)}`;
  return generateHash(data);
}
__name(generateEnergyDedupeKey, "generateEnergyDedupeKey");
function parseNumber(value, defaultValue = 0) {
  if (!value) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}
__name(parseNumber, "parseNumber");
function parseInt2(value, defaultValue = 0) {
  if (!value) return defaultValue;
  const num = Number.parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}
__name(parseInt2, "parseInt2");
function parseBoolean(value) {
  if (!value) return false;
  return value.toLowerCase() === "true" || value === "1" || value.toLowerCase() === "yes";
}
__name(parseBoolean, "parseBoolean");
async function importTeslaDrives(db, csvContent, journeyId, vehicleId) {
  const startTime = Date.now();
  const errors = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  try {
    const rows = parseCSV(csvContent);
    const objects = csvToObjects(rows);
    const BATCH_SIZE = 500;
    for (let i = 0; i < objects.length; i += BATCH_SIZE) {
      const batch = objects.slice(i, i + BATCH_SIZE);
      const statements = [];
      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2;
        const row = batch[j];
        try {
          const validated = TeslaDriveRowSchema.parse(row);
          const startLat = parseNumber(validated["Start Latitude"]);
          const startLng = parseNumber(validated["Start Longitude"]);
          const endLat = parseNumber(validated["End Latitude"]);
          const endLng = parseNumber(validated["End Longitude"]);
          const startTime2 = validated["Start Time"];
          const dedupKey = await generateDriveDedupeKey(startTime2, startLat, startLng, endLat, endLng);
          const duration = validated["Duration (minutes)"] ? parseInt2(validated["Duration (minutes)"]) : 0;
          const distance = parseNumber(validated["Distance (mi)"]);
          const energyUsed = parseNumber(validated["Energy Used (kWh)"]);
          const efficiency = energyUsed > 0 ? distance / energyUsed : 0;
          const stmt = db.prepare(`
            INSERT INTO drive_segments (
              journey_id, vehicle_id, dedup_key,
              start_time, end_time, duration_minutes,
              start_address, end_address,
              start_latitude, start_longitude, end_latitude, end_longitude,
              distance_miles, energy_used_kwh, efficiency_miles_per_kwh,
              start_battery_level, end_battery_level,
              avg_outside_temp_f, avg_inside_temp_f,
              avg_speed_mph, max_speed_mph,
              odometer_start, odometer_end,
              import_source, import_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(dedup_key) DO NOTHING
          `).bind(
            journeyId,
            vehicleId,
            dedupKey,
            validated["Start Time"],
            validated["End Time"],
            duration,
            validated["Start Address"] || null,
            validated["End Address"] || null,
            startLat,
            startLng,
            endLat,
            endLng,
            distance,
            energyUsed,
            efficiency,
            parseInt2(validated["Start Battery"]),
            parseInt2(validated["End Battery"]),
            parseNumber(validated["Outside Temp (avg)"]),
            parseNumber(validated["Inside Temp (avg)"]),
            parseNumber(validated["Average Speed (mph)"]),
            parseNumber(validated["Max Speed (mph)"]),
            parseNumber(validated["Odometer (start)"]),
            parseNumber(validated["Odometer (end)"]),
            "csv"
          );
          statements.push(stmt);
        } catch (err) {
          failed++;
          errors.push({
            row: rowIndex,
            error: err.message || String(err),
            data: row
          });
        }
      }
      if (statements.length > 0) {
        const results = await db.batch(statements);
        const insertedCount = results.filter((r) => r.meta.changes > 0).length;
        imported += insertedCount;
        skipped += statements.length - insertedCount;
      }
    }
    return {
      success: failed === 0,
      recordsProcessed: objects.length,
      recordsImported: imported,
      recordsSkipped: skipped,
      recordsFailed: failed,
      errors,
      duration: Date.now() - startTime
    };
  } catch (err) {
    return {
      success: false,
      recordsProcessed: 0,
      recordsImported: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      errors: [{ row: 0, error: `Fatal error: ${err.message || String(err)}` }],
      duration: Date.now() - startTime
    };
  }
}
__name(importTeslaDrives, "importTeslaDrives");
async function importTeslaCharges(db, csvContent, journeyId, vehicleId) {
  const startTime = Date.now();
  const errors = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;
  try {
    const rows = parseCSV(csvContent);
    const objects = csvToObjects(rows);
    const BATCH_SIZE = 500;
    for (let i = 0; i < objects.length; i += BATCH_SIZE) {
      const batch = objects.slice(i, i + BATCH_SIZE);
      const statements = [];
      for (let j = 0; j < batch.length; j++) {
        const rowIndex = i + j + 2;
        const row = batch[j];
        try {
          const validated = TeslaChargeRowSchema.parse(row);
          const lat = parseNumber(validated["Latitude"]);
          const lng = parseNumber(validated["Longitude"]);
          const startTime2 = validated["Start Time"];
          const energyAdded = parseNumber(validated["Energy Added (kWh)"]);
          const dedupKey = await generateEnergyDedupeKey(startTime2, lat, lng, energyAdded);
          const duration = validated["Duration (minutes)"] ? parseInt2(validated["Duration (minutes)"]) : 0;
          const energyUsed = parseNumber(validated["Energy Used (kWh)"]);
          const efficiency = energyUsed > 0 ? energyAdded / energyUsed * 100 : 100;
          const startBattery = parseInt2(validated["Start Battery"]);
          const endBattery = parseInt2(validated["End Battery"]);
          const batteryDelta = endBattery - startBattery;
          const isSupercharger = parseBoolean(validated["Is Supercharger"]);
          const chargerType = validated["Charger Type"] || (isSupercharger ? "Supercharger" : "Level2");
          const stmt = db.prepare(`
            INSERT INTO energy_events (
              journey_id, vehicle_id, dedup_key, event_type,
              start_time, end_time, duration_minutes,
              location_name, latitude, longitude,
              charger_type, is_supercharger,
              energy_added_kwh, energy_used_kwh, charge_efficiency_percent,
              start_battery_level, end_battery_level, battery_delta,
              cost_usd, odometer,
              import_source, import_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(dedup_key) DO NOTHING
          `).bind(
            journeyId,
            vehicleId,
            dedupKey,
            "charge",
            validated["Start Time"],
            validated["End Time"] || null,
            duration,
            validated["Location"] || null,
            lat,
            lng,
            chargerType,
            isSupercharger ? 1 : 0,
            energyAdded,
            energyUsed,
            efficiency,
            startBattery,
            endBattery,
            batteryDelta,
            parseNumber(validated["Cost"]),
            parseNumber(validated["Odometer"]),
            "csv"
          );
          statements.push(stmt);
        } catch (err) {
          failed++;
          errors.push({
            row: rowIndex,
            error: err.message || String(err),
            data: row
          });
        }
      }
      if (statements.length > 0) {
        const results = await db.batch(statements);
        const insertedCount = results.filter((r) => r.meta.changes > 0).length;
        imported += insertedCount;
        skipped += statements.length - insertedCount;
      }
    }
    return {
      success: failed === 0,
      recordsProcessed: objects.length,
      recordsImported: imported,
      recordsSkipped: skipped,
      recordsFailed: failed,
      errors,
      duration: Date.now() - startTime
    };
  } catch (err) {
    return {
      success: false,
      recordsProcessed: 0,
      recordsImported: 0,
      recordsSkipped: 0,
      recordsFailed: 0,
      errors: [{ row: 0, error: `Fatal error: ${err.message || String(err)}` }],
      duration: Date.now() - startTime
    };
  }
}
__name(importTeslaCharges, "importTeslaCharges");
var importRouter = new Hono2();
var WaypointSchema = external_exports.object({
  id: external_exports.string().optional(),
  sequenceNumber: external_exports.number(),
  timestamp: external_exports.string(),
  latitude: external_exports.number(),
  longitude: external_exports.number(),
  locationName: external_exports.string(),
  stateName: external_exports.string().optional(),
  city: external_exports.string().optional(),
  waypointType: external_exports.enum(["narrative", "photo", "milestone", "poi"]).default("narrative"),
  category: external_exports.enum(["scenic", "food", "lodging", "landmark", "rest", "charge"]).optional(),
  title: external_exports.string(),
  description: external_exports.string().optional(),
  narrativeText: external_exports.string().optional(),
  photoUrls: external_exports.array(external_exports.string()).optional(),
  tags: external_exports.array(external_exports.string()).optional(),
  weather: external_exports.record(external_exports.any()).optional(),
  highlights: external_exports.array(external_exports.string()).optional(),
  isPublic: external_exports.boolean().default(true),
  isFeatured: external_exports.boolean().default(false)
});
var WaypointsImportSchema = external_exports.object({
  waypoints: external_exports.array(WaypointSchema),
  journeyId: external_exports.string().default("continental-usa-2025")
});
importRouter.post("/tesla-drives", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) {
    return c.json({ success: false, error: "Database not configured" }, 500);
  }
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const journeyId = formData.get("journeyId") || "continental-usa-2025";
    const vehicleId = formData.get("vehicleId") || "midnight-shadow";
    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }
    if (!file.name.endsWith(".csv")) {
      return c.json({ success: false, error: "File must be a CSV" }, 400);
    }
    const csvContent = await file.text();
    logger.info("import.tesla-drives.start", {
      filename: file.name,
      size: file.size,
      journeyId,
      vehicleId
    });
    const auditResult = await db.prepare(`
      INSERT INTO import_audit (
        journey_id, import_type, import_source, filename, status, started_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      RETURNING id
    `).bind(journeyId, "drive_segments", "csv", file.name, "processing").first();
    const auditId = auditResult?.id;
    const result = await importTeslaDrives(db, csvContent, journeyId, vehicleId);
    if (auditId) {
      await db.prepare(`
        UPDATE import_audit
        SET records_processed = ?,
            records_imported = ?,
            records_skipped = ?,
            records_failed = ?,
            status = ?,
            error_summary = ?,
            duration_ms = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).bind(
        result.recordsProcessed,
        result.recordsImported,
        result.recordsSkipped,
        result.recordsFailed,
        result.success ? "completed" : result.recordsImported > 0 ? "partial" : "failed",
        JSON.stringify(result.errors),
        result.duration,
        auditId
      ).run();
    }
    await updateJourneyAggregates(db, journeyId);
    logger.info("import.tesla-drives.complete", {
      filename: file.name,
      ...result
    });
    return c.json({
      success: result.success,
      message: `Imported ${result.recordsImported} drive segments`,
      stats: {
        processed: result.recordsProcessed,
        imported: result.recordsImported,
        skipped: result.recordsSkipped,
        failed: result.recordsFailed,
        duration: result.duration
      },
      errors: result.errors.slice(0, 10)
      // Return first 10 errors
    });
  } catch (err) {
    logger.error("import.tesla-drives.error", { error: err.message, stack: err.stack });
    return c.json({
      success: false,
      error: "Import failed",
      message: err.message || String(err)
    }, 500);
  }
});
importRouter.post("/tesla-charges", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) {
    return c.json({ success: false, error: "Database not configured" }, 500);
  }
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const journeyId = formData.get("journeyId") || "continental-usa-2025";
    const vehicleId = formData.get("vehicleId") || "midnight-shadow";
    if (!file) {
      return c.json({ success: false, error: "No file provided" }, 400);
    }
    if (!file.name.endsWith(".csv")) {
      return c.json({ success: false, error: "File must be a CSV" }, 400);
    }
    const csvContent = await file.text();
    logger.info("import.tesla-charges.start", {
      filename: file.name,
      size: file.size,
      journeyId,
      vehicleId
    });
    const auditResult = await db.prepare(`
      INSERT INTO import_audit (
        journey_id, import_type, import_source, filename, status, started_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
      RETURNING id
    `).bind(journeyId, "energy_events", "csv", file.name, "processing").first();
    const auditId = auditResult?.id;
    const result = await importTeslaCharges(db, csvContent, journeyId, vehicleId);
    if (auditId) {
      await db.prepare(`
        UPDATE import_audit
        SET records_processed = ?,
            records_imported = ?,
            records_skipped = ?,
            records_failed = ?,
            status = ?,
            error_summary = ?,
            duration_ms = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).bind(
        result.recordsProcessed,
        result.recordsImported,
        result.recordsSkipped,
        result.recordsFailed,
        result.success ? "completed" : result.recordsImported > 0 ? "partial" : "failed",
        JSON.stringify(result.errors),
        result.duration,
        auditId
      ).run();
    }
    await updateJourneyAggregates(db, journeyId);
    logger.info("import.tesla-charges.complete", {
      filename: file.name,
      ...result
    });
    return c.json({
      success: result.success,
      message: `Imported ${result.recordsImported} charge events`,
      stats: {
        processed: result.recordsProcessed,
        imported: result.recordsImported,
        skipped: result.recordsSkipped,
        failed: result.recordsFailed,
        duration: result.duration
      },
      errors: result.errors.slice(0, 10)
    });
  } catch (err) {
    logger.error("import.tesla-charges.error", { error: err.message, stack: err.stack });
    return c.json({
      success: false,
      error: "Import failed",
      message: err.message || String(err)
    }, 500);
  }
});
importRouter.post("/waypoints", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) {
    return c.json({ success: false, error: "Database not configured" }, 500);
  }
  try {
    const startTime = Date.now();
    const body = await c.req.json();
    const validated = WaypointsImportSchema.parse(body);
    const journeyId = validated.journeyId;
    const waypoints = validated.waypoints;
    logger.info("import.waypoints.start", {
      journeyId,
      count: waypoints.length
    });
    const auditResult = await db.prepare(`
      INSERT INTO import_audit (
        journey_id, import_type, import_source, status, started_at
      ) VALUES (?, ?, ?, ?, datetime('now'))
      RETURNING id
    `).bind(journeyId, "waypoints", "json", "processing").first();
    const auditId = auditResult?.id;
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];
    const BATCH_SIZE = 500;
    for (let i = 0; i < waypoints.length; i += BATCH_SIZE) {
      const batch = waypoints.slice(i, i + BATCH_SIZE);
      const statements = [];
      for (const waypoint of batch) {
        try {
          const waypointId = waypoint.id || crypto.randomUUID();
          const date = new Date(waypoint.timestamp).toISOString().slice(0, 10);
          const stmt = db.prepare(`
            INSERT INTO waypoints (
              id, journey_id, sequence_number, timestamp, date,
              latitude, longitude, location_name, state_name, city,
              waypoint_type, category,
              title, description, narrative_text,
              photo_urls, tags, weather, highlights,
              is_public, is_featured,
              import_source, import_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET
              timestamp = excluded.timestamp,
              title = excluded.title,
              description = excluded.description,
              narrative_text = excluded.narrative_text,
              updated_at = datetime('now')
          `).bind(
            waypointId,
            journeyId,
            waypoint.sequenceNumber,
            waypoint.timestamp,
            date,
            waypoint.latitude,
            waypoint.longitude,
            waypoint.locationName,
            waypoint.stateName || null,
            waypoint.city || null,
            waypoint.waypointType,
            waypoint.category || null,
            waypoint.title,
            waypoint.description || null,
            waypoint.narrativeText || null,
            waypoint.photoUrls ? JSON.stringify(waypoint.photoUrls) : null,
            waypoint.tags ? JSON.stringify(waypoint.tags) : null,
            waypoint.weather ? JSON.stringify(waypoint.weather) : null,
            waypoint.highlights ? JSON.stringify(waypoint.highlights) : null,
            waypoint.isPublic ? 1 : 0,
            waypoint.isFeatured ? 1 : 0,
            "json"
          );
          statements.push(stmt);
        } catch (err) {
          failed++;
          errors.push({
            waypoint: waypoint.title,
            error: err.message || String(err)
          });
        }
      }
      if (statements.length > 0) {
        const results = await db.batch(statements);
        imported += results.length;
      }
    }
    const duration = Date.now() - startTime;
    if (auditId) {
      await db.prepare(`
        UPDATE import_audit
        SET records_processed = ?,
            records_imported = ?,
            records_skipped = ?,
            records_failed = ?,
            status = ?,
            error_summary = ?,
            duration_ms = ?,
            completed_at = datetime('now')
        WHERE id = ?
      `).bind(
        waypoints.length,
        imported,
        skipped,
        failed,
        failed === 0 ? "completed" : imported > 0 ? "partial" : "failed",
        JSON.stringify(errors),
        duration,
        auditId
      ).run();
    }
    logger.info("import.waypoints.complete", {
      journeyId,
      imported,
      failed
    });
    return c.json({
      success: failed === 0,
      message: `Imported ${imported} waypoints`,
      stats: {
        processed: waypoints.length,
        imported,
        skipped,
        failed,
        duration
      },
      errors: errors.slice(0, 10)
    });
  } catch (err) {
    logger.error("import.waypoints.error", { error: err.message, stack: err.stack });
    return c.json({
      success: false,
      error: "Import failed",
      message: err.message || String(err)
    }, 500);
  }
});
importRouter.get("/history", async (c) => {
  const db = c.env?.TESLA_DB;
  if (!db) {
    return c.json({ success: false, error: "Database not configured" }, 500);
  }
  try {
    const journeyId = c.req.query("journeyId") || "continental-usa-2025";
    const limit = Math.min(100, parseInt(c.req.query("limit") || "50", 10));
    const results = await db.prepare(`
      SELECT id, journey_id, import_type, import_source, filename,
             records_processed, records_imported, records_skipped, records_failed,
             status, duration_ms, started_at, completed_at
      FROM import_audit
      WHERE journey_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `).bind(journeyId, limit).all();
    return c.json({
      success: true,
      imports: results.results || [],
      count: (results.results || []).length
    });
  } catch (err) {
    logger.error("import.history.error", { error: err.message });
    return c.json({
      success: false,
      error: "Failed to fetch import history",
      message: err.message || String(err)
    }, 500);
  }
});
async function updateJourneyAggregates(db, journeyId) {
  try {
    const segmentStats = await db.prepare(`
      SELECT
        COUNT(*) as total_segments,
        COALESCE(SUM(distance_miles), 0) as total_miles,
        COALESCE(SUM(energy_used_kwh), 0) as total_energy
      FROM drive_segments
      WHERE journey_id = ?
    `).bind(journeyId).first();
    const energyStats = await db.prepare(`
      SELECT
        COUNT(*) as total_charges,
        COALESCE(SUM(cost_usd), 0) as total_cost
      FROM energy_events
      WHERE journey_id = ? AND event_type = 'charge'
    `).bind(journeyId).first();
    const totalMiles = Number(segmentStats?.total_miles || 0);
    const totalEnergy = Number(segmentStats?.total_energy || 0);
    const efficiency = totalEnergy > 0 ? totalMiles / totalEnergy : 0;
    await db.prepare(`
      UPDATE journeys
      SET total_miles = ?,
          total_drives = ?,
          total_charges = ?,
          total_energy_used_kwh = ?,
          total_cost_usd = ?,
          overall_efficiency_miles_per_kwh = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      totalMiles,
      segmentStats?.total_segments || 0,
      energyStats?.total_charges || 0,
      totalEnergy,
      energyStats?.total_cost || 0,
      efficiency,
      journeyId
    ).run();
    logger.info("journey.aggregates.updated", {
      journeyId,
      totalMiles,
      totalDrives: segmentStats?.total_segments,
      totalCharges: energyStats?.total_charges
    });
  } catch (err) {
    logger.error("journey.aggregates.error", { journeyId, error: err.message });
  }
}
__name(updateJourneyAggregates, "updateJourneyAggregates");
var app = new Hono2();
app.use("*", corsMiddleware);
app.use("*", securityHeaders);
app.use("*", requestLogger);
app.use("*", analyticsLogger);
app.use("*", rateLimit);
app.use("*", errorHandler2);
app.options("*", (c) => c.body(null, 204));
var LAT_SAMPLES_MAX = 200;
var latencySamples = [];
function recordLatency(ms) {
  latencySamples.push(ms);
  if (latencySamples.length > LAT_SAMPLES_MAX) latencySamples.shift();
}
__name(recordLatency, "recordLatency");
function snapshotLatency() {
  if (!latencySamples.length) return { count: 0, p50: 0, p95: 0 };
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const p = /* @__PURE__ */ __name((q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))], "p");
  return { count: sorted.length, p50: p(0.5), p95: p(0.95) };
}
__name(snapshotLatency, "snapshotLatency");
try {
  globalThis.__LAT_SNAPSHOT__ = snapshotLatency;
} catch {
}
app.use("*", async (c, next) => {
  const start = performance.now();
  await next();
  const ms = Math.round(performance.now() - start);
  recordLatency(ms);
  c.executionCtx?.waitUntil?.(Promise.resolve());
});
var adminAuth = /* @__PURE__ */ __name(async (c, next) => {
  const secret = String(c.env?.ADMIN_TOKEN || "").trim();
  const prev = String(c.env?.ADMIN_TOKEN_PREVIOUS || "").trim();
  const jwtCur = String(c.env?.JWT_SECRET || "").trim();
  const jwtPrev = String(c.env?.JWT_SECRET_PREVIOUS || "").trim();
  if (!secret && !prev && !jwtCur && !jwtPrev) return next();
  const authz = c.req.header("Authorization") || "";
  if (!authz.startsWith("Bearer ")) {
    return c.json({ ok: false, error: "Missing bearer token" }, 401);
  }
  const token = authz.slice(7).trim();
  if (secret && token === secret || prev && token === prev) {
    await next();
    return;
  }
  const jwtSecrets = [jwtCur, jwtPrev].filter(Boolean);
  if (jwtSecrets.length) {
    const verified = await verifyJwtHS256(token, jwtSecrets);
    if (verified.ok) {
      const p = verified.payload;
      const isAdmin = p?.admin === true || p?.role === "admin" || typeof p?.scope === "string" && p.scope.split(/\s+/).includes("admin");
      if (isAdmin) {
        await next();
        return;
      }
    }
  }
  return c.json({ ok: false, error: "Invalid token" }, 403);
}, "adminAuth");
app.route("/api/v1/health", healthRouter);
app.route("/api/v1/telemetry", telemetryRouter);
app.route("/api/v1/unified-data", unifiedDataRouter);
app.route("/api/v1/trip-status", tripStatusRouter);
app.route("/api/v1/component", componentRouter);
app.route("/api/v1/analytics", analyticsRouter);
app.route("/api/v1/vehicle", vehicleRouter);
app.route("/api/v1", aiRouter);
app.route("/api/v1/meta", metaRouter);
app.route("/api/v1/journeys", journeysRouter);
app.route("/api/v1/places", placesRouter);
app.route("/api/v1/auth", authRouter);
app.route("/api/v1/mfa", mfaRouter);
app.route("/api/v1/push", pushRouter);
app.route("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/admin/*", adminAuth);
app.route("/api/v1/admin", adminRouter);
app.use("/api/v1/import/*", adminAuth);
app.route("/api/v1/import", importRouter);
app.get("/health", async (c) => c.json({ ok: true, status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() }));
app.get("/unified-data", async (c) => c.redirect("/api/v1/unified-data", 308));
app.get("/trip-status", async (c) => c.redirect("/api/v1/trip-status", 308));
app.get("/api/v1/trip/status", async (c) => c.redirect("/api/v1/trip-status", 308));
app.get("/api/v1/config", async (c) => {
  const mode = c.env?.PLATFORM_MODE || "live";
  const url = new URL(c.req.url);
  const apiBaseUrl = `${url.protocol}//${url.host}`;
  const mapboxToken = c.env?.MAPBOX_API_TOKEN || null;
  return c.json({
    appName: "A Whittle Wandering",
    apiVersion: "3.0.0",
    mode,
    apiBaseUrl,
    // Backward/forward compatibility:
    // - Older frontend(s) read `mapboxToken`
    // - Newer frontend dynamic config expects `mapboxAccessToken`
    mapboxToken,
    mapboxAccessToken: mapboxToken,
    features: {
      liveTeslaData: !!(c.env?.TESSIE_API_TOKEN || c.env?.TESSIE_API_KEY),
      mapIntegration: !!mapboxToken,
      realtimeUpdates: true
    },
    updateInterval: mode === "live" ? 3e4 : 45e3
  });
});
app.get("/api/connectors", async (c) => {
  return c.json({
    connectors: [
      { id: "okta", name: "Okta", status: "stubbed" },
      { id: "azuread", name: "Azure AD", status: "stubbed" },
      { id: "google", name: "Google Workspace", status: "stubbed" }
    ]
  });
});
app.get("/", async (c) => {
  return c.json({
    service: "A Whittle Wandering",
    version: "3.0.0",
    platformMode: c.env?.PLATFORM_MODE || "live",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    endpoints: {
      health: "/api/v1/health",
      telemetry: "/api/v1/telemetry",
      unifiedData: "/api/v1/unified-data",
      tripStatus: "/api/v1/trip-status",
      admin: "/api/v1/admin",
      config: "/api/v1/config"
    },
    legacy: {
      "/health": "Redirects to simple health check",
      "/unified-data": "Redirects to /api/v1/unified-data",
      "/trip-status": "Redirects to /api/v1/trip-status"
    }
  });
});
app.post("/api/joiner", async (c) => {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  let userId;
  try {
    userId = "demo-" + crypto.randomUUID();
  } catch {
    userId = "demo-fallback-" + Date.now().toString(36);
  }
  const log2 = [
    { step: "create_user", status: "ok", userId, timestamp: now },
    { step: "provision_stub", status: "ok", userId, timestamp: now },
    { step: "assign_role", status: "ok", userId, role: "joiner", timestamp: now },
    { step: "done", status: "success", userId, timestamp: now }
  ];
  return c.json({ ok: true, userId, log: log2 });
});
var index_default = app;
var scheduled = /* @__PURE__ */ __name(async (event, env, ctx) => {
  const cron = event.cron;
  const jobs = buildJobs(env);
  const mapping = {
    "*/15 6-23 * * *": [{ name: "quick_state_update", description: "Quick vehicle state update" }],
    "*/30 * * * *": [{ name: "full_sync", description: "Comprehensive data sync" }],
    "0 2 * * *": [{ name: "historical_backfill", description: "Historical data backfill" }],
    "5 * * * *": [{ name: "data_quality_check", description: "Data quality validation" }],
    "10 */6 * * *": [{ name: "ai_data_processing", description: "AI/ML aggregation processing" }]
  };
  const selected = mapping[cron];
  if (!selected) {
    logger.debug("Cron noop", { cron });
    return;
  }
  logger.info("Cron start", { cron, jobCount: selected.length });
  ctx.waitUntil((async () => {
    for (const item of selected) {
      await recordRun(env, cron, item.name, async () => {
        await jobs[item.name]();
      });
    }
    logger.info("Cron end", { cron });
  })());
}, "scheduled");
export {
  index_default as default,
  scheduled
};
//# sourceMappingURL=index.js.map
