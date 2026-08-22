import React from 'react'
import { Check, ChevronDown, Monitor, Server } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import type { ResourceManagerHost } from './resource-manager-hosts'

/**
 * Picks which machine the Resource Manager reports on. Hidden with a single
 * host so the header keeps its shape on the common local-only setup.
 */
export function ResourceManagerHostSwitcher({
  hosts,
  selectedHostId,
  onSelect
}: {
  hosts: readonly ResourceManagerHost[]
  selectedHostId: string
  onSelect: (hostId: string) => void
}): React.JSX.Element | null {
  if (hosts.length < 2) {
    return null
  }
  const selected = hosts.find((host) => host.id === selectedHostId) ?? hosts[0]
  const SelectedIcon = selected.kind === 'local' ? Monitor : Server

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex min-w-0 max-w-[10rem] items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={translate(
            'auto.components.status.bar.ResourceManagerHostSwitcher.pickHost',
            'Showing {{value0}}. Pick a host.',
            { value0: selected.label }
          )}
        >
          <SelectedIcon className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{selected.label}</span>
          <ChevronDown className="size-3 shrink-0" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      {/* Why: the popover body sits above the default menu layer; match the tooltip stacking used elsewhere in this panel. */}
      <DropdownMenuContent align="end" className="z-[70] min-w-[12rem]">
        {hosts.map((host) => {
          const HostIcon = host.kind === 'local' ? Monitor : Server
          const isSelected = host.id === selected.id
          return (
            <DropdownMenuItem
              key={host.id}
              onSelect={() => onSelect(host.id)}
              className="gap-2 text-xs"
            >
              <HostIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate">{host.label}</span>
              <Check className={cn('size-3 shrink-0', !isSelected && 'invisible')} aria-hidden />
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
