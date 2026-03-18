import { type InputHTMLAttributes } from "react";

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {}

export function Toggle({ className, ...props }: ToggleProps) {
  return (
    <label className={`relative inline-flex cursor-pointer items-center ${className || ""}`}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:border-gray-600 dark:bg-gray-700/50 dark:after:border-gray-500"></div>
    </label>
  );
}
