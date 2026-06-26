import type { CommandHandler } from '../dispatch'
import { printResult } from '../format'
import { getRequiredStringFlag } from '../flags'

type LocalhostUrlResult = {
  url: string
  labeled: boolean
  label?: string
}

function formatLocalhostUrlResult(result: LocalhostUrlResult): string {
  return result.labeled ? result.url : `${result.url}\nwarning: no Orca localhost label matched`
}

export const LOCALHOST_HANDLERS: Record<string, CommandHandler> = {
  'localhost label': async ({ flags, client, json }) => {
    const url = getRequiredStringFlag(flags, 'url')
    const result = await client.call<LocalhostUrlResult>('workspacePorts.labelLocalhostUrl', {
      url
    })
    printResult(result, json, formatLocalhostUrlResult)
  },
  'localhost open': async ({ flags, client, json }) => {
    const url = getRequiredStringFlag(flags, 'url')
    const result = await client.call<LocalhostUrlResult>('workspacePorts.openLocalhostUrl', {
      url
    })
    printResult(result, json, formatLocalhostUrlResult)
  }
}
