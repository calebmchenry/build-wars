import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { App } from "./App";
import { validLocalLibraryEnvelopeFixture } from "./library-fixtures";
import {
  LOCAL_LIBRARY_STORAGE_KEY,
  parseLocalLibraryJson,
  selectedPersistedBuildSnapshot,
  serializeLocalLibraryEnvelope,
  type PersistedWorkingDraft
} from "./persistence-schema";
import { buildShareUrl } from "./share-url";
import { THEME_STORAGE_KEY } from "./theme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

describe("App", { timeout: 10_000 }, () => {
  it("renders the catalog-driven editor workspace", () => {
    render(<App />);

    expect(screen.getByRole("main", { name: "Build Wars" })).toHaveAttribute(
      "data-catalog-state",
      "ready"
    );
    expect(screen.queryByRole("heading", { name: "Catalog attribution" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skill Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skills Catalog" })).toBeInTheDocument();
    expect(screen.queryByText("Secondary tools")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load template" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save template" })).toBeInTheDocument();
  });

  it("applies and persists the selected theme preference", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
  });

  it("supports blank-to-playable authoring through visible controls", () => {
    render(<App />);

    const pvpToggle = screen.getByRole("checkbox", { name: "PvP" });
    expect(pvpToggle).not.toBeChecked();
    fireEvent.click(pvpToggle);
    expect(pvpToggle).toBeChecked();

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Secondary"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Healing Signet" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Healing Signet to slot 1" }));

    expect(
      screen.getByRole("button", { name: /Skill slot 1: Healing Signet/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Healing Signet placed in slot 1.")).toBeInTheDocument();
  }, 10_000);

  it("restores a valid working draft from local storage on boot", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    localStorage.setItem(LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope(envelope));

    render(<App />);

    expect(screen.getByLabelText("Primary")).toHaveValue("1");
    expect(screen.getByLabelText("Secondary")).toHaveValue("2");
    expect(
      screen.getByRole("button", { name: /Skill slot 1: Healing Signet/ })
    ).toBeInTheDocument();
  });

  it("coalesces draft autosave without creating a saved library record", () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Secondary"), { target: { value: "2" } });
    act(() => vi.advanceTimersByTime(160));

    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY) ?? "");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(draftSnapshot(parsed.envelope.workingDraft)?.build.primaryProfessionId).toBe(1);
    expect(draftSnapshot(parsed.envelope.workingDraft)?.build.secondaryProfessionId).toBe(2);
    expect(parsed.envelope.savedDocuments).toHaveLength(0);
  });

  it("does not overwrite corrupt local data through autosave", () => {
    vi.useFakeTimers();
    localStorage.setItem(LOCAL_LIBRARY_STORAGE_KEY, "{not-json");

    render(<App />);
    expect(screen.getByText("Storage needs recovery")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    act(() => vi.advanceTimersByTime(200));

    expect(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)).toBe("{not-json");
  });

  it("cleans up Strict Mode autosave effects instead of double-writing the same draft", () => {
    vi.useFakeTimers();
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    act(() => vi.advanceTimersByTime(160));

    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY) ?? "");
    expect(parsed.ok ? parsed.envelope.revision : null).toBe(1);
  });

  it("attempts a best-effort pagehide flush for pending draft changes", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    window.dispatchEvent(new Event("pagehide"));

    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY) ?? "");
    expect(
      parsed.ok ? draftSnapshot(parsed.envelope.workingDraft)?.build.primaryProfessionId : null
    ).toBe(1);
  });

  it("imports a valid share URL into an unassociated draft and consumes the fragment", () => {
    vi.useFakeTimers();
    const shared = buildShareUrl({
      baseUrl: window.location.href,
      bareCode: SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      mode: "pvp"
    });
    if (!shared.ok) {
      throw new Error(shared.error.message);
    }
    window.history.replaceState(null, "", shared.value);

    render(<App />);

    expect(window.location.hash).toBe("");
    expect(screen.getByLabelText("Primary")).toHaveValue("7");

    act(() => vi.advanceTimersByTime(160));
    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY) ?? "");
    expect(parsed.ok ? draftSnapshot(parsed.envelope.workingDraft)?.build.mode : null).toBe("pvp");
    expect(parsed.ok ? parsed.envelope.workingDraft?.associatedRecordId : "error").toBeNull();
    expect(parsed.ok ? parsed.envelope.savedDocuments : []).toHaveLength(0);
  });

  it("preserves a stored draft when a share URL opens over it until explicitly accepted", () => {
    vi.useFakeTimers();
    const stored = validLocalLibraryEnvelopeFixture();
    localStorage.setItem(LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope(stored));
    const before = localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY);
    const shared = buildShareUrl({
      baseUrl: window.location.href,
      bareCode: SKILL_TEMPLATE_PACKAGE_EXAMPLE,
      mode: "pvp"
    });
    if (!shared.ok) {
      throw new Error(shared.error.message);
    }
    window.history.replaceState(null, "", shared.value);

    render(<App />);

    expect(screen.getByText("Shared draft is not replacing stored draft")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(300));
    expect(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY)).toBe(before);

    fireEvent.click(screen.getByRole("button", { name: "Use as Draft" }));
    act(() => vi.advanceTimersByTime(1));
    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY) ?? "");
    expect(parsed.ok ? draftSnapshot(parsed.envelope.workingDraft)?.build.mode : null).toBe("pvp");
  });
});

function draftSnapshot(draft: PersistedWorkingDraft | null | undefined) {
  return draft === null || draft === undefined
    ? null
    : selectedPersistedBuildSnapshot(draft.document);
}
