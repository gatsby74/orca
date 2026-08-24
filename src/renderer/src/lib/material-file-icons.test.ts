import { describe, expect, it } from 'vitest'
import {
  getKnownMaterialFileIconAssetUrl,
  getMaterialFileIconAssetUrl
} from './material-file-icons'

describe('getMaterialFileIconAssetUrl', () => {
  it('resolves file names and extensions to Material Icon Theme assets', () => {
    expect(getMaterialFileIconAssetUrl('package.json', false)).toContain('/file-icons/nodejs.svg')
    expect(getMaterialFileIconAssetUrl('/repo/src/index.ts', false)).toContain(
      '/file-icons/typescript.svg'
    )
    expect(getMaterialFileIconAssetUrl('README.md', false)).toContain('/file-icons/readme.svg')
    expect(getMaterialFileIconAssetUrl('TODO.md', false)).toContain('/file-icons/todo.svg')
  })

  it('only reports known Material file icons for recognized file types', () => {
    expect(getKnownMaterialFileIconAssetUrl('README.md')).toContain('/file-icons/readme.svg')
    expect(getKnownMaterialFileIconAssetUrl('unknown.customtype')).toBeNull()
  })

  it('maps language-id-only extensions that upstream omits from fileExtensions', () => {
    expect(getKnownMaterialFileIconAssetUrl('index.html')).toContain('/file-icons/html.svg')
    expect(getKnownMaterialFileIconAssetUrl('workflow.yml')).toContain('/file-icons/yaml.svg')
    expect(getKnownMaterialFileIconAssetUrl('openapi-spec.yaml')).toContain('/file-icons/yaml.svg')
  })

  it('falls back to the default file asset for unknown files', () => {
    expect(getMaterialFileIconAssetUrl('unknown.customtype', false)).toContain(
      '/file-icons/file.svg'
    )
  })
})
