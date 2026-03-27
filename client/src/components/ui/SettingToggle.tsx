import type { LucideIcon } from "lucide-react";

import { Panel } from "@/components/ui/panel";
import { Text } from "@/components/ui/typography";

import { IconBox } from "./icon-box";
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
    <Panel variant="settingRow">
      <div className="flex items-center gap-4">
        <IconBox variant="setting">
          <Icon className="h-5 w-5" />
        </IconBox>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <Text variant="muted" className="text-sm dark:text-text-muted">
            {description}
          </Text>
        </div>
      </div>

      <Toggle name={name || (id ? `${id}Notifications` : undefined)} defaultChecked={defaultChecked} {...toggleProps} />
    </Panel>
  );
}
