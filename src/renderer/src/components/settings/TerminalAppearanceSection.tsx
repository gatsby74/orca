import { useState } from 'react'
import type { GlobalSettings } from '../../../../shared/types'
import {
  DEFAULT_TERMINAL_FONT_WEIGHT,
  TERMINAL_FONT_WEIGHT_MAX,
  TERMINAL_FONT_WEIGHT_MIN,
  TERMINAL_FONT_WEIGHT_STEP,
  normalizeTerminalFontWeight
} from '../../../../shared/terminal-fonts'
import {
  fontFamilyHasKnownLigatures,
  resolveTerminalLigaturesEnabled
} from '../../../../shared/terminal-ligatures'
import { Button } from '../ui/button'
import {
  FontAutocomplete,
  NumberField,
  SettingsRow,
  SettingsSegmentedControl,
  SettingsSubsectionHeader,
  SettingsSwitchRow
} from './SettingsFormControls'
import { SearchableSetting } from './SearchableSetting'
import { matchesSettingsSearch } from './settings-search'
import { useAppStore } from '../../store'
import { clampNumber, resolvePaneStyleOptions } from '@/lib/terminal-theme'
import {
  TERMINAL_CURSOR_SEARCH_ENTRIES,
  TERMINAL_DARK_THEME_SEARCH_ENTRIES,
  TERMINAL_GHOSTTY_IMPORT_SEARCH_ENTRIES,
  TERMINAL_LIGHT_THEME_SEARCH_ENTRIES,
  TERMINAL_PANE_APPEARANCE_SEARCH_ENTRIES,
  TERMINAL_TYPOGRAPHY_SEARCH_ENTRIES,
  TERMINAL_WINDOW_SEARCH_ENTRIES
} from './terminal-search'
import { DarkTerminalThemeSection, LightTerminalThemeSection } from './TerminalThemeSections'
import { TerminalWindowSection } from './TerminalWindowSection'
import { TerminalSettingsPreview } from './TerminalSettingsPreview'
import { TerminalFontSizeSetting } from './TerminalFontSizeSetting'
import { GhosttyImportModal } from './GhosttyImportModal'
import type { UseGhosttyImportReturn } from './useGhosttyImport'
import ghosttyIcon from '../../../../../resources/ghostty.svg'
import { translate } from '@/i18n/i18n'

type TerminalAppearanceSectionProps = {
  settings: GlobalSettings
  updateSettings: (updates: Partial<GlobalSettings>) => void
  systemPrefersDark: boolean
  terminalFontSuggestions: string[]
  ghostty: UseGhosttyImportReturn
}

