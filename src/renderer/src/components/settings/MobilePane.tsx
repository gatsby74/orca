import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Check, Copy, Maximize2, Smartphone, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useAppStore } from '../../store'
import { useMountedRef } from '@/hooks/useMountedRef'
import { useMobilePairingDevicePolling } from './mobile-pairing-device-polling'
import {
  selectRefreshedNetworkAddress,
  type MobileNetworkInterface
} from './mobile-network-interface-selection'
import { MobileNetworkInterfaceSection } from './MobileNetworkInterfaceSection'
import { translate } from '@/i18n/i18n'
export { getMobilePaneSearchEntries } from './mobile-pane-search'

// Why: the section heading "When you leave the mobile app" carries the
// "what happens" framing so the option labels only need to vary on the
// duration knob. Indefinite hold (`null`) is the default. Server clamps
// anything outside [5_000ms, 60min]. See docs/mobile-fit-hold.md.
const AUTO_RESTORE_FIT_OPTIONS: { value: string; label: string; ms: number | null }[] = [
  {
    value: 'indefinite',
    label: translate(
      'auto.components.settings.MobilePane.aa1263e881',
      'Keep at phone size (default)'
    ),
    ms: null
  },
  {
    value: '60s',
    label: translate('auto.components.settings.MobilePane.c474aa09d8', 'After 1 minute'),
    ms: 60_000
  },
  {
    value: '5m',
    label: translate('auto.components.settings.MobilePane.d4ba07d914', 'After 5 minutes'),
    ms: 5 * 60_000
  },
  {
    value: '30m',
    label: translate('auto.components.settings.MobilePane.ff865419dc', 'After 30 minutes'),
    ms: 30 * 60_000
  }
]

function autoRestoreValueFromMs(ms: number | null | undefined): string {
  if (ms == null) {
    return 'indefinite'
  }
  const exact = AUTO_RESTORE_FIT_OPTIONS.find((o) => o.ms === ms)
  return exact ? exact.value : 'indefinite'
}

type PairedDevice = {
  deviceId: string
  name: string
  pairedAt: number
  lastSeenAt: number
}

