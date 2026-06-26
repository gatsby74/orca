import http, { type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import https from 'node:https'
import net from 'node:net'
import type { Duplex } from 'node:stream'
import { URL } from 'node:url'
import type {
  LocalhostWorktreeLabelResult,
  LocalhostWorktreeLabelRoute
} from '../shared/localhost-worktree-labels'
import {
  getLocalhostWorktreeHostLabel,
  getLocalhostWorktreeRouteKey
} from '../shared/localhost-worktree-labels'
import { createLocalhostWorktreeFaviconDataUrl } from './localhost-worktree-label-favicon'

type RegisteredRoute = LocalhostWorktreeLabelRoute & {
  label: string
  routeKey: string
  target: URL
  faviconHref: string
}

const ORCA_LOCALHOST_SUFFIX = '.orca.localhost'
const HTML_CONTENT_TYPE_PATTERN = /\btext\/html\b/i
const TITLE_FALLBACK_PATTERN = /^(?:https?:\/\/)?(?:localhost|127\.0\.0\.1|\[::1\])/i

export class LocalhostWorktreeLabelProxy {
  private server: Server | null = null
  private listenPort: number | null = null
  private readonly routes = new Map<string, RegisteredRoute>()
  private readonly routeKeys = new Map<string, string>()

  async registerRoute(route: LocalhostWorktreeLabelRoute): Promise<LocalhostWorktreeLabelResult> {
    const target = parseTargetUrl(route.targetUrl)
    await this.ensureServer()
    const baseLabel = getLocalhostWorktreeHostLabel(route)
    const routeKey = getLocalhostWorktreeRouteKey(route)
    const previousLabel = this.routeKeys.get(routeKey)
    const label = previousLabel ?? this.nextAvailableLabel(baseLabel)
    const registered: RegisteredRoute = {
      ...route,
      label,
      routeKey,
      target,
      faviconHref: createLocalhostWorktreeFaviconDataUrl({
        repoIcon: route.repoIcon,
        badgeColor: route.badgeColor,
        projectName: route.projectName
      })
    }
    this.routes.set(label, registered)
    this.routeKeys.set(routeKey, label)
    return {
      label,
      url: this.buildLabeledUrl(label, target)
    }
  }

  private async ensureServer(): Promise<void> {
    if (this.server && this.listenPort !== null) {
      return
    }

    const server = http.createServer((request, response) => {
      void this.handleRequest(request, response)
    })
    server.on('upgrade', (request, socket, head) => {
      this.handleUpgrade(request, socket, head)
    })
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', () => {
        server.off('error', reject)
        const address = server.address()
        if (!address || typeof address === 'string') {
          reject(new Error('Failed to start localhost label proxy.'))
          return
        }
        this.listenPort = address.port
        this.server = server
        resolve()
      })
    })
  }

  private nextAvailableLabel(baseLabel: string): string {
    if (!this.routes.has(baseLabel)) {
      return baseLabel
    }
    for (let index = 2; index < 1000; index += 1) {
      const candidate = `${baseLabel}-${index}`
      if (!this.routes.has(candidate)) {
        return candidate
      }
    }
    throw new Error('No available localhost label.')
  }

  private buildLabeledUrl(label: string, target: URL): string {
    if (this.listenPort === null) {
      throw new Error('Localhost label proxy is not running.')
    }
    const url = new URL(target.toString())
    url.hostname = `${label}${ORCA_LOCALHOST_SUFFIX}`
    url.port = String(this.listenPort)
    return url.toString()
  }

  private async handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const route = this.routeForRequest(request)
    if (!route) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
      response.end('Unknown Orca localhost label.')
      return
    }

    const target = targetUrlForRequest(route.target, request)
    const proxyRequest = requestForTarget(target, {
      method: request.method,
      headers: requestHeadersForTarget(request, route.target)
    })

    proxyRequest.on('response', (proxyResponse) => {
      const headers = responseHeaders(proxyResponse.headers)
      const contentType = String(proxyResponse.headers['content-type'] ?? '')
      if (!HTML_CONTENT_TYPE_PATTERN.test(contentType)) {
        response.writeHead(proxyResponse.statusCode ?? 502, headers)
        proxyResponse.pipe(response)
        return
      }

      const chunks: Buffer[] = []
      proxyResponse.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      proxyResponse.on('end', () => {
        const html = Buffer.concat(chunks).toString('utf8')
        response.writeHead(proxyResponse.statusCode ?? 200, htmlResponseHeaders(headers))
        response.end(injectLocalhostLabelHtml(html, route))
      })
    })
    proxyRequest.on('error', (error) => {
      response.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' })
      response.end(`Proxy failed for ${route.label}: ${error.message}`)
    })
    request.pipe(proxyRequest)
  }

  private handleUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void {
    const route = this.routeForRequest(request)
    if (!route) {
      socket.destroy()
      return
    }

    const target = targetUrlForRequest(route.target, request)
    const targetPort = Number(target.port || (target.protocol === 'https:' ? 443 : 80))
    const targetSocket = net.connect(targetPort, target.hostname, () => {
      const headers = requestHeadersForTarget(request, route.target)
      targetSocket.write(
        `${request.method ?? 'GET'} ${target.pathname}${target.search} HTTP/${request.httpVersion}\r\n`
      )
      for (const [name, value] of Object.entries(headers)) {
        if (Array.isArray(value)) {
          for (const entry of value) {
            targetSocket.write(`${name}: ${entry}\r\n`)
          }
        } else if (value !== undefined) {
          targetSocket.write(`${name}: ${value}\r\n`)
        }
      }
      targetSocket.write('\r\n')
      if (head.length > 0) {
        targetSocket.write(head)
      }
      targetSocket.pipe(socket)
      socket.pipe(targetSocket)
    })
    targetSocket.on('error', () => socket.destroy())
  }

  private routeForRequest(request: IncomingMessage): RegisteredRoute | null {
    const host =
      String(request.headers.host ?? '')
        .split(':')[0]
        ?.toLowerCase() ?? ''
    if (!host.endsWith(ORCA_LOCALHOST_SUFFIX)) {
      return null
    }
    const label = host.slice(0, -ORCA_LOCALHOST_SUFFIX.length)
    return this.routes.get(label) ?? null
  }
}

