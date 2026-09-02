import {
  SKILL_BAR_SLOT_COUNT,
  authoredDocumentId,
  catalogId,
  type AttributeId,
  type Build,
  type GameMode,
  type ProfessionId,
  type SkillBar,
  type SkillId,
  type TemplateSourceEnvelope
} from "../domain";

export type RawOverlayNamespace = "profession" | "attribute" | "skill";
export type RawOverlayOutcomeKind =
  "none" | "empty" | "known" | "reserved" | "unsupported" | "dispositioned" | "unknown";

export interface RawTemplateOverlayEntry {
  readonly namespace: RawOverlayNamespace;
  readonly templateId: number;
  readonly catalogId: number | null;
  readonly outcomeKind: RawOverlayOutcomeKind;
  readonly label: string;
  readonly reason: string | null;
}

export type RawSkillBarOverlay = readonly [
  RawTemplateOverlayEntry | null,
  RawTemplateOverlayEntry | null,
  RawTemplateOverlayEntry | null,
  RawTemplateOverlayEntry | null,
  RawTemplateOverlayEntry | null,
  RawTemplateOverlayEntry | null,
  RawTemplateOverlayEntry | null,
  RawTemplateOverlayEntry | null
];

export interface RawTemplateOverlay {
  readonly source: TemplateSourceEnvelope | null;
  readonly templateName: string | null;
  readonly primaryProfession: RawTemplateOverlayEntry | null;
  readonly secondaryProfession: RawTemplateOverlayEntry | null;
  readonly attributes: readonly (RawTemplateOverlayEntry | null)[];
  readonly skillBar: RawSkillBarOverlay;
}

export type AttributeQuestBonusPolicy = "none" | "maximum-applicable";

export interface PveBudgetState {
  readonly level: number;
  readonly questBonus: AttributeQuestBonusPolicy;
}

export type ResourceFilterKind = "energy" | "adrenaline" | "sacrifice" | "upkeep" | "overcast";

export type ResourceFilterValue = "any" | "explicit" | "zero" | "number" | "percentage" | "special";

export type BrowserProfessionScope =
  | {
      readonly kind: "default";
    }
  | {
      readonly kind: "all";
    }
  | {
      readonly kind: "profession";
      readonly professionId: ProfessionId;
    };

export type BrowserEliteFilter = "any" | "elite" | "non-elite";
export type BrowserAvailabilityFilter = "default" | "both" | "pve-only" | "pvp-only" | "unknown";
export type BrowserSortMode = "attribute" | "name" | "type";
export type BrowserViewMode = "list" | "small-grid" | "large-grid";

export interface BrowserFilters {
  readonly query: string;
  readonly professionScope: BrowserProfessionScope;
  readonly attributeId: AttributeId | null;
  readonly skillType: string | null;
  readonly elite: BrowserEliteFilter;
  readonly availability: BrowserAvailabilityFilter;
  readonly resources: Readonly<Record<ResourceFilterKind, ResourceFilterValue>>;
  readonly sortMode: BrowserSortMode;
}

export interface BrowserState {
  readonly filters: BrowserFilters;
  readonly viewMode: BrowserViewMode;
  readonly batchSize: number;
}

export type DialogKind = "import" | "export";

export interface DialogState {
  readonly open: DialogKind | null;
  readonly importInput: string;
  readonly exportName: string | null;
}

export interface TooltipState {
  readonly skillId: SkillId | null;
  readonly pinned: boolean;
}

export type DragState =
  | {
      readonly kind: "browser-skill";
      readonly skillId: SkillId;
    }
  | {
      readonly kind: "skill-slot";
      readonly slotIndex: number;
    }
  | null;

export type KeyboardPlacementState =
  | {
      readonly kind: "browser-skill";
      readonly skillId: SkillId;
    }
  | {
      readonly kind: "skill-slot";
      readonly slotIndex: number;
    }
  | null;

export interface TransientMessage {
  readonly id: number;
  readonly tone: "info" | "success" | "warning" | "error";
  readonly text: string;
}

