/** Bounded JSON tokenizer; JSON.parse alone would silently overwrite duplicate keys. */
export class GuideJsonError extends Error {
  constructor(
    readonly reason: "invalid-json" | "duplicate-key" | "dangerous-key",
    offset: number
  ) {
    super(`Invalid or ambiguous JSON at offset ${offset}.`);
  }
}
export function parseGuideJson(source: string, limits = { depth: 32, tokens: 100000 }): unknown {
  let i = 0;
  let tokens = 0;
  const fail = (reason: GuideJsonError["reason"] = "invalid-json"): never => {
    throw new GuideJsonError(reason, i);
  };
  const white = () => {
    while (/\s/.test(source[i] ?? "") && i < source.length) i++;
  };
  const string = (): string => {
    if (source[i] !== '"') return fail();
    const start = i++;
    while (i < source.length) {
      if (source[i] === "\\") {
        i += 2;
        continue;
      }
      if (source[i++] === '"') return JSON.parse(source.slice(start, i)) as string;
    }
    return fail();
  };
  const value = (depth: number): void => {
    if (depth > limits.depth || ++tokens > limits.tokens) return fail();
    white();
    const c = source[i];
    if (c === '"') {
      string();
      return;
    }
    if (c === "{" || c === "[") {
      i++;
      white();
      const close = c === "{" ? "}" : "]";
      const keys = new Set<string>();
      if (source[i] === close) {
        i++;
        return;
      }
      while (i < source.length) {
        white();
        if (c === "{") {
          const key = string();
          if (["__proto__", "prototype", "constructor"].includes(key)) return fail("dangerous-key");
          if (keys.has(key)) return fail("duplicate-key");
          keys.add(key);
          white();
          if (source[i++] !== ":") return fail();
        }
        value(depth + 1);
        white();
        if (source[i] === close) {
          i++;
          return;
        }
        if (source[i++] !== ",") return fail();
      }
      return fail();
    }
    const token = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(
      source.slice(i)
    )?.[0];
    if (
      !token ||
      (token !== "true" && token !== "false" && token !== "null" && !Number.isFinite(Number(token)))
    )
      return fail();
    i += token.length;
  };
  value(0);
  white();
  if (i !== source.length) return fail();
  return JSON.parse(source) as unknown;
}
