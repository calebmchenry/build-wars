import { guideNavigation } from "../../guide-navigation";
import type { AppliedGuide } from "../../guide-history";
export function GuideNavigation({ document }: { readonly document: AppliedGuide }) {
  return (
    <nav className="guide-navigation" aria-label="Guide sections and variants">
      <h2>In this guide</h2>
      <ul>
        {guideNavigation(document).map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>
              {item.kind === "build" ? "Variant: " : ""}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <p>These links navigate this local guide. Share its Markdown file to send the full guide.</p>
    </nav>
  );
}