export interface EditorState {
  readonly build: Build;
  readonly pveBudget: PveBudgetState;
  readonly rawTemplate: RawTemplateOverlay;
  readonly browser: BrowserState;
  readonly dialogs: DialogState;
  readonly tooltip: TooltipState;
  readonly selectedSlotIndex: number | null;
  readonly drag: DragState;
  readonly keyboardPlacement: KeyboardPlacementState;
  readonly transient: TransientMessage | null;
  readonly nextMessageId: number;
}

export const DEFAULT_BROWSER_BATCH_SIZE = 48;
export const BROWSER_BATCH_INCREMENT = 48;

const EMPTY_RESOURCE_FILTERS: Readonly<Record<ResourceFilterKind, ResourceFilterValue>> = {
  energy: "any",
  adrenaline: "any",
  sacrifice: "any",
  upkeep: "any",
  overcast: "any"
};

export type EditorAction =
  | {
      readonly type: "replace-state";
      readonly state: EditorState;
    }
  | {
      readonly type: "set-profession";
      readonly field: "primary" | "secondary";
      readonly professionId: ProfessionId | null;
    }
  | {
      readonly type: "set-mode";
      readonly mode: GameMode;
    }
  | {
      readonly type: "set-pve-budget";
      readonly level?: number;
      readonly questBonus?: AttributeQuestBonusPolicy;
    }
  | {
      readonly type: "set-attribute-rank";
      readonly attributeId: AttributeId;
      readonly rank: number;
    }
  | {
      readonly type: "set-attribute-row";
      readonly index: number;
      readonly attributeId: AttributeId;
      readonly rank: number;
    }
  | {
      readonly type: "remove-attribute-row";
      readonly index: number;
    }
  | {
      readonly type: "place-skill";
      readonly slotIndex: number;
      readonly skillId: SkillId;
    }
  | {
      readonly type: "move-skill-slot";
      readonly fromIndex: number;
      readonly toIndex: number;
    }
  | {
      readonly type: "swap-skill-slots";
      readonly leftIndex: number;
      readonly rightIndex: number;
    }
  | {
      readonly type: "clear-skill-slot";
      readonly slotIndex: number;
    }
  | {
      readonly type: "select-slot";
      readonly slotIndex: number | null;
    }
  | {
      readonly type: "set-browser-filters";
      readonly filters: Partial<BrowserFilters>;
    }
  | {
      readonly type: "set-resource-filter";
      readonly resource: ResourceFilterKind;
      readonly value: ResourceFilterValue;
    }
  | {
      readonly type: "set-browser-view";
      readonly viewMode: BrowserViewMode;
    }
  | {
      readonly type: "show-more-browser-results";
    }
  | {
      readonly type: "clear-browser-filters";
    }
  | {
      readonly type: "open-dialog";
      readonly dialog: DialogKind;
    }
  | {
      readonly type: "close-dialog";
    }
  | {
      readonly type: "set-import-input";
      readonly input: string;
    }
  | {
      readonly type: "set-export-name";
      readonly name: string | null;
    }
  | {
      readonly type: "set-tooltip";
      readonly skillId: SkillId | null;
      readonly pinned?: boolean;
    }
  | {
      readonly type: "start-drag";
      readonly drag: DragState;
    }
  | {
      readonly type: "cancel-drag";
    }
  | {
      readonly type: "pick-keyboard";
      readonly placement: KeyboardPlacementState;
    }
  | {
      readonly type: "place-keyboard";
      readonly slotIndex: number;
    }
  | {
      readonly type: "cancel-keyboard";
    }
  | {
      readonly type: "set-message";
      readonly tone: TransientMessage["tone"];
      readonly text: string;
    }
  | {
      readonly type: "clear-message";
    };

export function createBlankEditorState(name = "Untitled Build"): EditorState {
  return {
    build: createBlankBuild(name),
    pveBudget: {
      level: 20,
      questBonus: "maximum-applicable"
    },
    rawTemplate: emptyRawTemplateOverlay(),
    browser: {
      filters: createDefaultBrowserFilters(),
      viewMode: "list",
      batchSize: DEFAULT_BROWSER_BATCH_SIZE
    },
    dialogs: {
      open: null,
      importInput: "",
      exportName: null
    },
    tooltip: {
      skillId: null,
      pinned: false
    },
    selectedSlotIndex: null,
    drag: null,
    keyboardPlacement: null,
    transient: null,
    nextMessageId: 1
  };
}