export const localhostWorktreeLabelProxy = new LocalhostWorktreeLabelProxy()

function parseTargetUrl(rawUrl: string): URL {
  const url = new URL(rawUrl)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) workspace ports can be labeled.')
  }
  return url
}

function requestForTarget(
  target: URL,
  options: { method?: string; headers: http.OutgoingHttpHeaders }
): http.ClientRequest {
  const requestOptions = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    path: `${target.pathname}${target.search}`,
    method: options.method,
    headers: options.headers
  }
  return target.protocol === 'https:' ? https.request(requestOptions) : http.request(requestOptions)
}

function targetUrlForRequest(target: URL, request: IncomingMessage): URL {
  const url = new URL(target.toString())
  const incomingUrl = new URL(request.url || '/', target)
  url.pathname = incomingUrl.pathname
  url.search = incomingUrl.search
  return url
}

function requestHeadersForTarget(request: IncomingMessage, target: URL): http.OutgoingHttpHeaders {
  const headers: http.OutgoingHttpHeaders = { ...request.headers }
  headers.host = target.host
  headers['accept-encoding'] = 'identity'
  return headers
}

function responseHeaders(headers: http.IncomingHttpHeaders): http.OutgoingHttpHeaders {
  const next: http.OutgoingHttpHeaders = { ...headers }
  delete next['content-length']
  delete next['content-encoding']
  delete next['content-security-policy']
  return next
}

function htmlResponseHeaders(headers: http.OutgoingHttpHeaders): http.OutgoingHttpHeaders {
  return {
    ...headers,
    'content-type': 'text/html; charset=utf-8'
  }
}

function escapeScriptString(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function injectLocalhostLabelHtml(html: string, route: RegisteredRoute): string {
  const label = `[${route.label}]`
  const script = `<script>(()=>{const p=${escapeScriptString(label)};const isBad=t=>!t||${TITLE_FALLBACK_PATTERN.toString()}.test(t);let last='';const apply=()=>{const raw=(document.title||'').trim();if(raw&&!raw.startsWith(p)&&!isBad(raw))last=raw;const title=last||raw||${escapeScriptString(route.projectName)};if(!title.startsWith(p))document.title=p+' '+title};new MutationObserver(apply).observe(document.querySelector('title')||document.documentElement,{childList:true,subtree:true,characterData:true});apply();})();</script>`
  const favicon = `<link rel="icon" href="${route.faviconHref}">`
  const injection = `${favicon}${script}`
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${injection}</head>`)
  }
  return `${injection}${html}`
}
