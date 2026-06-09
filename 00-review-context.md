# Review Context

## Branch Info

- Base: origin/main (full PR: 1341 files — scoped to latest commit only)
- Current: Jinwoo-H/feature-add-i18n-support-and-korean-localization
- Scoped commit: 5f42536f1 Fix localization staleness and search keyword drift (124 files)

## Changed Files Summary

Latest commit touches i18n infrastructure, main-process menus, reactive localized catalogs, settings search getters, and localization coverage gates.

## Review Standards Reference

- Follow /review-code standards
- Focus on: correctness, security, performance, maintainability, i18n staleness, cross-platform
- Priority levels: Critical > High > Medium > Low

## File Categories

### Electron/Main (Priority 1)
- src/main/i18n/main-i18n.ts
- src/main/index.ts
- src/main/ipc/settings.ts
- src/main/menu/register-app-menu.ts

### Frontend/UI (Priority 3) — critical paths
- src/renderer/src/components/onboarding/AgentStep.tsx
- src/renderer/src/components/feature-wall/agents-orchestration/StatusesPage.tsx
- src/renderer/src/components/sidebar/workspace-status.ts
- src/renderer/src/components/sidebar/WorkspaceStatusAppearancePopover.tsx
- src/renderer/src/components/WorktreeJumpPalette.tsx
- src/renderer/src/components/cmd-j/quick-actions.ts
- src/renderer/src/components/automations/automation-templates.ts
- src/renderer/src/components/settings/source-control-action-recipe-options.ts
- src/renderer/src/components/settings/AppearancePane.tsx
- src/renderer/src/components/settings/appearance-search.ts
- src/shared/pseudo-localization.ts
- src/shared/ui-locale.ts
- config/scripts/verify-localization-catalog.mjs

## Skipped Issues (Do Not Re-validate)

[Initially empty]

## Iteration State

Current iteration: 1
Last completed phase: Setup
Files fixed this iteration: []