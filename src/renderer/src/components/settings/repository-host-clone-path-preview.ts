export function getCloneFolderNamePreview(url: string): string | null {
  const source = url
    .trim()
    .replace(/[\\/]+$/, '')
    .replace(/\.git$/i, '')
  const name = source.replace(/\\/g, '/').split('/').at(-1)?.trim()
  return name && name !== '.' && name !== '..' ? name : null
}

export function getClonePathPreview(parent: string, folderName: string | null): string | null {
  const trimmedParent = parent.trim()
  if (!trimmedParent || !folderName) {
    return null
  }
  const separator = trimmedParent.includes('\\') && !trimmedParent.includes('/') ? '\\' : '/'
  const withoutTrailingSeparators = trimmedParent.replace(/[\\/]+$/, '')
  if (!withoutTrailingSeparators) {
    return `/${folderName}`
  }
  return `${withoutTrailingSeparators}${separator}${folderName}`
}
