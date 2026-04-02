import { Toaster } from "sonner";

const toastOptionsClassName = "!border-white/10 !bg-[#111827] !text-white";

export function SonnerToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      toastOptions={{
        className: toastOptionsClassName,
      }}
    />
  );
}