export function TerminalAppearanceSection({
  settings,
  updateSettings,
  systemPrefersDark,
  terminalFontSuggestions,
  ghostty
}: TerminalAppearanceSectionProps): React.JSX.Element {
  const searchQuery = useAppStore((state) => state.settingsSearchQuery)
  const [themeSearchDark, setThemeSearchDark] = useState('')
  const [themeSearchLight, setThemeSearchLight] = useState('')
  // Why: hover preview lets the font picker update the sample without committing a setting.
  const [previewFontFamily, setPreviewFontFamily] = useState<string | null>(null)
  const paneStyleOptions = resolvePaneStyleOptions(settings)

  const visibleSections = [
    matchesSettingsSearch(searchQuery, TERMINAL_GHOSTTY_IMPORT_SEARCH_ENTRIES) ||
    matchesSettingsSearch(searchQuery, TERMINAL_TYPOGRAPHY_SEARCH_ENTRIES) ? (
      <section key="typography" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SettingsSubsectionHeader
              title={translate("auto.components.settings.TerminalAppearanceSection.048aac8a64", "Terminal Typography")}
              description={translate("auto.components.settings.TerminalAppearanceSection.711e589f18", "Default terminal typography for new panes and live updates.")}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void ghostty.handleClick()}
            >
              <img src={ghosttyIcon} alt="" aria-hidden="true" className="size-4" />
              {translate("auto.components.settings.TerminalAppearanceSection.855a76343a", "Import from Ghostty")}</Button>
          </div>

          <div className="divide-y divide-border/40">
            <TerminalFontSizeSetting settings={settings} updateSettings={updateSettings} />

            <SearchableSetting
              title={translate("auto.components.settings.TerminalAppearanceSection.a408266e67", "Font Family")}
              description={translate("auto.components.settings.TerminalAppearanceSection.f04b17a50e", "Default terminal font family for new panes and live updates.")}
              keywords={['terminal', 'typography', 'font']}
            >
              <SettingsRow
                alignTop
                label={translate("auto.components.settings.TerminalAppearanceSection.a408266e67", "Font Family")}
                description={translate("auto.components.settings.TerminalAppearanceSection.f04b17a50e", "Default terminal font family for new panes and live updates.")}
                control={
                  <FontAutocomplete
                    value={settings.terminalFontFamily}
                    suggestions={terminalFontSuggestions}
                    onChange={(value) => updateSettings({ terminalFontFamily: value })}
                    onPreviewFontFamily={setPreviewFontFamily}
                  />
                }
              />
            </SearchableSetting>

            <SearchableSetting
              title={translate("auto.components.settings.TerminalAppearanceSection.4aae5db258", "Font Weight")}
              description={translate("auto.components.settings.TerminalAppearanceSection.36af8ad94c", "Controls the terminal text font weight.")}
              keywords={['terminal', 'typography', 'weight']}
            >
              <NumberField
                label={translate("auto.components.settings.TerminalAppearanceSection.4aae5db258", "Font Weight")}
                description={translate("auto.components.settings.TerminalAppearanceSection.36af8ad94c", "Controls the terminal text font weight.")}
                value={normalizeTerminalFontWeight(settings.terminalFontWeight)}
                defaultValue={DEFAULT_TERMINAL_FONT_WEIGHT}
                min={TERMINAL_FONT_WEIGHT_MIN}
                max={TERMINAL_FONT_WEIGHT_MAX}
                step={TERMINAL_FONT_WEIGHT_STEP}
                suffix="100-900"
                onChange={(value) =>
                  updateSettings({
                    terminalFontWeight: normalizeTerminalFontWeight(value)
                  })
                }
              />
            </SearchableSetting>

            <SearchableSetting
              title={translate("auto.components.settings.TerminalAppearanceSection.c084eb7d4c", "Line Height")}
              description={translate("auto.components.settings.TerminalAppearanceSection.bafc80efbc", "Controls the terminal line height multiplier.")}
              keywords={['terminal', 'typography', 'line height', 'spacing']}
            >
              <NumberField
                label={translate("auto.components.settings.TerminalAppearanceSection.c084eb7d4c", "Line Height")}
                description={translate("auto.components.settings.TerminalAppearanceSection.bafc80efbc", "Controls the terminal line height multiplier.")}
                value={settings.terminalLineHeight}
                defaultValue={1}
                min={1}
                max={3}
                step={0.1}
                suffix="1-3"
                onChange={(value) =>
                  updateSettings({
                    terminalLineHeight: clampNumber(value, 1, 3)
                  })
                }
              />
            </SearchableSetting>

            <SearchableSetting
              title={translate("auto.components.settings.TerminalAppearanceSection.be8da35e7f", "Font Ligatures")}
              description={translate("auto.components.settings.TerminalAppearanceSection.7233d594bf", "Render programming ligatures (e.g. =>, !=, ===) for fonts that ship them. \"Auto\" enables ligatures only for known ligature fonts (Fira Code, JetBrains Mono, Cascadia Code, Iosevka, etc.).")}
              keywords={[
                'terminal',
                'typography',
                'ligatures',
                'ligature',
                'fira code',
                'jetbrains mono',
                'cascadia code',
                'iosevka',
                'calt',
                'font features'
              ]}
            >
              <SettingsRow
                label={translate("auto.components.settings.TerminalAppearanceSection.be8da35e7f", "Font Ligatures")}
                description={
                  settings.terminalLigatures === 'on'
                    ? translate("auto.components.settings.TerminalAppearanceSection.7234abcd08", "Always on. Fonts without ligatures simply render as-is.")
                    : settings.terminalLigatures === 'off'
                      ? translate("auto.components.settings.TerminalAppearanceSection.04569feb07", "Always off, even for fonts that ship them.")
                      : fontFamilyHasKnownLigatures(settings.terminalFontFamily)
                        ? translate("auto.components.settings.TerminalAppearanceSection.400e950ca5", "Auto - enabled for \"{{value0}}\".", { value0: settings.terminalFontFamily })
                        : translate("auto.components.settings.TerminalAppearanceSection.4b1f29598e", "Auto - disabled for \"{{value0}}\".", { value0: settings.terminalFontFamily || 'the current font' })
                }
                control={
                  <SettingsSegmentedControl
                    ariaLabel={translate("auto.components.settings.TerminalAppearanceSection.be8da35e7f", "Font Ligatures")}
                    value={settings.terminalLigatures ?? 'auto'}
                    onChange={(option) => updateSettings({ terminalLigatures: option })}
                    options={[
                      { value: 'auto', label: translate("auto.components.settings.TerminalAppearanceSection.bc9ff84d61", "Auto") },
                      { value: 'on', label: translate("auto.components.settings.TerminalAppearanceSection.84bd22f2cd", "On") },
                      { value: 'off', label: translate("auto.components.settings.TerminalAppearanceSection.870377082f", "Off") }
                    ]}
                  />
                }
              />
              {/* Why: surface the resolved state explicitly so the "Auto" label
                  isn't ambiguous when a user is staring at it. */}
              <p className="sr-only" aria-live="polite">
                {translate("auto.components.settings.TerminalAppearanceSection.31f6e61085", "Ligatures are currently")}{' '}
                {resolveTerminalLigaturesEnabled(
                  settings.terminalLigatures,
                  settings.terminalFontFamily
                )
                  ? 'enabled'
                  : 'disabled'}
                .
              </p>
            </SearchableSetting>
          </div>
        </div>
        <TerminalSettingsPreview
          title={translate("auto.components.settings.TerminalAppearanceSection.70beb1bbc7", "Preview")}
          settings={settings}
          systemPrefersDark={systemPrefersDark}
          previewFontFamily={previewFontFamily}
          showThemeToggle
        />
      </section>
    ) : null,
    matchesSettingsSearch(searchQuery, TERMINAL_CURSOR_SEARCH_ENTRIES) ? (
      <section key="cursor" className="space-y-3">
        <SettingsSubsectionHeader
          title={translate("auto.components.settings.TerminalAppearanceSection.abcb4dd019", "Terminal Cursor")}
          description={translate("auto.components.settings.TerminalAppearanceSection.d455f2ef4f", "Default cursor appearance for Orca terminal panes.")}
        />

        <div className="divide-y divide-border/40">
          <SearchableSetting
            title={translate("auto.components.settings.TerminalAppearanceSection.db270cc9a9", "Cursor Shape")}
            description={translate("auto.components.settings.TerminalAppearanceSection.d455f2ef4f", "Default cursor appearance for Orca terminal panes.")}
            keywords={['terminal', 'cursor', 'bar', 'block', 'underline']}
          >
            <SettingsRow
              label={translate("auto.components.settings.TerminalAppearanceSection.db270cc9a9", "Cursor Shape")}
              description={translate("auto.components.settings.TerminalAppearanceSection.d455f2ef4f", "Default cursor appearance for Orca terminal panes.")}
              control={
                <SettingsSegmentedControl
                  ariaLabel={translate("auto.components.settings.TerminalAppearanceSection.db270cc9a9", "Cursor Shape")}
                  value={settings.terminalCursorStyle}
                  onChange={(option) => updateSettings({ terminalCursorStyle: option })}
                  options={[
                    { value: 'bar', label: translate("auto.components.settings.TerminalAppearanceSection.e070e8aeba", "Bar") },
                    { value: 'block', label: translate("auto.components.settings.TerminalAppearanceSection.52854a5608", "Block") },
                    { value: 'underline', label: translate("auto.components.settings.TerminalAppearanceSection.2e5aec3cf6", "Underline") }
                  ]}
                />
              }
            />
          </SearchableSetting>

          <SearchableSetting
            title={translate("auto.components.settings.TerminalAppearanceSection.74736cc9b1", "Blinking Cursor")}
            description={translate("auto.components.settings.TerminalAppearanceSection.2de6b5a699", "Uses the blinking variant of the selected cursor shape.")}
            keywords={['terminal', 'cursor', 'blink']}
          >
            <SettingsSwitchRow
              label={translate("auto.components.settings.TerminalAppearanceSection.74736cc9b1", "Blinking Cursor")}
              description={translate("auto.components.settings.TerminalAppearanceSection.2de6b5a699", "Uses the blinking variant of the selected cursor shape.")}
              checked={settings.terminalCursorBlink}
              onChange={() =>
                updateSettings({ terminalCursorBlink: !settings.terminalCursorBlink })
              }
            />
          </SearchableSetting>

          <SearchableSetting
            title={translate("auto.components.settings.TerminalAppearanceSection.b9f1804422", "Cursor Opacity")}
            description={translate("auto.components.settings.TerminalAppearanceSection.04cdf85dec", "Opacity of the terminal cursor.")}
            keywords={['terminal', 'cursor', 'opacity', 'transparency']}
          >
            <NumberField
              label={translate("auto.components.settings.TerminalAppearanceSection.b9f1804422", "Cursor Opacity")}
              description={translate("auto.components.settings.TerminalAppearanceSection.04cdf85dec", "Opacity of the terminal cursor.")}
              value={settings.terminalCursorOpacity ?? 1}
              defaultValue={1}
              min={0}
              max={1}
              step={0.05}
              suffix="0-1"
              onChange={(value) =>
                updateSettings({
                  terminalCursorOpacity: clampNumber(value, 0, 1)
                })
              }
            />
          </SearchableSetting>
        </div>
      </section>
    ) : null,
    matchesSettingsSearch(searchQuery, TERMINAL_PANE_APPEARANCE_SEARCH_ENTRIES) ? (
      <section key="pane-appearance" className="space-y-3">
        <SettingsSubsectionHeader
          title={translate("auto.components.settings.TerminalAppearanceSection.e1a5c25555", "Terminal Panes")}
          description={translate("auto.components.settings.TerminalAppearanceSection.1b79379d4f", "Control inactive pane dimming and split divider thickness.")}
        />

        <div className="divide-y divide-border/40">
          <SearchableSetting
            title={translate("auto.components.settings.TerminalAppearanceSection.a6fdd6a3b1", "Inactive Pane Opacity")}
            description={translate("auto.components.settings.TerminalAppearanceSection.db632cb50e", "Opacity applied to panes that are not currently active.")}
            keywords={['pane', 'opacity', 'dimming']}
          >
            <NumberField
              label={translate("auto.components.settings.TerminalAppearanceSection.a6fdd6a3b1", "Inactive Pane Opacity")}
              description={translate("auto.components.settings.TerminalAppearanceSection.db632cb50e", "Opacity applied to panes that are not currently active.")}
              value={paneStyleOptions.inactivePaneOpacity}
              defaultValue={0.8}
              min={0}
              max={1}
              step={0.05}
              suffix="0-1"
              onChange={(value) =>
                updateSettings({
                  terminalInactivePaneOpacity: clampNumber(value, 0, 1)
                })
              }
            />
          </SearchableSetting>
          <SearchableSetting
            title={translate("auto.components.settings.TerminalAppearanceSection.f27a99978d", "Divider Thickness")}
            description={translate("auto.components.settings.TerminalAppearanceSection.a14a427ae4", "Thickness of the pane divider line.")}
            keywords={['pane', 'divider', 'thickness']}
          >
            <NumberField
              label={translate("auto.components.settings.TerminalAppearanceSection.f27a99978d", "Divider Thickness")}
              description={translate("auto.components.settings.TerminalAppearanceSection.a14a427ae4", "Thickness of the pane divider line.")}
              value={paneStyleOptions.dividerThicknessPx}
              defaultValue={1}
              min={1}
              max={32}
              step={1}
              suffix="px"
              onChange={(value) =>
                updateSettings({
                  terminalDividerThicknessPx: clampNumber(value, 1, 32)
                })
              }
            />
          </SearchableSetting>
        </div>
      </section>
    ) : null,
    matchesSettingsSearch(searchQuery, TERMINAL_WINDOW_SEARCH_ENTRIES) ? (
      <TerminalWindowSection key="window" settings={settings} updateSettings={updateSettings} />
    ) : null,
    matchesSettingsSearch(searchQuery, TERMINAL_DARK_THEME_SEARCH_ENTRIES) ? (
      <DarkTerminalThemeSection
        key="dark-theme"
        settings={settings}
        systemPrefersDark={systemPrefersDark}
        themeSearchDark={themeSearchDark}
        setThemeSearchDark={setThemeSearchDark}
        updateSettings={updateSettings}
        previewFontFamily={previewFontFamily}
      />
    ) : null,
    matchesSettingsSearch(searchQuery, TERMINAL_LIGHT_THEME_SEARCH_ENTRIES) ? (
      <LightTerminalThemeSection
        key="light-theme"
        settings={settings}
        themeSearchLight={themeSearchLight}
        setThemeSearchLight={setThemeSearchLight}
        updateSettings={updateSettings}
        previewFontFamily={previewFontFamily}
      />
    ) : null
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      {visibleSections.map((section, index) => (
        <div key={index} className="space-y-6">
          {index > 0 ? <div className="h-px bg-border/60" /> : null}
          {section}
        </div>
      ))}
      <GhosttyImportModal
        open={ghostty.open}
        onOpenChange={ghostty.handleOpenChange}
        preview={ghostty.preview}
        loading={ghostty.loading}
        onApply={ghostty.handleApply}
        applied={ghostty.applied}
        applyError={ghostty.applyError}
      />
    </div>
  )
}
