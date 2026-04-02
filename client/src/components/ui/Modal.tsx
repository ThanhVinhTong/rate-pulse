import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { Text } from "./typography";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, description, children, footer }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/70 p-4 backdrop-blur-sm">
      <div className={cn("w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1322] p-6 shadow-panel")}>
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {description ? (
            <Text variant="muted" className="mt-2">
              {description}
            </Text>
          ) : null}
        </div>
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