export function MobilePane(): React.JSX.Element {
  const autoRestoreFitMs = useAppStore((s) => s.settings?.mobileAutoRestoreFitMs ?? null)
  const updateSettings = useAppStore((s) => s.updateSettings)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [pairingUrl, setPairingUrl] = useState<string | null>(null)
  const [endpoint, setEndpoint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [devices, setDevices] = useState<PairedDevice[]>([])
  const [qrEnlarged, setQrEnlarged] = useState(false)
  const [networkInterfaces, setNetworkInterfaces] = useState<MobileNetworkInterface[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | undefined>(undefined)
  const [refreshingNetworkInterfaces, setRefreshingNetworkInterfaces] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [deviceCountAtQr, setDeviceCountAtQr] = useState<number | null>(null)
  const devicesRef = useRef<PairedDevice[]>([])
  const codeCopiedResetTimerRef = useRef<number | null>(null)
  const mountedRef = useMountedRef()
  // Why: clipboard IPC can resolve after settings navigation; avoid starting
  // a reset timer that will outlive this pane.
  const pairingCodeButtonMountedRef = useRef(false)

  const clearCodeCopiedResetTimer = useCallback((): void => {
    if (codeCopiedResetTimerRef.current !== null) {
      window.clearTimeout(codeCopiedResetTimerRef.current)
      codeCopiedResetTimerRef.current = null
    }
  }, [])

  const setPairingCodeButtonRef = useCallback(
    (node: HTMLButtonElement | null) => {
      pairingCodeButtonMountedRef.current = node !== null
      if (node === null) {
        clearCodeCopiedResetTimer()
      }
    },
    [clearCodeCopiedResetTimer]
  )

  const loadDevices = useCallback(async () => {
    try {
      const result = await window.api.mobile.listDevices()
      if (mountedRef.current) {
        devicesRef.current = result.devices
        setDevices(result.devices)
      }
    } catch {
      // Silently fail — device list is non-critical
    }
  }, [mountedRef])

  const loadNetworkInterfaces = useCallback(
    async (opts: { notifyOnError?: boolean } = {}) => {
      setRefreshingNetworkInterfaces(true)
      try {
        const result = await window.api.mobile.listNetworkInterfaces()
        if (mountedRef.current) {
          setNetworkInterfaces(result.interfaces)
          setSelectedAddress((currentAddress) =>
            selectRefreshedNetworkAddress(currentAddress, result.interfaces)
          )
        }
      } catch {
        if (opts.notifyOnError && mountedRef.current) {
          toast.error(
            translate(
              'auto.components.settings.MobilePane.d714614dbf',
              'Failed to refresh network interfaces'
            )
          )
        }
      } finally {
        if (mountedRef.current) {
          setRefreshingNetworkInterfaces(false)
        }
      }
    },
    [mountedRef]
  )

  const generateQR = useCallback(
    async (opts: { rotate?: boolean } = {}) => {
      setLoading(true)
      try {
        // Why: pass rotate=true on explicit Regenerate clicks so the runtime
        // invalidates any pending token (which may have been screenshotted or
        // copied to clipboard) and mints a fresh credential.
        const result = await window.api.mobile.getPairingQR({
          ...(selectedAddress ? { address: selectedAddress } : {}),
          ...(opts.rotate ? { rotate: true } : {})
        })
        if (result.available) {
          useAppStore.getState().recordFeatureInteraction('mobile-pairing')
          if (mountedRef.current) {
            setQrDataUrl(result.qrDataUrl)
            setPairingUrl(result.pairingUrl)
            setEndpoint(result.endpoint)
            // Why: async QR generation may overlap a device-list refresh; use
            // the latest committed list, then keep this baseline ahead of the
            // post-QR refresh below.
            setDeviceCountAtQr(devicesRef.current.length)
            clearCodeCopiedResetTimer()
            setCodeCopied(false)
            void loadDevices()
          }
        } else {
          if (mountedRef.current) {
            toast.error(
              translate(
                'auto.components.settings.MobilePane.cb9067c1c1',
                'WebSocket transport is not running'
              )
            )
          }
        }
      } catch {
        if (mountedRef.current) {
          toast.error(
            translate(
              'auto.components.settings.MobilePane.e3c427e020',
              'Failed to generate QR code'
            )
          )
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [clearCodeCopiedResetTimer, loadDevices, mountedRef, selectedAddress]
  )

  useEffect(() => {
    void loadDevices()
    void loadNetworkInterfaces()
  }, [loadDevices, loadNetworkInterfaces])

  useMobilePairingDevicePolling({
    deviceCountAtQr,
    currentDeviceCount: devices.length,
    loadDevices
  })

  async function copyPairingCode() {
    if (!pairingUrl) {
      return
    }
    try {
      // Why: Electron renderer's navigator.clipboard fails in some contexts
      // (no transient activation, non-secure context). Use the main-process
      // IPC clipboard which the rest of the app uses everywhere.
      await window.api.ui.writeClipboardText(pairingUrl)
      if (!pairingCodeButtonMountedRef.current) {
        return
      }
      clearCodeCopiedResetTimer()
      setCodeCopied(true)
      codeCopiedResetTimerRef.current = window.setTimeout(() => {
        codeCopiedResetTimerRef.current = null
        setCodeCopied(false)
      }, 2000)
    } catch {
      if (mountedRef.current) {
        toast.error(
          translate('auto.components.settings.MobilePane.711231348f', 'Failed to copy pairing code')
        )
      }
    }
  }

  async function revokeDevice(deviceId: string) {
    try {
      await window.api.mobile.revokeDevice({ deviceId })
      if (mountedRef.current) {
        setDevices((prev) => {
          const nextDevices = prev.filter((d) => d.deviceId !== deviceId)
          devicesRef.current = nextDevices
          return nextDevices
        })
        toast.success(translate('auto.components.settings.MobilePane.2e3dd0bc29', 'Device revoked'))
      }
    } catch {
      if (mountedRef.current) {
        toast.error(
          translate('auto.components.settings.MobilePane.870e1b5ca5', 'Failed to revoke device')
        )
      }
    }
  }

  return (
    <div className="space-y-6">
      <MobileNetworkInterfaceSection
        networkInterfaces={networkInterfaces}
        selectedAddress={selectedAddress}
        onSelectedAddressChange={setSelectedAddress}
        refreshingNetworkInterfaces={refreshingNetworkInterfaces}
        onRefreshNetworkInterfaces={() => void loadNetworkInterfaces({ notifyOnError: true })}
        loading={loading}
        hasQrCode={qrDataUrl != null}
        onGenerateQr={() => void generateQR({ rotate: qrDataUrl != null })}
      />

      {/* QR code display */}
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border/60 py-6">
          <button
            type="button"
            onClick={() => setQrEnlarged(true)}
            className="group relative cursor-pointer rounded-lg border border-border/60 bg-white p-3"
          >
            <img
              src={qrDataUrl}
              alt={translate(
                'auto.components.settings.MobilePane.6436e56546',
                'QR Code for mobile pairing'
              )}
              className="size-48"
            />
            <Maximize2 className="absolute top-1.5 right-1.5 size-3 text-black/30 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
          {endpoint && <span className="text-muted-foreground font-mono text-xs">{endpoint}</span>}
          <p className="text-muted-foreground max-w-xs text-center text-xs">
            {translate(
              'auto.components.settings.MobilePane.310924ad2c',
              'Scan this code with the Orca mobile app. Each code creates a unique device token.'
            )}
          </p>
          {pairingUrl && (
            <div className="flex w-full max-w-lg flex-col gap-1.5 px-4">
              <div className="text-muted-foreground text-center text-xs">
                {translate(
                  'auto.components.settings.MobilePane.e778ecb209',
                  'Or paste this code in the mobile app:'
                )}
              </div>
              <Button
                ref={setPairingCodeButtonRef}
                variant="outline"
                size="sm"
                onClick={() => void copyPairingCode()}
                className="font-mono text-[11px] leading-tight whitespace-normal break-all h-auto py-2 px-3"
              >
                <span className="flex-1 text-left">{pairingUrl}</span>
                {codeCopied ? (
                  <Check className="ml-2 size-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <Copy className="ml-2 size-3.5 shrink-0" />
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Paired devices */}
      <div>
        <h3 className="mb-2 text-sm font-medium">
          {translate('auto.components.settings.MobilePane.d7ce676270', 'Paired Devices')}
        </h3>
        {devices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {qrDataUrl
              ? translate(
                  'auto.components.settings.MobilePane.1592afcc7a',
                  'No devices paired yet. Scan the QR code with the Orca mobile app.'
                )
              : translate(
                  'auto.components.settings.MobilePane.1b1b70279a',
                  'No devices paired yet.'
                )}
          </p>
        ) : (
          <div className="space-y-2">
            {devices.map((device) => (
              <div
                key={device.deviceId}
                className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium">{device.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {translate('auto.components.settings.MobilePane.254a6d09e4', 'Paired')}
                    {new Date(device.pairedAt).toLocaleDateString()}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void revokeDevice(device.deviceId)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {devices.length > 0 && (
          <p className="text-muted-foreground mt-3 text-xs">
            {translate(
              'auto.components.settings.MobilePane.3939fd062c',
              'Revoking a device disconnects it immediately.'
            )}
          </p>
        )}
      </div>

      {/* Mobile behavior — terminal sizing when leaving the app */}
      <div className="rounded-lg border border-border/60 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Smartphone className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {translate(
              'auto.components.settings.MobilePane.ee56f1c7e4',
              'When you leave the mobile app'
            )}
          </span>
        </div>
        <p className="text-muted-foreground mb-3 text-xs">
          {translate(
            'auto.components.settings.MobilePane.35100bca5d',
            "While you're using a terminal on your phone, Orca shrinks it to fit your phone screen. When you close the app or switch away, this controls whether it stays at phone size (so interactive CLI tools don't reflow) or resizes back to your desktop. You can always click Restore on the terminal banner to resize it manually."
          )}
        </p>
        <Select
          value={autoRestoreValueFromMs(autoRestoreFitMs)}
          onValueChange={(v) => {
            const opt = AUTO_RESTORE_FIT_OPTIONS.find((o) => o.value === v)
            if (!opt) {
              return
            }
            void updateSettings({ mobileAutoRestoreFitMs: opt.ms })
          }}
        >
          <SelectTrigger size="sm" className="min-w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUTO_RESTORE_FIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Enlarged QR dialog */}
      <Dialog open={qrEnlarged} onOpenChange={setQrEnlarged}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {translate('auto.components.settings.MobilePane.dd3cd78d04', 'Scan with Orca Mobile')}
            </DialogTitle>
          </DialogHeader>
          {qrDataUrl && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg bg-white p-4">
                <img
                  src={qrDataUrl}
                  alt={translate(
                    'auto.components.settings.MobilePane.6436e56546',
                    'QR Code for mobile pairing'
                  )}
                  className="size-72"
                />
              </div>
              {endpoint && (
                <span className="text-muted-foreground font-mono text-xs">{endpoint}</span>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
