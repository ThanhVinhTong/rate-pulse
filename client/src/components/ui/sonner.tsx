import { Toaster } from "sonner";

const toastOptionsClassName = "!border-border !bg-[#111827] !text-white";

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
