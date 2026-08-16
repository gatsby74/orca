import type React from 'react'
import type { GlobalSettings } from '../../../../shared/global-settings-types'
import {
  DEFAULT_TAB_GROUP_SPLIT_DIVIDER_DARK,
  DEFAULT_TAB_GROUP_SPLIT_DIVIDER_LIGHT
} from '../../../../shared/tab-group-split-divider'
import { translate } from '@/i18n/i18n'
import { ColorField } from './SettingsFormControls'
import { SearchableSetting } from './SearchableSetting'

export function AppearanceWorkspaceSplitDividerSettings({
  settings,
  updateSettings,
  forceVisiblePrimary = false
}: {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  forceVisiblePrimary?: boolean
}): React.JSX.Element {
  const darkTitle = translate(
    'auto.components.settings.AppearanceWorkspaceSplitDividerSettings.darkTitle',
    'Workspace Split Divider (Dark)'
  )
  const darkDescription = translate(
    'auto.components.settings.AppearanceWorkspaceSplitDividerSettings.darkDescription',
    'Color of the split line between workspace panes in dark mode. This is the column between a terminal tab and an editor, not the in-terminal split.'
  )
  const lightTitle = translate(
    'auto.components.settings.AppearanceWorkspaceSplitDividerSettings.lightTitle',
    'Workspace Split Divider (Light)'
  )
  const lightDescription = translate(
    'auto.components.settings.AppearanceWorkspaceSplitDividerSettings.lightDescription',
    'Color of the split line between workspace panes in light mode.'
  )
  const keywords = ['workspace', 'split', 'divider', 'pane', 'color', 'tab group']

  return (
    <>
      <SearchableSetting
        title={darkTitle}
        description={darkDescription}
        keywords={keywords}
        forceVisible={forceVisiblePrimary}
      >
        <ColorField
          label={darkTitle}
          description={darkDescription}
          value={settings.tabGroupSplitDividerColorDark}
          fallback={DEFAULT_TAB_GROUP_SPLIT_DIVIDER_DARK}
          onChange={(value) => updateSettings({ tabGroupSplitDividerColorDark: value })}
        />
      </SearchableSetting>
      <SearchableSetting
        title={lightTitle}
        description={lightDescription}
        keywords={keywords}
        forceVisible={forceVisiblePrimary}
      >
        <ColorField
          label={lightTitle}
          description={lightDescription}
          value={settings.tabGroupSplitDividerColorLight}
          fallback={DEFAULT_TAB_GROUP_SPLIT_DIVIDER_LIGHT}
          onChange={(value) => updateSettings({ tabGroupSplitDividerColorLight: value })}
        />
      </SearchableSetting>
    </>
  )
}
