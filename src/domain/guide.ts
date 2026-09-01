import type { AuthoredDocumentId } from "./ids";
import type { Build } from "./build";
import type { PartyBuild } from "./party";
import type { AuthoredDocumentRoot } from "./source";

export type GuideSectionKind = "text" | "build" | "party";

export interface GuideSection {
  readonly id: AuthoredDocumentId;
  readonly kind: GuideSectionKind;
  readonly title: string;
  readonly text: string | null;
  readonly build: Build | null;
  readonly party: PartyBuild | null;
}

export interface Guide extends AuthoredDocumentRoot {
  readonly id: AuthoredDocumentId;
  readonly title: string;
  readonly sections: readonly GuideSection[];
}
