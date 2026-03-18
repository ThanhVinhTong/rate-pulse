import type { LucideIcon } from "lucide-react";

import { Toggle, type ToggleProps } from "./Toggle";

interface SettingToggleProps {
  id?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultChecked?: boolean;
  name?: string;
  toggleProps?: ToggleProps;
}

export function SettingToggle({
  id,
  title,
  description,
  icon: Icon,
  defaultChecked,
  name,
  toggleProps,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4 transition-colors dark:bg-[#0c1220]/50">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-text-muted">{description}</p>
        </div>
      </div>
      
      <Toggle 
        name={name || (id ? `${id}Notifications` : undefined)} 
        defaultChecked={defaultChecked} 
        {...toggleProps} 
      />
    </div>
  );
}
