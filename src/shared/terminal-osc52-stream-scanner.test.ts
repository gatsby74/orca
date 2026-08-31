import { describe, expect, it } from 'vitest'
import {
  TerminalOsc52StreamScanner,
  isTerminalOsc52ClipboardQuery
} from './terminal-osc52-stream-scanner'

describe('TerminalOsc52StreamScanner', () => {
  it('identifies clipboard queries without accepting lookalikes', () => {
    expect(isTerminalOsc52ClipboardQuery('c;?')).toBe(true)
    expect(isTerminalOsc52ClipboardQuery('c;YQ==')).toBe(false)
  })

  it('extracts and strips OSC 52 while preserving surrounding output', () => {
    const scanner = new TerminalOsc52StreamScanner()

    expect(scanner.scan('before\x1b]52;c;Y29weQ==\x07after')).toEqual({
      passthrough: 'beforeafter',
      payloads: ['c;Y29weQ==']
    })
  })

  it('tracks split ST-terminated controls across chunks', () => {
    const scanner = new TerminalOsc52StreamScanner()

    expect(scanner.scan('a\x1b]52;c;Y2')).toEqual({ passthrough: 'a', payloads: [] })
    expect(scanner.scan('9weQ==\x1b')).toEqual({ passthrough: '', payloads: [] })
    expect(scanner.scan('\\b')).toEqual({ passthrough: 'b', payloads: ['c;Y29weQ=='] })
  })

  it('supports C1 OSC and ST controls', () => {
    const scanner = new TerminalOsc52StreamScanner()

    expect(scanner.scan('\x9d52;;YQ==\x9c')).toEqual({
      passthrough: '',
      payloads: [';YQ==']
    })
  })

  it('releases non-OSC-52 controls unchanged', () => {
    const scanner = new TerminalOsc52StreamScanner()

    expect(scanner.scan('\x1b]0;title\x07text')).toEqual({
      passthrough: '\x1b]0;title\x07text',
      payloads: []
    })
  })
})
