import { describe, expect, it } from "vitest";

import {
  THEME_STORAGE_KEY,
  parseThemePreference,
  readThemePreference,
  resolveThemePreference,
  writeThemePreference,
  type ThemeStoragePort
} from "./theme";

describe("theme preference", () => {
  it("parses unsupported values as system", () => {
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference("sepia")).toBe("system");
    expect(parseThemePreference(null)).toBe("system");
  });

  it("resolves system preference from media state", () => {
    expect(resolveThemePreference("system", true)).toBe("dark");
    expect(resolveThemePreference("system", false)).toBe("light");
    expect(resolveThemePreference("dark", false)).toBe("dark");
    expect(resolveThemePreference("light", true)).toBe("light");
  });

  it("reads and writes theme preference best-effort", () => {
    const storage = memoryStorage();
    writeThemePreference("dark", storage);

    expect(storage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(readThemePreference(storage)).toBe("dark");
  });
});

function memoryStorage(): ThemeStoragePort {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}