export function createBlankBuild(name = "Untitled Build"): Build {
  return {
    schemaVersion: 1,
    catalogVersion: null,
    id: authoredDocumentId("build:single-character-editor"),
    name,
    mode: "pve",
    primaryProfessionId: null,
    secondaryProfessionId: null,
    attributes: [],
    skillBar: emptySkillBar(),
    equipment: null
  };
}

export function createDefaultBrowserFilters(): BrowserFilters {
  return {
    query: "",
    professionScope: { kind: "default" },
    attributeId: null,
    skillType: null,
    elite: "any",
    availability: "default",
    resources: EMPTY_RESOURCE_FILTERS,
    sortMode: "attribute"
  };
}

export function emptyRawTemplateOverlay(): RawTemplateOverlay {
  return {
    source: null,
    templateName: null,
    primaryProfession: null,
    secondaryProfession: null,
    attributes: [],
    skillBar: emptyRawSkillBarOverlay()
  };
}

export function emptySkillBar(): SkillBar {
  return [null, null, null, null, null, null, null, null];
}

export function emptyRawSkillBarOverlay(): RawSkillBarOverlay {
  return [null, null, null, null, null, null, null, null];
}

export function createRawOverlayEntry(input: {
  readonly namespace: RawOverlayNamespace;
  readonly templateId: number;
  readonly catalogId: number | null;
  readonly outcomeKind: RawOverlayOutcomeKind;
  readonly label: string;
  readonly reason?: string | null;
}): RawTemplateOverlayEntry {
  return {
    namespace: input.namespace,
    templateId: input.templateId,
    catalogId: input.catalogId,
    outcomeKind: input.outcomeKind,
    label: input.label,
    reason: input.reason ?? null
  };
}

export function unresolvedAttributeIdForIndex(index: number): AttributeId {
  return catalogId<"Attribute">(-100_000 - index);
}

export function unresolvedSkillIdForIndex(index: number): SkillId {
  return catalogId<"Skill">(-200_000 - index);
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "replace-state":
      return action.state;
    case "set-profession":
      return setProfession(state, action.field, action.professionId);
    case "set-mode":
      return {
        ...state,
        build: { ...state.build, mode: action.mode }
      };
    case "set-pve-budget":
      return {
        ...state,
        pveBudget: {
          level: action.level ?? state.pveBudget.level,
          questBonus: action.questBonus ?? state.pveBudget.questBonus
        }
      };
    case "set-attribute-rank":
      return setAttributeRank(state, action.attributeId, action.rank);
    case "set-attribute-row":
      return setAttributeRow(state, action.index, action.attributeId, action.rank);
    case "remove-attribute-row":
      return removeAttributeRow(state, action.index);
    case "place-skill":
      return placeSkill(state, action.slotIndex, action.skillId);
    case "move-skill-slot":
      return moveSkillSlot(state, action.fromIndex, action.toIndex);
    case "swap-skill-slots":
      return swapSkillSlots(state, action.leftIndex, action.rightIndex);
    case "clear-skill-slot":
      return clearSkillSlot(state, action.slotIndex);
    case "select-slot":
      return {
        ...state,
        selectedSlotIndex:
          action.slotIndex === null || validSlotIndex(action.slotIndex)
            ? action.slotIndex
            : state.selectedSlotIndex
      };
    case "set-browser-filters":
      return setBrowserFilters(state, action.filters);
    case "set-resource-filter":
      return setBrowserFilters(state, {
        resources: {
          ...state.browser.filters.resources,
          [action.resource]: action.value
        }
      });
    case "set-browser-view":
      return {
        ...state,
        browser: {
          ...state.browser,
          viewMode: action.viewMode,
          batchSize: DEFAULT_BROWSER_BATCH_SIZE
        }
      };
    case "show-more-browser-results":
      return {
        ...state,
        browser: {
          ...state.browser,
          batchSize: state.browser.batchSize + BROWSER_BATCH_INCREMENT
        }
      };
    case "clear-browser-filters":
      return {
        ...state,
        browser: {
          ...state.browser,
          filters: createDefaultBrowserFilters(),
          batchSize: DEFAULT_BROWSER_BATCH_SIZE
        }
      };
    case "open-dialog":
      return {
        ...state,
        dialogs: { ...state.dialogs, open: action.dialog }
      };
    case "close-dialog":
      return {
        ...state,
        dialogs: { ...state.dialogs, open: null }
      };
    case "set-import-input":
      return {
        ...state,
        dialogs: { ...state.dialogs, importInput: action.input }
      };
    case "set-export-name":
      return {
        ...state,
        rawTemplate: { ...state.rawTemplate, templateName: action.name },
        dialogs: { ...state.dialogs, exportName: action.name }
      };
    case "set-tooltip":
      return {
        ...state,
        tooltip: {
          skillId: action.skillId,
          pinned: action.pinned ?? state.tooltip.pinned
        }
      };
    case "start-drag":
      return { ...state, drag: action.drag };
    case "cancel-drag":
      return { ...state, drag: null };
    case "pick-keyboard":
      return { ...state, keyboardPlacement: action.placement };
    case "place-keyboard":
      return placeKeyboardSelection(state, action.slotIndex);
    case "cancel-keyboard":
      return { ...state, keyboardPlacement: null };
    case "set-message":
      return {
        ...state,
        transient: {
          id: state.nextMessageId,
          tone: action.tone,
          text: action.text
        },
        nextMessageId: state.nextMessageId + 1
      };
    case "clear-message":
      return { ...state, transient: null };
  }
}

