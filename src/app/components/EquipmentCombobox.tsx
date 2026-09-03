import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import {
  EQUIPMENT_PICKER_RESULT_LIMIT,
  type EquipmentSelectOption,
  type EquipmentSelectedValueView
} from "../equipment-selectors";

export function EquipmentCombobox<Id>({
  label,
  selected,
  options,
  disabled = false,
  disabledReason = null,
  clearLabel,
  onSelect,
  onClear
}: {
  readonly label: string;
  readonly selected: EquipmentSelectedValueView;
  readonly options: readonly EquipmentSelectOption<Id>[];
  readonly disabled?: boolean;
  readonly disabledReason?: string | null;
  readonly clearLabel: string;
  readonly onSelect: (selection: EquipmentSelectOption<Id>["selection"]) => void;
  readonly onClear: () => void;
}) {
  const inputId = useId();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [composing, setComposing] = useState(false);
  const filtered = useMemo(() => filterOptions(options, query), [options, query]);
  const rendered = filtered.slice(0, EQUIPMENT_PICKER_RESULT_LIMIT);
  const safeActiveIndex = enabledIndexOrFallback(rendered, activeIndex);
  const activeOption = rendered[safeActiveIndex] ?? null;

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const restoreFocus = () => {
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const openWithQuery = (nextQuery: string) => {
    const nextRendered = filterOptions(options, nextQuery).slice(0, EQUIPMENT_PICKER_RESULT_LIMIT);
    setQuery(nextQuery);
    setActiveIndex(firstEnabledIndex(nextRendered));
    setOpen(true);
  };

  return (
    <div
      ref={rootRef}
      className={`equipment-combobox ${disabled ? "disabled" : ""}`}
      data-selected-state={selected.state}
    >
      <label htmlFor={inputId}>
        <span>{label}</span>
      </label>
      <div className="equipment-combobox-input-row">
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeOption !== null ? optionElementId(listboxId, activeOption.id) : undefined
          }
          value={open ? query : selected.label}
          disabled={disabled}
          placeholder={selected.label}
          onFocus={() => {
            if (!disabled) {
              openWithQuery("");
            }
          }}
          onClick={() => {
            if (!disabled) {
              openWithQuery("");
            }
          }}
          onChange={(event) => {
            openWithQuery(event.currentTarget.value);
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(event) => {
            if (composing) {
              return;
            }
            handleKeyDown(event, rendered, safeActiveIndex, {
              open,
              setOpen,
              setActiveIndex,
              select: (option) => {
                onSelect(option.selection);
                setOpen(false);
                setQuery("");
                restoreFocus();
              },
              close: () => {
                setOpen(false);
                setQuery("");
              }
            });
          }}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={clearLabel}
          disabled={disabled || selected.state === "empty"}
          onClick={() => {
            onClear();
            setOpen(false);
            setQuery("");
            restoreFocus();
          }}
        >
          x
        </button>
      </div>
      {selected.detail === null ? null : <p className="selected-detail">{selected.detail}</p>}
      {disabled && disabledReason !== null ? (
        <p className="selected-detail">{disabledReason}</p>
      ) : null}
      {open ? (
        <div id={listboxId} className="equipment-options" role="listbox" aria-label={label}>
          {rendered.length === 0 ? (
            <div className="equipment-option empty-option">No results</div>
          ) : (
            rendered.map((option, index) => (
              <button
                id={optionElementId(listboxId, option.id)}
                key={option.id}
                type="button"
                role="option"
                aria-selected={
                  selected.catalogId !== null && option.id === `known:${selected.catalogId}`
                }
                className={
                  index === safeActiveIndex ? "equipment-option active" : "equipment-option"
                }
                disabled={option.disabled}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => {
                  if (option.disabled) {
                    return;
                  }
                  onSelect(option.selection);
                  setOpen(false);
                  setQuery("");
                  restoreFocus();
                }}
              >
                <span>{option.label}</span>
                {option.detail === null ? null : <small>{option.detail}</small>}
                {option.disabledReason === null ? null : <small>{option.disabledReason}</small>}
                {option.retained ? <small>Retained authored value</small> : null}
              </button>
            ))
          )}
          {filtered.length > rendered.length ? (
            <div className="equipment-option result-limit-note">
              Showing first {rendered.length} of {filtered.length}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function filterOptions<Id>(
  options: readonly EquipmentSelectOption<Id>[],
  query: string
): readonly EquipmentSelectOption<Id>[] {
  const normalized = normalize(query);
  if (normalized.length === 0) {
    return options;
  }
  return options.filter((option) =>
    [option.label, option.detail ?? "", option.disabledReason ?? ""]
      .map(normalize)
      .some((value) => value.includes(normalized))
  );
}

function handleKeyDown<Id>(
  event: KeyboardEvent<HTMLInputElement>,
  options: readonly EquipmentSelectOption<Id>[],
  activeIndex: number,
  handlers: {
    readonly open: boolean;
    readonly setOpen: (open: boolean) => void;
    readonly setActiveIndex: (index: number) => void;
    readonly select: (option: EquipmentSelectOption<Id>) => void;
    readonly close: () => void;
  }
): void {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    handlers.setOpen(true);
    handlers.setActiveIndex(nextEnabledIndex(options, activeIndex, 1));
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    handlers.setOpen(true);
    handlers.setActiveIndex(nextEnabledIndex(options, activeIndex, -1));
    return;
  }
  if (event.key === "Home") {
    event.preventDefault();
    handlers.setActiveIndex(firstEnabledIndex(options));
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    handlers.setActiveIndex(lastEnabledIndex(options));
    return;
  }
  if (event.key === "Enter") {
    const option = options[activeIndex] ?? null;
    if (handlers.open && option !== null && !option.disabled) {
      event.preventDefault();
      handlers.select(option);
    }
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    handlers.close();
  }
}

function firstEnabledIndex<Id>(options: readonly EquipmentSelectOption<Id>[]): number {
  const index = options.findIndex((option) => !option.disabled);
  return index < 0 ? 0 : index;
}

function lastEnabledIndex<Id>(options: readonly EquipmentSelectOption<Id>[]): number {
  for (let index = options.length - 1; index >= 0; index -= 1) {
    if (!options[index]?.disabled) {
      return index;
    }
  }
  return 0;
}

function enabledIndexOrFallback<Id>(
  options: readonly EquipmentSelectOption<Id>[],
  index: number
): number {
  if (options[index] !== undefined && !options[index].disabled) {
    return index;
  }
  return firstEnabledIndex(options);
}

function nextEnabledIndex<Id>(
  options: readonly EquipmentSelectOption<Id>[],
  current: number,
  direction: 1 | -1
): number {
  if (options.length === 0) {
    return 0;
  }
  for (let offset = 1; offset <= options.length; offset += 1) {
    const index = (current + offset * direction + options.length) % options.length;
    if (!options[index]?.disabled) {
      return index;
    }
  }
  return current;
}

function optionElementId(listboxId: string, optionId: string): string {
  return `${listboxId}-${optionId.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}
