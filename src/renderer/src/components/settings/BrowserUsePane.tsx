import { useCallback, useEffect, useState } from 'react'
import { Import, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { CliInstallStatus } from '../../../../shared/cli-install-types'
import {
  ORCA_CLI_SKILL_INSTALL_COMMAND,
  ORCA_CLI_SKILL_NAME
} from '@/lib/agent-feature-install-commands'
import {
  AGENT_SKILL_CLI_PREREQUISITE_NOTICE,
  ensureOrcaCliAvailableForAgentSkillTerminal,
  isOrcaCliAvailableOnPath
} from '@/lib/agent-skill-cli-prerequisite'
import { BROWSER_USE_ENABLED_STORAGE_KEY } from '@/lib/browser-use-setup-state'
import {
  GLOBAL_AGENT_SKILL_SOURCE_KINDS,
  useInstalledAgentSkill
} from '@/hooks/useInstalledAgentSkills'
import { useMountedRef } from '@/hooks/useMountedRef'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { useAppStore } from '../../store'
import { BROWSER_FAMILY_LABELS } from '../../../../shared/constants'
import { SearchableSetting } from './SearchableSetting'
import { matchesSettingsSearch } from './settings-search'
import { getBrowserUsePaneSearchEntries } from './browser-use-search'
import { BrowserUseExamples } from './BrowserUseExamples'
import { BrowserUseComputerUseNotice } from './BrowserUseComputerUseNotice'
import { BrowserUseEnableSwitch } from './BrowserUseEnableSwitch'
import { StepBadge } from './BrowserUseStepBadge'
import { BrowserUseSkillStep } from './BrowserUseSkillStep'
import { translate } from '@/i18n/i18n'

type BrowserUseSetupProps = {
  onConfigureMoreBrowsers?: () => void
  onOpenComputerUse?: () => void
}

export function BrowserUseSetup({
  onConfigureMoreBrowsers,
  onOpenComputerUse
}: BrowserUseSetupProps = {}): React.JSX.Element {
  const searchQuery = useAppStore((s) => s.settingsSearchQuery)
  const browserSessionProfiles = useAppStore((s) => s.browserSessionProfiles)
  const detectedBrowsers = useAppStore((s) => s.detectedBrowsers)
  const fetchBrowserSessionProfiles = useAppStore((s) => s.fetchBrowserSessionProfiles)
  const fetchDetectedBrowsers = useAppStore((s) => s.fetchDetectedBrowsers)
  const browserSessionImportState = useAppStore((s) => s.browserSessionImportState)

  const [cliStatus, setCliStatus] = useState<CliInstallStatus | null>(null)
  const [cliLoading, setCliLoading] = useState(true)
  const [cliBusy, setCliBusy] = useState(false)
  const mountedRef = useMountedRef()

  const handleCliStatusChange = useCallback(
    (nextStatus: CliInstallStatus): void => {
      if (mountedRef.current) {
        setCliStatus(nextStatus)
      }
    },
    [mountedRef]
  )

  // Why: the toggle gates only whether we show the setup instructions. We
  // persist it in localStorage instead of global settings because it has no
  // functional effect elsewhere in the app — it's a UI affordance local to
  // this pane, consistent with the skill-installed marker below.
  const [browserUseEnabled, setBrowserUseEnabled] = useState<boolean>(() => {
    return localStorage.getItem(BROWSER_USE_ENABLED_STORAGE_KEY) === '1'
  })

  const toggleBrowserUse = (value: boolean): void => {
    setBrowserUseEnabled(value)
    localStorage.setItem(BROWSER_USE_ENABLED_STORAGE_KEY, value ? '1' : '0')
    if (value) {
      useAppStore.getState().recordFeatureInteraction('agent-browser-setup')
    }
  }

  const refreshCli = useCallback(async (): Promise<void> => {
    setCliLoading(true)
    try {
      handleCliStatusChange(await window.api.cli.getInstallStatus())
    } catch (error) {
      if (mountedRef.current) {
        toast.error(
          error instanceof Error
            ? error.message
            : translate(
                'auto.components.settings.BrowserUsePane.180a9abf3a',
                'Failed to load CLI status.'
              )
        )
      }
    } finally {
      if (mountedRef.current) {
        setCliLoading(false)
      }
    }
  }, [handleCliStatusChange, mountedRef])

  useEffect(() => {
    // Why: skip IPC work when the feature is toggled off — the component
    // returns early below and none of this data is rendered.
    if (!browserUseEnabled) {
      return
    }
    void refreshCli()
    void fetchBrowserSessionProfiles()
  }, [browserUseEnabled, fetchBrowserSessionProfiles, refreshCli])

  const defaultProfile = browserSessionProfiles.find((p) => p.id === 'default')
  // Why: this step explicitly imports into the default profile, so completion
  // must track that profile only. Marking done when a non-default profile has
  // cookies would mislead users into thinking agents can reach their logins
  // when the default profile — the one agents use — is still empty.
  const cookiesImported = !!defaultProfile?.source

  const cliEnabled = isOrcaCliAvailableOnPath(cliStatus)
  const cliPathNeedsAttention = cliStatus?.state === 'installed' && !cliStatus.pathConfigured
  const cliSupported = cliStatus?.supported ?? false

  const {
    installed: skillDetected,
    loading: skillLoading,
    error: skillError,
    refresh: refreshSkill
  } = useInstalledAgentSkill(ORCA_CLI_SKILL_NAME, {
    enabled: browserUseEnabled,
    sourceKinds: GLOBAL_AGENT_SKILL_SOURCE_KINDS
  })

  const handleEnableCli = async (): Promise<void> => {
    setCliBusy(true)
    try {
      const next = await ensureOrcaCliAvailableForAgentSkillTerminal({
        onStatusChange: handleCliStatusChange
      })
      if (mountedRef.current && isOrcaCliAvailableOnPath(next)) {
        toast.success(
          translate(
            'auto.components.settings.BrowserUsePane.721aee31b4',
            'Registered the Orca CLI in PATH.'
          )
        )
      }
    } finally {
      if (mountedRef.current) {
        setCliBusy(false)
      }
    }
  }

  const handleImportFromBrowser = async (
    browserFamily: string,
    browserProfile?: string
  ): Promise<void> => {
    const profileId = 'default'
    const result = await useAppStore
      .getState()
      .importCookiesFromBrowser(profileId, browserFamily, browserProfile)
    if (result.ok) {
      const browser = detectedBrowsers.find((b) => b.family === browserFamily)
      toast.success(
        translate(
          'auto.components.settings.BrowserUsePane.2ea4617e3a',
          'Imported {{value0}} cookies from {{value1}}{{value2}}.',
          {
            value0: result.summary.importedCookies,
            value1: browser?.label ?? browserFamily,
            value2: browserProfile ? ` (${browserProfile})` : ''
          }
        )
      )
    } else {
      toast.error(result.reason)
    }
  }

  const handleImportFromFile = async (): Promise<void> => {
    const result = await useAppStore.getState().importCookiesToProfile('default')
    if (result.ok) {
      toast.success(
        translate(
          'auto.components.settings.BrowserUsePane.2ea4617e3a',
          'Imported {{value0}} cookies from file.',
          { value0: result.summary.importedCookies }
        )
      )
    } else if (result.reason !== 'canceled') {
      toast.error(result.reason)
    }
  }

  const isImportingDefault =
    browserSessionImportState?.profileId === 'default' &&
    browserSessionImportState.status === 'importing'

  const showStep1 = matchesSettingsSearch(searchQuery, [getBrowserUsePaneSearchEntries()[0]])
  const showStep2 = matchesSettingsSearch(searchQuery, [getBrowserUsePaneSearchEntries()[1]])
  const showStep3 = matchesSettingsSearch(searchQuery, [getBrowserUsePaneSearchEntries()[2]])
  const completedCount = [cliEnabled, skillDetected, cookiesImported].filter(Boolean).length
  const step2Blocked = !cliEnabled && !skillDetected
  const step3Blocked = !cookiesImported && (!cliEnabled || !skillDetected)

  const sourceLabel = defaultProfile?.source
    ? `${BROWSER_FAMILY_LABELS[defaultProfile.source.browserFamily] ?? defaultProfile.source.browserFamily}${defaultProfile.source.profileName ? ` (${defaultProfile.source.profileName})` : ''}`
    : null

  if (!browserUseEnabled) {
    return (
      <div className="flex items-center justify-between gap-4 py-2">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {translate('auto.components.settings.BrowserUsePane.b8a1f2d84d', 'Agent Browser Use')}
          </p>
          <p className="text-xs text-muted-foreground">
            {translate(
              'auto.components.settings.BrowserUsePane.96b91c6349',
              'Let coding agents drive this browser with your logins.'
            )}
          </p>
        </div>
        <BrowserUseEnableSwitch
          enabled={browserUseEnabled}
          onToggle={() => toggleBrowserUse(!browserUseEnabled)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">
            {translate('auto.components.settings.BrowserUsePane.b8a1f2d84d', 'Agent Browser Use')}
          </p>
          <p className="text-xs text-muted-foreground">
            {translate(
              'auto.components.settings.BrowserUsePane.702488a5f7',
              'Let coding agents drive this browser with your logins. Finish the three steps below.'
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              completedCount === 3
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {completedCount}/3
          </span>
          <BrowserUseEnableSwitch
            enabled={browserUseEnabled}
            onToggle={() => toggleBrowserUse(!browserUseEnabled)}
          />
        </div>
      </div>

      {onOpenComputerUse ? (
        <BrowserUseComputerUseNotice onOpenComputerUse={onOpenComputerUse} />
      ) : null}

      {showStep1 ? (
        <SearchableSetting
          title={translate('auto.components.settings.BrowserUsePane.c6065d205d', 'Enable Orca CLI')}
          description={translate(
            'auto.components.settings.BrowserUsePane.c79eff0213',
            'Register the Orca CLI so agents can drive the browser.'
          )}
          keywords={getBrowserUsePaneSearchEntries()[0].keywords}
          className="rounded-xl border border-border/60 bg-card/50 p-4"
        >
          <div className="flex items-start gap-3">
            <StepBadge
              index={1}
              state={cliEnabled ? 'done' : cliBusy ? 'in-progress' : 'pending'}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">
                {translate('auto.components.settings.BrowserUsePane.c6065d205d', 'Enable Orca CLI')}
              </p>
              <p className="text-xs text-muted-foreground">
                {translate(
                  'auto.components.settings.BrowserUsePane.9fca1f7f5d',
                  'Registers the Orca CLI command so agents can orchestrate the browser from their shell.'
                )}
              </p>
              {cliStatus?.commandPath && cliEnabled ? (
                <p className="text-[11px] text-muted-foreground">
                  {translate('auto.components.settings.BrowserUsePane.e9f3f3b488', 'Installed at')}{' '}
                  <code className="rounded bg-muted px-1 py-0.5">{cliStatus.commandPath}</code>
                </p>
              ) : null}
              {cliPathNeedsAttention && cliStatus?.detail ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">{cliStatus.detail}</p>
              ) : null}
            </div>
            <TooltipProvider delayDuration={250}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      variant={cliEnabled ? 'outline' : 'default'}
                      disabled={cliLoading || cliBusy || !cliSupported || cliEnabled}
                      onClick={() => void handleEnableCli()}
                    >
                      {cliBusy
                        ? translate(
                            'auto.components.settings.BrowserUsePane.8b3054dac7',
                            'Registering...'
                          )
                        : cliEnabled
                          ? translate(
                              'auto.components.settings.BrowserUsePane.0289434ed6',
                              'Enabled'
                            )
                          : cliPathNeedsAttention
                            ? translate(
                                'auto.components.settings.BrowserUsePane.ad8cb0ee22',
                                'Fix PATH'
                              )
                            : translate(
                                'auto.components.settings.BrowserUsePane.de9b2f32f3',
                                'Enable'
                              )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {!cliSupported && !cliLoading && cliStatus?.detail ? (
                  <TooltipContent side="left" sideOffset={6}>
                    {cliStatus.detail}
                  </TooltipContent>
                ) : null}
              </Tooltip>
            </TooltipProvider>
          </div>
        </SearchableSetting>
      ) : null}

      {showStep2 ? (
        <SearchableSetting
          title={translate(
            'auto.components.settings.BrowserUsePane.2d6ead9ab2',
            'Install Browser Use Skill'
          )}
          description={translate(
            'auto.components.settings.BrowserUsePane.68ea76eb71',
            "Install the Browser Use skill so agents can operate Orca's browser."
          )}
          keywords={getBrowserUsePaneSearchEntries()[1].keywords}
          className={cn(
            'rounded-xl border border-border/60 bg-card/50 p-4',
            step2Blocked && 'opacity-60'
          )}
        >
          <BrowserUseSkillStep
            command={ORCA_CLI_SKILL_INSTALL_COMMAND}
            skillDetected={skillDetected}
            skillLoading={skillLoading}
            skillError={skillError}
            disabled={step2Blocked}
            preInstallNotice={AGENT_SKILL_CLI_PREREQUISITE_NOTICE}
            onBeforeOpenTerminal={async () => {
              useAppStore.getState().recordFeatureInteraction('agent-browser-setup')
              await ensureOrcaCliAvailableForAgentSkillTerminal({
                onStatusChange: handleCliStatusChange
              })
            }}
            onRecheck={refreshSkill}
          />
        </SearchableSetting>
      ) : null}

      {showStep3 ? (
        <SearchableSetting
          title={translate(
            'auto.components.settings.BrowserUsePane.2eb906706c',
            'Import Browser Cookies'
          )}
          description={translate(
            'auto.components.settings.BrowserUsePane.af8c83ed61',
            'Import cookies from Chrome, Edge, or other browsers so agents can reuse your logins.'
          )}
          keywords={getBrowserUsePaneSearchEntries()[2].keywords}
          className={cn(
            'rounded-xl border border-border/60 bg-card/50 p-4',
            step3Blocked && 'opacity-60'
          )}
        >
          <div className="flex items-start gap-3">
            <StepBadge
              index={3}
              state={cookiesImported ? 'done' : isImportingDefault ? 'in-progress' : 'pending'}
            />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium">
                {translate(
                  'auto.components.settings.BrowserUsePane.2eb906706c',
                  'Import Browser Cookies'
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {translate(
                  'auto.components.settings.BrowserUsePane.72d4815523',
                  'Bring your existing logins into Orca so agents can reach authenticated pages. Imports into the default profile.'
                )}
              </p>
              {sourceLabel ? (
                <p className="text-[11px] text-muted-foreground">
                  {translate(
                    'auto.components.settings.BrowserUsePane.112f70adc4',
                    'Last imported from'
                  )}
                  {sourceLabel}
                </p>
              ) : null}
              {onConfigureMoreBrowsers ? (
                <button
                  type="button"
                  onClick={onConfigureMoreBrowsers}
                  className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                >
                  {translate(
                    'auto.components.settings.BrowserUsePane.67d9a53f47',
                    'Manage profiles for separate logins'
                  )}
                </button>
              ) : null}
            </div>
            <DropdownMenu
              onOpenChange={(open) => {
                if (open) {
                  // Why: macOS treats other browsers' profile folders as app
                  // data. Only probe them when the user opens the import menu.
                  void fetchDetectedBrowsers()
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant={cookiesImported ? 'outline' : 'default'}
                  size="sm"
                  disabled={isImportingDefault}
                  className="gap-1.5"
                >
                  {isImportingDefault ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Import className="size-3.5" />
                  )}
                  {cookiesImported
                    ? translate('auto.components.settings.BrowserUsePane.0462565413', 'Re-import')
                    : translate('auto.components.settings.BrowserUsePane.2ccfc9cff8', 'Import')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {detectedBrowsers.map((browser) =>
                  browser.profiles.length > 1 ? (
                    <DropdownMenuSub key={browser.family}>
                      <DropdownMenuSubTrigger>
                        {translate('auto.components.settings.BrowserUsePane.e44c5d681e', 'From')}
                        {browser.label}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {browser.profiles.map((bp) => (
                            <DropdownMenuItem
                              key={bp.directory}
                              onSelect={() =>
                                void handleImportFromBrowser(browser.family, bp.directory)
                              }
                            >
                              {bp.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  ) : (
                    <DropdownMenuItem
                      key={browser.family}
                      onSelect={() => void handleImportFromBrowser(browser.family)}
                    >
                      {translate('auto.components.settings.BrowserUsePane.e44c5d681e', 'From')}
                      {browser.label}
                    </DropdownMenuItem>
                  )
                )}
                {detectedBrowsers.length > 0 ? <DropdownMenuSeparator /> : null}
                <DropdownMenuItem onSelect={() => void handleImportFromFile()}>
                  {translate('auto.components.settings.BrowserUsePane.be6df68384', 'From File…')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SearchableSetting>
      ) : null}

      <BrowserUseExamples />
    </div>
  )
}
