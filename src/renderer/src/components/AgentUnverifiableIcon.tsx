import React from 'react'
import { CircleDashed } from 'lucide-react'
import { cn } from '@/lib/utils'

// Why: "Orca cannot observe this agent" needs a glyph that is not a dot — the
// filled dot already means done/active and a dimmer one means inactive, so any
// third fill reads as a fourth shade of the same thing. A dashed ring reads as
// indeterminate at 8px. Quiet muted token, per STYLEGUIDE: color is reserved
// for state the user must act on, and this one is informational.

type AgentUnverifiableIconProps = React.ComponentProps<typeof CircleDashed>

export function AgentUnverifiableIcon({
  className,
  ...props
}: AgentUnverifiableIconProps): React.JSX.Element {
  return (
    <CircleDashed
      {...props}
      className={cn('text-muted-foreground', className)}
      aria-hidden="true"
    />
  )
}
