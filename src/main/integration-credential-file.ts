import { safeStorage } from 'electron'
import {
  credentialDecryptionMessage,
  type CredentialTokenProvenance,
  type IntegrationCredentialService
} from '../shared/integration-credential-errors'

export type StoredCredentialToken = {
  token: string
  provenance: CredentialTokenProvenance
}

export class CredentialDecryptionError extends Error {
  constructor(service: IntegrationCredentialService) {
    super(credentialDecryptionMessage(service))
    this.name = 'CredentialDecryptionError'
  }
}

export function readStoredCredentialToken(
  service: IntegrationCredentialService,
  raw: Buffer
): StoredCredentialToken | null {
  if (raw.length === 0) {
    return null
  }

  if (safeStorage.isEncryptionAvailable()) {
    try {
      return usableToken(safeStorage.decryptString(raw), 'decrypted')
    } catch {
      return readPlaintextLegacyCredential(service, raw, 'plaintext-after-decrypt-failure')
    }
  }

  return readPlaintextLegacyCredential(service, raw, 'plaintext-safeStorage-unavailable')
}

function readPlaintextLegacyCredential(
  service: IntegrationCredentialService,
  raw: Buffer,
  provenance: CredentialTokenProvenance
): StoredCredentialToken | null {
  const plaintext = decodeUtf8(raw)
  // Why: legacy plaintext tokens are printable UTF-8; safeStorage ciphertext
  // such as macOS v10 blobs must not be decoded into auth-header junk.
  if (plaintext === null || hasControlCharacter(plaintext)) {
    throw new CredentialDecryptionError(service)
  }
  return usableToken(plaintext, provenance)
}

function usableToken(
  token: string,
  provenance: CredentialTokenProvenance
): StoredCredentialToken | null {
  return token.length > 0 ? { token, provenance } : null
}

function decodeUtf8(raw: Buffer): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(raw)
  } catch {
    return null
  }
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 0x20 || code === 0x7f) {
      return true
    }
  }
  return false
}
