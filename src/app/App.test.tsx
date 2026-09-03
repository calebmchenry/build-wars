import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createEmptyEquipmentLoadout, knownEquipmentSelection, type RuneId } from "../domain";
import { SKILL_TEMPLATE_PACKAGE_EXAMPLE } from "../template-compatibility";
import { App } from "./App";
import { validLocalLibraryEnvelopeFixture } from "./library-fixtures";
import { createBackupEnvelope, serializeBackupEnvelope } from "./backup-restore";
import { fixtureCatalogFacts, validSavedRecordFixture } from "./library-fixtures";
import {
  LOCAL_LIBRARY_STORAGE_KEY,
  parseLocalLibraryJson,
  selectedPersistedBuildSnapshot,
  serializeLocalLibraryEnvelope,
  type PersistedWorkingDraft
} from "./persistence-schema";
import { buildShareUrl } from "./share-url";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
});

describe("App", () => {
  it("renders attribution before the catalog-driven editor workspace", () => {
    render(<App />);

    expect(screen.getByRole("main", { name: "Build Wars" })).toHaveAttribute(
      "data-catalog-state",
      "ready"
    );
    expect(screen.getByRole("heading", { name: "Catalog attribution" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skill Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skill Browser" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Validation" })).toBeInTheDocument();

    const attribution = screen.getByRole("heading", { name: "Catalog attribution" });
    const skillBar = screen.getByRole("heading", { name: "Skill Bar" });
    expect(
      attribution.compareDocumentPosition(skillBar) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("keeps skills as the default workspace tab and does not dirty equipment on tab open", () => {
    vi.useFakeTimers();
    render(<App />);

    expect(screen.getByRole("tab", { name: "Skills" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("heading", { name: "Equipment" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Equipment" }));
    act(() => vi.advanceTimersByTime(300));

    expect(screen.getByRole("tab", { name: "Equipment" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Equipment" })).toBeInTheDocument();
    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY) ?? "");
    expect(
      parsed.ok ? draftSnapshot(parsed.envelope.workingDraft)?.build.equipment : "error"
    ).toBeNull();
  });

  it("autosaves semantic equipment after the first armor edit", () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("tab", { name: "Equipment" }));
    fireEvent.focus(screen.getByRole("combobox", { name: "Head rune" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Head rune" }), {
      target: { value: "Rune of Minor Strength" }
    });
    fireEvent.click(screen.getByRole("option", { name: /Rune of Minor Strength/ }));

    act(() => vi.advanceTimersByTime(160));
    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY) ?? "");

    expect(parsed.ok).toBe(true);
    expect(
      parsed.ok
        ? draftSnapshot(parsed.envelope.workingDraft)?.build.equipment?.armor[0]?.rune
        : null
    ).toEqual({ kind: "known", id: 40 });
    expect(parsed.ok ? parsed.envelope.savedDocuments : []).toHaveLength(0);
  });

  it("supports blank-to-playable authoring through visible controls", () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Secondary"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "Healing Signet" } });
    fireEvent.click(screen.getByRole("button", { name: "Place Healing Signet in slot 1" }));

    expect(
      screen.getByRole("button", { name: /Skill slot 1: Healing Signet/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Healing Signet placed in slot 1.")).toBeInTheDocument();
  }, 10_000);

  it("opens the export dialog and shows canonical gate output or reasons", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    const dialog = screen.getByRole("dialog", { name: "Export skill template" });
    expect(within(dialog).getByRole("heading", { name: "Canonical" })).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Wrapper name")).toBeInTheDocument();
  });

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

  it("warns that share URLs omit meaningful equipment from a valid stored draft", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    const equipment = createEmptyEquipmentLoadout();
    localStorage.setItem(
      LOCAL_LIBRARY_STORAGE_KEY,
      serializeLocalLibraryEnvelope({
        ...envelope,
        workingDraft:
          envelope.workingDraft === null
            ? null
            : {
                ...envelope.workingDraft,
                document: {
                  kind: "build",
                  snapshot: {
                    ...draftSnapshot(envelope.workingDraft)!,
                    build: {
                      ...draftSnapshot(envelope.workingDraft)!.build,
                      equipment: {
                        ...equipment,
                        armor: equipment.armor.map((piece) =>
                          piece.slot === "head"
                            ? { ...piece, rune: knownEquipmentSelection(40 as RuneId) }
                            : piece
                        )
                      }
                    }
                  }
                }
              }
      })
    );

    render(<App />);

    expect(screen.getByText("Equipment omitted from skill template sharing")).toBeInTheDocument();
    const shareUrl = screen.getByLabelText("Share URL") as HTMLTextAreaElement;
    expect(shareUrl.value).not.toContain("equipment");
    expect(shareUrl.value).not.toContain("rune");
  });

  it("warns that share URLs omit authored title ranks from a valid stored draft", () => {
    const envelope = validLocalLibraryEnvelopeFixture();
    localStorage.setItem(
      LOCAL_LIBRARY_STORAGE_KEY,
      serializeLocalLibraryEnvelope({
        ...envelope,
        workingDraft:
          envelope.workingDraft === null
            ? null
            : {
                ...envelope.workingDraft,
                document: {
                  kind: "build",
                  snapshot: {
                    ...draftSnapshot(envelope.workingDraft)!,
                    build: {
                      ...draftSnapshot(envelope.workingDraft)!.build,
                      titleRankOverrides: [{ key: "title:lightbringer-rank", rank: 4 }]
                    }
                  }
                }
              }
      })
    );

    render(<App />);

    expect(screen.getByText("Title ranks omitted from skill template sharing")).toBeInTheDocument();
    const shareUrl = screen.getByLabelText("Share URL") as HTMLTextAreaElement;
    expect(shareUrl.value).not.toContain("title");
    expect(shareUrl.value).not.toContain("lightbringer");
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
    expect(screen.getByText("Local storage needs recovery")).toBeInTheDocument();

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
    expect(screen.getByLabelText("PVP")).toBeChecked();
    expect(screen.getByRole("button", { name: "Update" })).toBeDisabled();

    act(() => vi.advanceTimersByTime(160));
    const parsed = parseLocalLibraryJson(localStorage.getItem(LOCAL_LIBRARY_STORAGE_KEY) ?? "");
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

  it("saves, finds, favorites, duplicates, and deletes records from the library panel", () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.change(screen.getByLabelText("Save name"), { target: { value: "Panel Save" } });
    fireEvent.click(screen.getByRole("button", { name: "Save New" }));
    act(() => vi.advanceTimersByTime(1));

    expect(screen.getByRole("heading", { name: "Panel Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Favorite Panel Save" }));
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(screen.getByRole("heading", { name: "Panel Save Copy" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Library search"), { target: { value: "missing" } });
    expect(screen.getByText("No saved builds match")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    fireEvent.click(screen.getAllByRole("button", { name: "Delete" })[0]!);
    const dialog = screen.getByRole("dialog", { name: "Delete saved build" });
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(screen.queryByRole("heading", { name: "Panel Save" })).not.toBeInTheDocument();
  });

  it("uses the dirty guard before loading a saved record from the panel", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const envelope = validLocalLibraryEnvelopeFixture({ workingDraft: null });
    localStorage.setItem(LOCAL_LIBRARY_STORAGE_KEY, serializeLocalLibraryEnvelope(envelope));
    render(<App />);

    fireEvent.change(screen.getByLabelText("Primary"), { target: { value: "1" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Load" })[0]!);

    expect(window.confirm).toHaveBeenCalledWith("Discard unsaved draft changes?");
    expect(screen.getByLabelText("Secondary")).toHaveValue("");
  });

  it("exports selectable backup JSON and restores from a previewed backup", () => {
    const backupText = serializeBackupEnvelope(
      createBackupEnvelope({
        exportedAt: "2026-09-02T19:25:41Z",
        savedBuilds: [validSavedRecordFixture({ name: "Restored Build" })],
        workingDraft: null,
        savedWith: fixtureCatalogFacts
      })
    );
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Backup" }));
    const backupDialog = screen.getByRole("dialog", { name: "Backup local library" });
    expect((screen.getByLabelText("Backup JSON") as HTMLTextAreaElement).value).toContain(
      "build-wars-library-backup"
    );
    fireEvent.click(within(backupDialog).getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    const dialog = screen.getByRole("dialog", { name: "Restore local library" });
    fireEvent.change(within(dialog).getByLabelText("Backup JSON"), {
      target: { value: backupText }
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Preview" }));
    expect(within(dialog).getByText("Restore preview")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply Restore" }));

    expect(screen.getByRole("heading", { name: "Restored Build" })).toBeInTheDocument();
  });
});

function draftSnapshot(draft: PersistedWorkingDraft | null | undefined) {
  return draft === null || draft === undefined
    ? null
    : selectedPersistedBuildSnapshot(draft.document);
}
