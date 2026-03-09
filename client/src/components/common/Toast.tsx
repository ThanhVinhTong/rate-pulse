import { Toaster } from "sonner";

export function Toast() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      toastOptions={{
        className: "!border-white/10 !bg-[#111827] !text-white",
      }}
    />
  );
}
