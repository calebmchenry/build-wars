import type { AuthoredDocumentId } from "./ids";
import type { Build } from "./build";
import type { AuthoredDocumentRoot } from "./source";

export interface PartySlot {
  readonly id: AuthoredDocumentId;
  readonly label: string;
  readonly build: Build | null;
}

export interface PartyBuild extends AuthoredDocumentRoot {
  readonly id: AuthoredDocumentId;
  readonly name: string;
  readonly slots: readonly PartySlot[];
}
