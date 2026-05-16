import type React from 'react'
import {
  ArchiveRestore,
  Calendar,
  ChevronRight,
  Clock3,
  FolderOpen,
  ListFilter,
  LoaderCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { AgentIcon } from '@/lib/agent-catalog'
import { cn } from '@/lib/utils'
import {
  AI_VAULT_AGENTS,
  type AiVaultAgent,
  type AiVaultGroup,
  type AiVaultScope,
  type AiVaultSort
} from '../../../../shared/ai-vault-types'
import { agentLabel, type AiVaultSessionGroup } from './ai-vault-session-filters'

export function VaultGroupHeader({
  group,
  collapsed,
  onToggle
}: {
  group: AiVaultSessionGroup
  collapsed: boolean
  onToggle: () => void
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="flex h-7 w-full items-center gap-1.5 border-y border-sidebar-border bg-sidebar-accent/25 px-2.5 text-left text-[11px] font-semibold text-sidebar-foreground hover:bg-sidebar-accent/45"
      onClick={onToggle}
    >
      <ChevronRight className={cn('size-3 transition-transform', !collapsed && 'rotate-90')} />
      <span className="min-w-0 flex-1 truncate">{group.label}</span>
      <span className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] leading-none text-sidebar-accent-foreground">
        {group.sessions.length}
      </span>
    </button>
  )
}

export function SessionLoadingState(): React.JSX.Element {
  return (
    <div className="px-3 py-3" aria-busy="true">
      <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" />
        <span>Scanning sessions</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="mt-1 size-4 rounded-full bg-sidebar-accent" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3 w-4/5 rounded-sm bg-sidebar-accent" />
              <div className="h-2.5 w-3/5 rounded-sm bg-sidebar-accent/75" />
              <div className="h-2.5 w-2/5 rounded-sm bg-sidebar-accent/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function VaultScopeSwitch({
  scope,
  workspaceAvailable,
  onScopeChange
}: {
  scope: AiVaultScope
  workspaceAvailable: boolean
  onScopeChange: (scope: AiVaultScope) => void
}): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 min-w-9 shrink-0 border-sidebar-border bg-sidebar-accent/35 px-2 text-[11px] font-medium text-foreground shadow-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={`Session History scope: ${scope === 'workspace' ? 'current workspace' : 'all sessions'}`}
        >
          {scope === 'workspace' ? 'This' : 'All'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-48">
        <DropdownMenuLabel>Scope</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={scope}
          onValueChange={(value) => onScopeChange(value as AiVaultScope)}
        >
          <DropdownMenuRadioItem value="workspace" disabled={!workspaceAvailable}>
            Current workspace
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="all">All sessions</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function VaultViewMenu({
  agents,
  sort,
  group,
  adjustmentCount,
  onAgentEnabledChange,
  onSortChange,
  onGroupChange,
  onReset
}: {
  agents: readonly AiVaultAgent[]
  sort: AiVaultSort
  group: AiVaultGroup
  adjustmentCount: number
  onAgentEnabledChange: (agent: AiVaultAgent, enabled: boolean) => void
  onSortChange: (sort: AiVaultSort) => void
  onGroupChange: (group: AiVaultGroup) => void
  onReset: () => void
}): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="relative size-7 border-sidebar-border bg-sidebar-accent/35 text-foreground shadow-xs hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Session History view options"
        >
          <ListFilter className="size-3.5" />
          <span className="sr-only">View options</span>
          {adjustmentCount > 0 ? (
            <span
              aria-hidden
              className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-medium leading-none text-primary-foreground"
            >
              {adjustmentCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56">
        <DropdownMenuLabel>Agents</DropdownMenuLabel>
        {AI_VAULT_AGENTS.map((agent) => (
          <DropdownMenuCheckboxItem
            key={agent}
            checked={agents.includes(agent)}
            disabled={agents.length === 1 && agents.includes(agent)}
            onCheckedChange={(checked) => onAgentEnabledChange(agent, checked === true)}
            onSelect={(event) => event.preventDefault()}
          >
            <AgentIcon agent={agent} size={14} />
            {agentLabel(agent)}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sort</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(value) => onSortChange(value as AiVaultSort)}
        >
          <DropdownMenuRadioItem value="updated">
            <Clock3 className="size-3.5" />
            Last updated
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="created">
            <Calendar className="size-3.5" />
            Created
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Group</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={group}
          onValueChange={(value) => onGroupChange(value as AiVaultGroup)}
        >
          <DropdownMenuRadioItem value="folder">
            <FolderOpen className="size-3.5" />
            Folder
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="agent">
            <ArchiveRestore className="size-3.5" />
            Agent
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        {adjustmentCount > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onReset}>Reset view</DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function EmptyState({ title }: { title: string }): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center text-muted-foreground">
      <ArchiveRestore className="mb-3 size-7 opacity-50" />
      <p className="text-sm font-medium">{title}</p>
    </div>
  )
}
