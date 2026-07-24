import type { ReactNode } from "react";

export function PortalLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
