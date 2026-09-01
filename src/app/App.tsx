import { SKILL_BAR_SLOT_COUNT } from "../domain";

export function App() {
  const skillSlots = Array.from({ length: SKILL_BAR_SLOT_COUNT }, (_, index) => index + 1);

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <section className="foundation-shell" aria-label="Build workspace">
        <div className="shell-heading">
          <p className="eyebrow">Local workspace</p>
          <h1 id="app-title">Build Wars</h1>
        </div>
        <div
          className="skill-rail"
          role="list"
          aria-label={`${SKILL_BAR_SLOT_COUNT} empty skill slots`}
        >
          {skillSlots.map((slot) => (
            <span
              key={slot}
              className="skill-slot"
              role="listitem"
              aria-label={`Empty slot ${slot}`}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
