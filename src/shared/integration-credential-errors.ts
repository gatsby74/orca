export type IntegrationCredentialService = 'Linear' | 'Jira'

export type CredentialTokenProvenance =
  | 'decrypted'
  | 'plaintext-safeStorage-unavailable'
  | 'plaintext-after-decrypt-failure'

export function credentialDecryptionMessage(service: IntegrationCredentialService): string {
  return `Could not decrypt saved ${service} credential. Approve Keychain access or reconnect ${service}.`
}

export function isIntegrationCredentialDecryptionError(error: unknown): boolean {
  return integrationCredentialDecryptionErrorMessage(error) !== null
}

export function integrationCredentialDecryptionErrorMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error)
  const linearMessage = credentialDecryptionMessage('Linear')
  if (message.includes(linearMessage)) {
    return linearMessage
  }
  const jiraMessage = credentialDecryptionMessage('Jira')
  if (message.includes(jiraMessage)) {
    return jiraMessage
  }
  return null
}
