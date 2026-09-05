import { THEME_PREFERENCES, type ResolvedTheme, type ThemePreference } from "../theme";

const THEME_LABELS: Readonly<Record<ThemePreference, string>> = {
  system: "System",
  light: "Light",
  dark: "Dark"
};

export function ThemeControls({
  preference,
  resolvedTheme,
  onChange
}: {
  readonly preference: ThemePreference;
  readonly resolvedTheme: ResolvedTheme;
  readonly onChange: (preference: ThemePreference) => void;
}) {
  return (
    <section className="theme-controls" aria-label="Theme">
      <span>Theme</span>
      <div className="theme-choice-list" role="group" aria-label={`Theme: ${resolvedTheme}`}>
        {THEME_PREFERENCES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={preference === option}
            className={preference === option ? "active" : ""}
            onClick={() => onChange(option)}
          >
            {THEME_LABELS[option]}
          </button>
        ))}
      </div>
    </section>
  );
}
