import { useMemo, useRef, useState, type KeyboardEvent, type RefObject } from "react";

import { catalogId, type ProfessionId } from "../../domain";
import type { AppCatalogViews, PlaceholderIconDescriptor } from "../catalogs";
import type { RawTemplateOverlayEntry } from "../editor-state";
import { CatalogIcon } from "./CatalogIcon";

interface ProfessionOption {
  readonly key: string;
  readonly label: string;
  readonly professionId: ProfessionId | null;
  readonly descriptor: PlaceholderIconDescriptor;
}

export function ProfessionIconPicker({
  label,
  value,
  raw,
  resetKey,
  catalogs,
  onChange
}: {
  readonly label: "Primary" | "Secondary";
  readonly value: ProfessionId | null;
  readonly raw: RawTemplateOverlayEntry | null;
  readonly resetKey?: string | number;
  readonly catalogs: AppCatalogViews;
  readonly onChange: (professionId: ProfessionId | null) => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const menuId = `${label.toLocaleLowerCase("en-US")}-profession-picker`;
  const options = useMemo(() => professionOptions(catalogs), [catalogs]);
  const selected = selectedOption(options, value);
  const rawUnresolved = raw !== null && !["known", "none", "empty"].includes(raw.outcomeKind);
  const selectionKey = pickerSelectionKey(label, value, raw, resetKey);
  const open = openKey === selectionKey;
  const displayLabel =
    rawUnresolved && value === null
      ? `Unresolved ${raw.label}`
      : (selected?.label ?? `Unresolved profession ${Number(value)}`);

  return (
    <div className="profession-picker" data-state={rawUnresolved ? "unresolved" : "resolved"}>
      <label className="sr-only">
        <span>{label}</span>
        <select
          aria-label={label}
          tabIndex={-1}
          value={value === null ? "" : Number(value)}
          onChange={(event) =>
            onChange(
              event.currentTarget.value.length === 0
                ? null
                : catalogId<"Profession">(Number(event.currentTarget.value))
            )
          }
        >
          <option value="">Any</option>
          {catalogs.professions.map((profession) => (
            <option key={Number(profession.id)} value={Number(profession.id)}>
              {profession.name}
            </option>
          ))}
        </select>
      </label>
      <button
        ref={buttonRef}
        type="button"
        className="profession-picker-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${label} profession: ${displayLabel}`}
        title={`${label} profession: ${displayLabel}`}
        onClick={() => setOpenKey(open ? null : selectionKey)}
        onKeyDown={(event) => handleButtonKeyDown(event, listRef, () => setOpenKey(selectionKey))}
      >
        <CatalogIcon descriptor={selected?.descriptor ?? catalogs.placeholders.profession(null)} />
      </button>
      {rawUnresolved ? (
        <p className="picker-evidence">{raw.reason ?? `Imported ${raw.outcomeKind} profession`}</p>
      ) : null}
      {open ? (
        <div
          id={menuId}
          ref={listRef}
          className="profession-option-grid"
          role="listbox"
          aria-label={`${label} profession options`}
          onKeyDown={(event) => handleListKeyDown(event, buttonRef, () => setOpenKey(null))}
        >
          {options.map((option) => (
            <button
              key={option.key}
              type="button"
              role="option"
              aria-selected={sameProfession(option.professionId, value)}
              className={sameProfession(option.professionId, value) ? "selected-option" : ""}
              onClick={() => {
                onChange(option.professionId);
                setOpenKey(null);
                buttonRef.current?.focus();
              }}
            >
              <CatalogIcon descriptor={option.descriptor} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function professionOptions(catalogs: AppCatalogViews): readonly ProfessionOption[] {
  return [
    {
      key: "any",
      label: "Any",
      professionId: null,
      descriptor: {
        surface: "profession-selector",
        label: "Any profession",
        initials: "Any",
        mediaId: null,
        asset: null
      }
    },
    ...catalogs.professions.map((profession) => ({
      key: `profession:${Number(profession.id)}`,
      label: profession.name,
      professionId: profession.id,
      descriptor: catalogs.placeholders.profession(profession)
    }))
  ];
}

function selectedOption(
  options: readonly ProfessionOption[],
  value: ProfessionId | null
): ProfessionOption | null {
  return options.find((option) => sameProfession(option.professionId, value)) ?? null;
}

function sameProfession(left: ProfessionId | null, right: ProfessionId | null): boolean {
  return left === null ? right === null : right !== null && Number(left) === Number(right);
}

function pickerSelectionKey(
  label: "Primary" | "Secondary",
  value: ProfessionId | null,
  raw: RawTemplateOverlayEntry | null,
  resetKey: string | number | undefined
): string {
  const rawKey =
    raw === null ? "raw:none" : `raw:${raw.namespace}:${raw.templateId}:${raw.outcomeKind}`;
  return `${resetKey ?? "standalone"}:${label}:${value === null ? "any" : Number(value)}:${rawKey}`;
}

function handleButtonKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  listRef: RefObject<HTMLDivElement | null>,
  openList: () => void
): void {
  if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openList();
    window.setTimeout(() => focusOption(listRef.current, 0), 0);
  }
}

function handleListKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  buttonRef: RefObject<HTMLButtonElement | null>,
  closeList: () => void
): void {
  if (event.key === "Escape") {
    event.preventDefault();
    closeList();
    buttonRef.current?.focus();
    return;
  }
  if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) {
    return;
  }
  event.preventDefault();
  const options = focusableOptions(event.currentTarget);
  const currentIndex = Math.max(
    0,
    options.findIndex((option) => option === document.activeElement)
  );
  const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  options[nextIndex]?.focus();
}

function focusOption(root: HTMLDivElement | null, index: number): void {
  focusableOptions(root)[index]?.focus();
}

function focusableOptions(root: HTMLDivElement | null): readonly HTMLButtonElement[] {
  if (root === null) {
    return [];
  }
  return Array.from(root.querySelectorAll<HTMLButtonElement>("button[role='option']"));
}
