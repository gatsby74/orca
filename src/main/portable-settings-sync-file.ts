import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  PORTABLE_SETTINGS_SYNC_VERSION,
  PortableSettingsSyncStoreSchema,
  type PortableSettingsSyncRule
} from '../shared/portable-settings-sync'

export function readPortableSettingsSyncRules(configPath: string): PortableSettingsSyncRule[] {
  if (!existsSync(configPath)) {
    return []
  }
  try {
    const parsed = PortableSettingsSyncStoreSchema.safeParse(
      JSON.parse(readFileSync(configPath, 'utf8'))
    )
    return parsed.success ? parsed.data.rules : []
  } catch {
    return []
  }
}

export function writePortableSettingsSyncRules(
  configPath: string,
  rules: PortableSettingsSyncRule[]
): void {
  mkdirSync(dirname(configPath), { recursive: true })
  const tempPath = `${configPath}.tmp`
  try {
    writeFileSync(
      tempPath,
      `${JSON.stringify({ version: PORTABLE_SETTINGS_SYNC_VERSION, rules }, null, 2)}\n`,
      'utf8'
    )
    renameSync(tempPath, configPath)
  } catch (error) {
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath)
      }
    } catch {
      // The original persistence failure is more actionable than cleanup failure.
    }
    throw error
  }
}
