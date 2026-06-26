import { z } from 'zod'
import { defineMethod, type RpcMethod } from '../core'
import { OptionalString, requiredNumber } from '../schemas'

const WorkspacePortScanParams = z.object({
  repoId: OptionalString
})

const WorkspacePortKillParams = z.object({
  repoId: OptionalString,
  pid: requiredNumber('Missing process id'),
  port: requiredNumber('Missing port')
})

const WorkspacePortLocalhostUrlParams = z.object({
  url: z.string().min(1, 'Missing URL')
})

export const WORKSPACE_PORT_METHODS: RpcMethod[] = [
  defineMethod({
    name: 'workspacePorts.scan',
    params: WorkspacePortScanParams,
    handler: async (params, { runtime }) => runtime.scanWorkspacePorts(params.repoId)
  }),
  defineMethod({
    name: 'workspacePorts.kill',
    params: WorkspacePortKillParams,
    handler: async (params, { runtime }) =>
      runtime.killWorkspacePort({
        repoId: params.repoId,
        pid: params.pid,
        port: params.port
      })
  }),
  defineMethod({
    name: 'workspacePorts.labelLocalhostUrl',
    params: WorkspacePortLocalhostUrlParams,
    handler: async (params, { runtime }) => runtime.labelLocalhostUrl(params.url)
  }),
  defineMethod({
    name: 'workspacePorts.openLocalhostUrl',
    params: WorkspacePortLocalhostUrlParams,
    handler: async (params, { runtime }) => runtime.openLocalhostUrl(params.url)
  })
]
