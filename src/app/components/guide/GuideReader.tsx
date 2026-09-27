import { createElement, useEffect, type ReactNode } from "react";
import type { GuideNode } from "../../../domain/guide";
import { safeGuideUrl } from "../../../guide/limits";
import type { AppCatalogViews } from "../../catalogs";
import type { AppliedGuide } from "../../guide-history";
import { guideAnchor, matchingGuideAnchor } from "../../guide-navigation";
import type { PersistedBuildSnapshot } from "../../persistence-schema";
import { GuideBuildCard } from "./GuideBuildCard";
import { GuideSkillMention } from "./GuideSkillMention";
import { GuideNavigation } from "./GuideNavigation";
export function GuideReader({
  document,
  catalogs,
  onCopy
}: {
  readonly document: AppliedGuide;
  readonly catalogs: AppCatalogViews | null;
  readonly onCopy: (buildId: string) => void;
}) {
  useEffect(() => {
    const navigate = () => {
      const id = matchingGuideAnchor(document, window.location.hash);
      if (!id) return;
      const target = window.document.getElementById(id);
      target?.scrollIntoView?.({ block: "start" });
      target?.focus({ preventScroll: true });
    };
    navigate();
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, [document]);
  const render = (nodes: readonly GuideNode<PersistedBuildSnapshot>[], parent = ""): ReactNode =>
    nodes.map((node, index) => {
      const key = parent ? `${parent}.${index}` : `${index}`;
      const children = "children" in node ? render(node.children, key) : null;
      switch (node.type) {
        case "text":
          return node.value;
        case "inlineCode":
          return <code key={key}>{node.value}</code>;
        case "break":
          return <br key={key} />;
        case "thematicBreak":
          return <hr key={key} />;
        case "paragraph":
          return <p key={key}>{children}</p>;
        case "strong":
          return <strong key={key}>{children}</strong>;
        case "emphasis":
          return <em key={key}>{children}</em>;
        case "blockquote":
          return <blockquote key={key}>{children}</blockquote>;
        case "listItem":
          return <li key={key}>{children}</li>;
        case "list":
          return node.ordered ? (
            <ol key={key} start={node.start}>
              {children}
            </ol>
          ) : (
            <ul key={key}>{children}</ul>
          );
        case "heading":
          return createElement(
            `h${node.depth}`,
            { key, id: guideAnchor(document.metadata.id, "section", key), tabIndex: -1 },
            children
          );
        case "link":
          return safeGuideUrl(node.url) ? (
            <a
              key={key}
              href={node.url}
              title={node.title ?? undefined}
              rel="noopener noreferrer"
              target={node.url.startsWith("#") ? undefined : "_blank"}
            >
              {children}
            </a>
          ) : (
            <span key={key}>{children}</span>
          );
        case "code":
          return (
            <pre key={key}>
              <code>{node.value}</code>
            </pre>
          );
        case "opaque":
          return (
            <pre key={key} aria-label="Retained unsupported Markdown">
              {node.raw}
            </pre>
          );
        case "skill":
          return (
            <GuideSkillMention key={key} node={node} document={document} catalogs={catalogs} />
          );
        case "build":
          return (
            <div
              key={key}
              className="guide-build-embed"
              id={guideAnchor(document.metadata.id, "build", node.id)}
              tabIndex={-1}
            >
              <GuideBuildCard
                id={node.id}
                snapshot={node.snapshot}
                catalogs={catalogs}
                selected={false}
                readOnly
                send={() => false}
                onCopy={() => onCopy(node.id)}
              />
            </div>
          );
      }
    });
  return (
    <div className="guide-reader-layout">
      <GuideNavigation document={document} />
      <article className="guide-reader" aria-label="Guide reading pane" tabIndex={-1}>
        {document.metadata.summary && <p className="guide-summary">{document.metadata.summary}</p>}
        {render(document.nodes)}
        {document.metadata.sources.length > 0 && (
          <footer>
            <h2>Sources and attribution</h2>
            <ul>
              {document.metadata.sources.map((source, index) => (
                <li key={index}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.label}
                  </a>
                  {source.attribution && ` — ${source.attribution}`}
                  {source.license && ` · ${source.license}`}
                  {source.notes && <p>{source.notes}</p>}
                </li>
              ))}
            </ul>
          </footer>
        )}
      </article>
    </div>
  );
}
