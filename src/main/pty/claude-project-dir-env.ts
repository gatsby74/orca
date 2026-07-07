export const CLAUDE_PROJECT_DIR_ENV_KEY = 'CLAUDE_PROJECT_DIR'

export function applyClaudeProjectDirEnv(
  env: Record<string, string>,
  projectDir: string | undefined
): void {
  if (!projectDir) {
    return
  }
  // Why: Claude hooks expect this project-scoped cwd, and inherited values can
  // point at the shell that launched Orca instead of the child terminal.
  env[CLAUDE_PROJECT_DIR_ENV_KEY] = projectDir
}
