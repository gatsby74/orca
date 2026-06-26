import type { CommandSpec } from '../args'

export const LOCALHOST_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['localhost', 'label'],
    summary: 'Print an Orca-labeled URL for a local workspace server',
    usage: 'orca localhost label --url <url> [--json]',
    allowedFlags: ['url'],
    notes: [
      'Only http localhost URLs with an explicit port can be labeled.',
      'If Orca cannot match the port to a workspace, the original URL is returned with a warning.'
    ],
    examples: ['orca localhost label --url http://localhost:5173']
  },
  {
    path: ['localhost', 'open'],
    summary: 'Open a local workspace server through its Orca-labeled URL',
    usage: 'orca localhost open --url <url> [--json]',
    allowedFlags: ['url'],
    notes: [
      'Use this instead of raw open/xdg-open/start for local dev servers so browser tabs include worktree labels.'
    ],
    examples: ['orca localhost open --url http://localhost:5173']
  }
]