function setProfession(
  state: EditorState,
  field: "primary" | "secondary",
  professionId: ProfessionId | null
): EditorState {
  const build =
    field === "primary"
      ? { ...state.build, primaryProfessionId: professionId }
      : { ...state.build, secondaryProfessionId: professionId };
  const rawTemplate =
    field === "primary"
      ? { ...state.rawTemplate, primaryProfession: null }
      : { ...state.rawTemplate, secondaryProfession: null };
  return { ...state, build, rawTemplate };
}

function setAttributeRank(state: EditorState, attributeId: AttributeId, rank: number): EditorState {
  const index = state.build.attributes.findIndex(
    (attribute) => Number(attribute.attributeId) === Number(attributeId)
  );
  if (index >= 0) {
    return setAttributeRow(state, index, attributeId, rank);
  }
  return {
    ...state,
    build: {
      ...state.build,
      attributes: [...state.build.attributes, { attributeId, rank }]
    },
    rawTemplate: {
      ...state.rawTemplate,
      attributes: [...state.rawTemplate.attributes, null]
    }
  };
}

function setAttributeRow(
  state: EditorState,
  index: number,
  attributeId: AttributeId,
  rank: number
): EditorState {
  if (!validArrayIndex(index, state.build.attributes.length)) {
    return state;
  }
  return {
    ...state,
    build: {
      ...state.build,
      attributes: state.build.attributes.map((attribute, rowIndex) =>
        rowIndex === index ? { attributeId, rank } : attribute
      )
    },
    rawTemplate: {
      ...state.rawTemplate,
      attributes: state.rawTemplate.attributes.map((entry, rowIndex) =>
        rowIndex === index ? null : entry
      )
    }
  };
}

function removeAttributeRow(state: EditorState, index: number): EditorState {
  if (!validArrayIndex(index, state.build.attributes.length)) {
    return state;
  }
  return {
    ...state,
    build: {
      ...state.build,
      attributes: state.build.attributes.filter((_, rowIndex) => rowIndex !== index)
    },
    rawTemplate: {
      ...state.rawTemplate,
      attributes: state.rawTemplate.attributes.filter((_, rowIndex) => rowIndex !== index)
    }
  };
}

function placeSkill(state: EditorState, slotIndex: number, skillId: SkillId): EditorState {
  if (!validSlotIndex(slotIndex)) {
    return state;
  }
  return {
    ...state,
    build: {
      ...state.build,
      skillBar: replaceTupleSlot(state.build.skillBar, slotIndex, skillId)
    },
    rawTemplate: {
      ...state.rawTemplate,
      skillBar: replaceTupleSlot(state.rawTemplate.skillBar, slotIndex, null)
    },
    selectedSlotIndex: slotIndex
  };
}

