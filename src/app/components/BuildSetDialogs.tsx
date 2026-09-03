import type { ReactNode } from "react";

export function BuildSetDialogSection({
  title,
  children
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="build-set-dialog-section" aria-label={title}>
      {children}
    </section>
  );
}
