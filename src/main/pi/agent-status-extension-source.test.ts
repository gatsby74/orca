import { describe, expect, it } from 'vitest'

import { getPiAgentStatusExtensionSource } from './agent-status-extension-source'

describe('getPiAgentStatusExtensionSource', () => {
  it('keeps hook delivery non-blocking and bounded for Pi event handlers', () => {
    const source = getPiAgentStatusExtensionSource('pi')

    expect(source).toContain('const HOOK_POST_TIMEOUT_MS = 1000')
    expect(source).toContain('let postQueue = Promise.resolve()')
    expect(source).toContain('void postQueue')
    expect(source).toContain('new AbortController()')
    expect(source).toContain('controller.abort()')
    expect(source).not.toContain('await post(')
  })
})