function moveSkillSlot(state: EditorState, fromIndex: number, toIndex: number): EditorState {
  if (!validSlotIndex(fromIndex) || !validSlotIndex(toIndex) || fromIndex === toIndex) {
    return state;
  }

  const source = state.build.skillBar[fromIndex] ?? null;
  if (source === null) {
    return state;
  }
  const target = state.build.skillBar[toIndex] ?? null;
  if (target !== null) {
    return swapSkillSlots(state, fromIndex, toIndex);
  }

  return {
    ...state,
    build: {
      ...state.build,
      skillBar: replaceTupleSlot(
        replaceTupleSlot(state.build.skillBar, toIndex, source),
        fromIndex,
        null
      )
    },
    rawTemplate: {
      ...state.rawTemplate,
      skillBar: replaceTupleSlot(
        replaceTupleSlot(
          state.rawTemplate.skillBar,
          toIndex,
          state.rawTemplate.skillBar[fromIndex] ?? null
        ),
        fromIndex,
        null
      )
    },
    selectedSlotIndex: toIndex
  };
}

function swapSkillSlots(state: EditorState, leftIndex: number, rightIndex: number): EditorState {
  if (!validSlotIndex(leftIndex) || !validSlotIndex(rightIndex) || leftIndex === rightIndex) {
    return state;
  }
  const leftSkill = state.build.skillBar[leftIndex] ?? null;
  const rightSkill = state.build.skillBar[rightIndex] ?? null;
  const leftRaw = state.rawTemplate.skillBar[leftIndex] ?? null;
  const rightRaw = state.rawTemplate.skillBar[rightIndex] ?? null;
  return {
    ...state,
    build: {
      ...state.build,
      skillBar: replaceTupleSlot(
        replaceTupleSlot(state.build.skillBar, leftIndex, rightSkill),
        rightIndex,
        leftSkill
      )
    },
    rawTemplate: {
      ...state.rawTemplate,
      skillBar: replaceTupleSlot(
        replaceTupleSlot(state.rawTemplate.skillBar, leftIndex, rightRaw),
        rightIndex,
        leftRaw
      )
    },
    selectedSlotIndex: rightIndex
  };
}

function clearSkillSlot(state: EditorState, slotIndex: number): EditorState {
  if (!validSlotIndex(slotIndex)) {
    return state;
  }
  return {
    ...state,
    build: {
      ...state.build,
      skillBar: replaceTupleSlot(state.build.skillBar, slotIndex, null)
    },
    rawTemplate: {
      ...state.rawTemplate,
      skillBar: replaceTupleSlot(state.rawTemplate.skillBar, slotIndex, null)
    },
    selectedSlotIndex: slotIndex
  };
}

function placeKeyboardSelection(state: EditorState, slotIndex: number): EditorState {
  if (!validSlotIndex(slotIndex) || state.keyboardPlacement === null) {
    return state;
  }
  if (state.keyboardPlacement.kind === "browser-skill") {
    return {
      ...placeSkill(state, slotIndex, state.keyboardPlacement.skillId),
      keyboardPlacement: null
    };
  }
  return {
    ...moveSkillSlot(state, state.keyboardPlacement.slotIndex, slotIndex),
    keyboardPlacement: null
  };
}

function setBrowserFilters(state: EditorState, filters: Partial<BrowserFilters>): EditorState {
  return {
    ...state,
    browser: {
      ...state.browser,
      filters: {
        ...state.browser.filters,
        ...filters
      },
      batchSize: DEFAULT_BROWSER_BATCH_SIZE
    }
  };
}

function replaceTupleSlot<Value>(
  tuple: readonly [Value, Value, Value, Value, Value, Value, Value, Value],
  slotIndex: number,
  value: Value
): readonly [Value, Value, Value, Value, Value, Value, Value, Value] {
  return [
    slotIndex === 0 ? value : tuple[0],
    slotIndex === 1 ? value : tuple[1],
    slotIndex === 2 ? value : tuple[2],
    slotIndex === 3 ? value : tuple[3],
    slotIndex === 4 ? value : tuple[4],
    slotIndex === 5 ? value : tuple[5],
    slotIndex === 6 ? value : tuple[6],
    slotIndex === 7 ? value : tuple[7]
  ];
}

function validSlotIndex(index: number): boolean {
  return Number.isSafeInteger(index) && index >= 0 && index < SKILL_BAR_SLOT_COUNT;
}

function validArrayIndex(index: number, length: number): boolean {
  return Number.isSafeInteger(index) && index >= 0 && index < length;
}
