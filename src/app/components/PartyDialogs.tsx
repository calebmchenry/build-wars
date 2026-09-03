import type { ReactNode } from "react";

export function PartyDangerButton({
  children,
  message,
  onConfirm,
  disabled = false
}: {
  readonly children: ReactNode;
  readonly message: string;
  readonly onConfirm: () => void;
  readonly disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (window.confirm(message)) {
          onConfirm();
        }
      }}
    >
      {children}
    </button>
  );
}
