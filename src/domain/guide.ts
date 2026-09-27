import type { Build } from "./build";

/** Vendor-independent semantic document. Build payloads are injected at the app boundary. */
export interface GuideSource {
  readonly label: string;
  readonly url: string;
  readonly attribution?: string;
  readonly license?: string;
  readonly licenseUrl?: string;
  readonly revision?: string;
  readonly notes?: string;
}
export interface GuideMetadata {
  readonly version: 1;
  readonly id: string;
  readonly title: string;
  readonly summary: string | null;
  readonly tags: readonly string[];
  readonly sources: readonly GuideSource[];
}
export type GuideSkillContext =
  | { readonly kind: "generic" }
  | { readonly kind: "local"; readonly buildId: string }
  | {
      readonly kind: "detached";
      readonly guideId: string;
      readonly buildId: string;
      readonly reason: string;
    };
export type GuideNode<B> =
  | { readonly type: "text" | "inlineCode"; readonly value: string }
  | { readonly type: "break" | "thematicBreak" }
  | {
      readonly type: "paragraph" | "emphasis" | "strong" | "blockquote" | "listItem";
      readonly children: readonly GuideNode<B>[];
    }
  | { readonly type: "heading"; readonly depth: number; readonly children: readonly GuideNode<B>[] }
  | {
      readonly type: "list";
      readonly ordered: boolean;
      readonly start: number;
      readonly children: readonly GuideNode<B>[];
    }
  | {
      readonly type: "link";
      readonly url: string;
      readonly title: string | null;
      readonly children: readonly GuideNode<B>[];
    }
  | { readonly type: "code"; readonly lang: string | null; readonly value: string }
  | { readonly type: "skill"; readonly skillId: string; readonly context: GuideSkillContext }
  | { readonly type: "build"; readonly id: string; readonly snapshot: B }
  | { readonly type: "opaque"; readonly raw: string };
export interface GuideDocument<B> {
  readonly metadata: GuideMetadata;
  readonly nodes: readonly GuideNode<B>[];
}
export function guideBuilds<B>(
  doc: GuideDocument<B>
): readonly Extract<GuideNode<B>, { type: "build" }>[] {
  return doc.nodes.filter(
    (node): node is Extract<GuideNode<B>, { type: "build" }> => node.type === "build"
  );
}

/** Public guide alias retains the domain Build default while apps inject snapshots. */
export type Guide<BuildPayload = Build> = GuideDocument<BuildPayload>;
