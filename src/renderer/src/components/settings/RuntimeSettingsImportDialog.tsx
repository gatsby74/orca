import { useEffect, useMemo, useState } from 'react'
import { Check, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { GlobalSettings } from '../../../../shared/types'
import {
  createPortableSettingsBundle,
  getPortableSettingsCategoryDifferences,
  PORTABLE_SETTINGS_CATEGORIES,
  type PortableSettingsBundle,
  type PortableSettingsCategory
} from '../../../../shared/portable-settings'
import { callRuntimeRpc } from '@/runtime/runtime-rpc-client'
import { translate } from '@/i18n/i18n'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../ui/dialog'
import { Label } from '../ui/label'

type PortableSettingsGetResult = { bundle: PortableSettingsBundle }
type PortableSettingsApplyResult = {
  bundle: PortableSettingsBundle
  appliedCategories: PortableSettingsCategory[]
}

type CategoryPreview = {
  category: PortableSettingsCategory
  differences: string[]
}

export function RuntimeSettingsImportDialog({
  environmentId,
  environmentName,
  settings,
  onClose
}: {
  environmentId: string
  environmentName: string
  settings: GlobalSettings
  onClose: () => void
}): React.JSX.Element {
  const [localBundle, setLocalBundle] = useState<PortableSettingsBundle | null>(null)
  const [remoteBundle, setRemoteBundle] = useState<PortableSettingsBundle | null>(null)
  const [selected, setSelected] = useState<PortableSettingsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      setLoading(true)
      setError(null)
      try {
        const [keybindings, remote] = await Promise.all([
          window.api.keybindings.get(),
          callRuntimeRpc<PortableSettingsGetResult>(
            { kind: 'environment', environmentId },
            'settings.portable.get',
            undefined,
            { timeoutMs: 15_000 }
          )
        ])
        if (cancelled) {
          return
        }
        const local = createPortableSettingsBundle(settings, keybindings)
        setLocalBundle(local)
        setRemoteBundle(remote.bundle)
        setSelected(
          PORTABLE_SETTINGS_CATEGORIES.filter(
            (category) =>
              getPortableSettingsCategoryDifferences(local, remote.bundle, category).length > 0
          )
        )
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : translate(
                  'auto.components.settings.RuntimeSettingsImportDialog.loadFailed',
                  'Could not compare settings with this server.'
                )
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [environmentId, reloadToken, settings])

  const previews = useMemo<CategoryPreview[]>(
    () =>
      localBundle && remoteBundle
        ? PORTABLE_SETTINGS_CATEGORIES.map((category) => ({
            category,
            differences: getPortableSettingsCategoryDifferences(localBundle, remoteBundle, category)
          }))
        : [],
    [localBundle, remoteBundle]
  )

  const selectedSet = useMemo(() => new Set(selected), [selected])

  const apply = async (): Promise<void> => {
    if (!localBundle || selected.length === 0 || applying) {
      return
    }
    setApplying(true)
    setError(null)
    try {
      await callRuntimeRpc<PortableSettingsApplyResult>(
        { kind: 'environment', environmentId },
        'settings.portable.apply',
        { categories: selected, bundle: localBundle },
        { timeoutMs: 15_000 }
      )
      toast.success(
        translate(
          'auto.components.settings.RuntimeSettingsImportDialog.success',
          'Imported settings to {{value0}}.',
          { value0: environmentName }
        )
      )
      onClose()
    } catch (applyError) {
      setError(
        applyError instanceof Error
          ? applyError.message
          : translate(
              'auto.components.settings.RuntimeSettingsImportDialog.applyFailed',
              'Could not import settings to this server.'
            )
      )
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !nextOpen && !applying && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {translate(
              'auto.components.settings.RuntimeSettingsImportDialog.title',
              'Import settings to {{value0}}',
              { value0: environmentName }
            )}
          </DialogTitle>
          <DialogDescription>
            {translate(
              'auto.components.settings.RuntimeSettingsImportDialog.description',
              'Preview portable preferences from this machine, then choose what the linked server should adopt.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="flex gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            <span>
              {translate(
                'auto.components.settings.RuntimeSettingsImportDialog.security',
                'Accounts, credentials, secrets, machine paths, histories, and integration sessions are never included.'
              )}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {translate(
              'auto.components.settings.RuntimeSettingsImportDialog.comparing',
              'Comparing settings…'
            )}
          </div>
        ) : error && previews.length === 0 ? (
          <div className="flex min-h-24 items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <span>{error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReloadToken((value) => value + 1)}
            >
              {translate('auto.components.settings.RuntimeSettingsImportDialog.retry', 'Try again')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {previews.map(({ category, differences }) => {
              const copy = getCategoryCopy(category)
              const checked = selectedSet.has(category)
              const matches = differences.length === 0
              return (
                <div
                  key={category}
                  className="flex items-start gap-3 rounded-md border border-border px-3 py-2.5"
                >
                  <Checkbox
                    id={`portable-settings-${category}`}
                    className="mt-0.5"
                    checked={checked}
                    disabled={matches || applying}
                    onCheckedChange={(nextChecked) =>
                      setSelected((current) =>
                        nextChecked === true
                          ? Array.from(new Set([...current, category]))
                          : current.filter((entry) => entry !== category)
                      )
                    }
                  />
                  <Label
                    htmlFor={`portable-settings-${category}`}
                    className="min-w-0 flex-1 cursor-pointer space-y-1"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{copy.title}</span>
                      {matches ? (
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          <Check className="size-3" />
                          {translate(
                            'auto.components.settings.RuntimeSettingsImportDialog.matches',
                            'Matches'
                          )}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[11px]">
                          {differences.length === 1
                            ? translate(
                                'auto.components.settings.RuntimeSettingsImportDialog.change',
                                '1 change'
                              )
                            : translate(
                                'auto.components.settings.RuntimeSettingsImportDialog.changes',
                                '{{value0}} changes',
                                { value0: differences.length }
                              )}
                        </Badge>
                      )}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {copy.description}
                    </span>
                  </Label>
                </div>
              )
            })}
          </div>
        )}

        {error && previews.length > 0 ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={applying}>
            {translate('auto.components.settings.RuntimeSettingsImportDialog.cancel', 'Cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => void apply()}
            disabled={loading || applying || selected.length === 0}
          >
            {applying ? <Loader2 className="animate-spin" /> : null}
            {translate(
              'auto.components.settings.RuntimeSettingsImportDialog.import',
              'Import selected'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getCategoryCopy(category: PortableSettingsCategory): {
  title: string
  description: string
} {
  switch (category) {
    case 'appearance':
      return {
        title: translate(
          'auto.components.settings.RuntimeSettingsImportDialog.appearance',
          'Appearance'
        ),
        description: translate(
          'auto.components.settings.RuntimeSettingsImportDialog.appearanceHelp',
          'Theme, fonts, terminal visuals, diff layout, and sidebar presentation.'
        )
      }
    case 'input':
      return {
        title: translate(
          'auto.components.settings.RuntimeSettingsImportDialog.input',
          'Input and shortcuts'
        ),
        description: translate(
          'auto.components.settings.RuntimeSettingsImportDialog.inputHelp',
          'Keyboard shortcuts, editor behavior, terminal scrolling, mouse, and paste preferences.'
        )
      }
    case 'workflow':
      return {
        title: translate(
          'auto.components.settings.RuntimeSettingsImportDialog.workflow',
          'Agents and workflow'
        ),
        description: translate(
          'auto.components.settings.RuntimeSettingsImportDialog.workflowHelp',
          'Agent defaults, Git behavior, task views, prompt cache, and tab preferences.'
        )
      }
  }
}
