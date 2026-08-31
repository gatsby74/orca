const OSC52_PREFIX = '52;'
const MAX_OSC52_SEQUENCE_CHARS = 128 * 1024 + 64

type ScanMode = 'plain' | 'escape' | 'prefix' | 'payload' | 'payload-escape'

export type TerminalOsc52ScanResult = {
  passthrough: string
  payloads: string[]
}

export function isTerminalOsc52ClipboardQuery(payload: string): boolean {
  const separator = payload.indexOf(';')
  return separator !== -1 && payload.slice(separator + 1) === '?'
}

/** Finds complete OSC 52 controls across PTY chunk boundaries. */
export class TerminalOsc52StreamScanner {
  private mode: ScanMode = 'plain'
  private candidate = ''
  private prefixOffset = 0
  private payloadOffset = 0

  scan(data: string): TerminalOsc52ScanResult {
    let passthrough = ''
    const payloads: string[] = []

    const reset = (): void => {
      this.mode = 'plain'
      this.candidate = ''
      this.prefixOffset = 0
      this.payloadOffset = 0
    }
    const restartOrRelease = (last: string): void => {
      const failed = this.candidate
      reset()
      if (last === '\x1b') {
        passthrough += failed.slice(0, -1)
        this.candidate = last
        this.mode = 'escape'
      } else if (last === '\x9d') {
        passthrough += failed.slice(0, -1)
        this.candidate = last
        this.mode = 'prefix'
      } else {
        passthrough += failed
      }
    }
    const enforceLimit = (): void => {
      if (this.candidate.length <= MAX_OSC52_SEQUENCE_CHARS) {
        return
      }
      passthrough += this.candidate
      reset()
    }

    for (const char of data) {
      if (this.mode === 'plain') {
        if (char === '\x1b') {
          this.candidate = char
          this.mode = 'escape'
        } else if (char === '\x9d') {
          this.candidate = char
          this.mode = 'prefix'
        } else {
          passthrough += char
        }
        continue
      }

      if (this.mode === 'escape') {
        this.candidate += char
        if (char === ']') {
          this.mode = 'prefix'
        } else {
          restartOrRelease(char)
        }
        continue
      }

      if (this.mode === 'prefix') {
        this.candidate += char
        if (char !== OSC52_PREFIX[this.prefixOffset]) {
          restartOrRelease(char)
          continue
        }
        this.prefixOffset += 1
        if (this.prefixOffset === OSC52_PREFIX.length) {
          this.payloadOffset = this.candidate.length
          this.mode = 'payload'
        }
        continue
      }

      if (this.mode === 'payload') {
        if (char === '\x07' || char === '\x9c') {
          payloads.push(this.candidate.slice(this.payloadOffset))
          reset()
          continue
        }
        this.candidate += char
        if (char === '\x1b') {
          this.mode = 'payload-escape'
        }
        enforceLimit()
        continue
      }

      if (char === '\\') {
        payloads.push(this.candidate.slice(this.payloadOffset, -1))
        reset()
        continue
      }
      this.candidate += char
      this.mode = char === '\x1b' ? 'payload-escape' : 'payload'
      enforceLimit()
    }

    return { passthrough, payloads }
  }

  reset(): void {
    this.mode = 'plain'
    this.candidate = ''
    this.prefixOffset = 0
    this.payloadOffset = 0
  }
}
