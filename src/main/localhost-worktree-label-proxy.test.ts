import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { injectLocalhostLabelHtml } from './localhost-worktree-label-proxy'

describe('localhost worktree label proxy', () => {
  it('does not repeatedly rewrite an already-prefixed page title', () => {
    const html = injectLocalhostLabelHtml('<html><head></head><body></body></html>', {
      faviconHref: 'data:image/svg+xml,<svg></svg>',
      label: 'ui-auth',
      projectName: 'snapstudio'
    })
    const script = extractInjectedScript(html)
    const document = createTitleDocument('Snap Studio')
    let observer: (() => void) | null = null

    class MutationObserver {
      constructor(callback: () => void) {
        observer = callback
      }

      observe(): void {}
    }

    document.onTitleWrite = () => {
      if (document.titleWrites > 2) {
        throw new Error('Title label script rewrote the same prefixed title repeatedly.')
      }
      observer?.()
    }

    runInNewContext(script, { document, MutationObserver })

    expect(document.title).toBe('[ui-auth] Snap Studio')
    expect(document.titleWrites).toBe(1)
  })
})

function extractInjectedScript(html: string): string {
  const match = /<script>(?<script>[\s\S]*?)<\/script>/.exec(html)
  if (!match?.groups?.script) {
    throw new Error('Injected script was not found.')
  }
  return match.groups.script
}

function createTitleDocument(initialTitle: string): {
  readonly documentElement: object
  onTitleWrite: () => void
  querySelector: () => object
  title: string
  titleWrites: number
} {
  let title = initialTitle
  const document = {
    documentElement: {},
    onTitleWrite: () => {},
    querySelector: () => ({}),
    get title() {
      return title
    },
    set title(nextTitle: string) {
      title = nextTitle
      document.titleWrites += 1
      document.onTitleWrite()
    },
    titleWrites: 0
  }
  return document
}
