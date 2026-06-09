import type { AutomationSchedulePreset } from '../../../../shared/automations-types'
import type { TuiAgent } from '../../../../shared/types'
import { translate } from '@/i18n/i18n'

export type AutomationTemplate = {
  id: string
  category: string
  label: string
  description: string
  name: string
  prompt: string
  preset: AutomationSchedulePreset
  time?: string
  dayOfWeek?: string
  agentId?: TuiAgent
  missedRunGraceMinutes?: string
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'repo-health-weekday',
    category: 'Repo health',
    label: translate("auto.components.automations.automation.templates.b84757677d", "Weekday repo audit"),
    description: translate("auto.components.automations.automation.templates.a7fbd32ddb", "Check dependencies, failing tests, and risky open changes each weekday."),
    name: 'Weekday repo audit',
    prompt:
      'Review the repository health. Check dependency updates, failing tests, lint/typecheck status, and risky open changes. Summarize findings and suggest the next action.',
    preset: 'weekdays',
    time: '09:00',
    missedRunGraceMinutes: '720'
  },
  {
    id: 'release-prep-weekly',
    category: 'Release prep',
    label: translate("auto.components.automations.automation.templates.39ed39280a", "Release readiness"),
    description: translate("auto.components.automations.automation.templates.513401db93", "Prepare a weekly release risk summary from the current project state."),
    name: 'Release readiness review',
    prompt:
      'Prepare a release readiness summary. Look for blockers, unmerged risky changes, missing validation, and documentation gaps. End with a concise release/no-release recommendation.',
    preset: 'weekly',
    time: '14:00',
    dayOfWeek: '4',
    missedRunGraceMinutes: '1440'
  },
  {
    id: 'recurring-review-daily',
    category: 'Recurring review',
    label: translate("auto.components.automations.automation.templates.6023075b27", "Daily change review"),
    description: translate("auto.components.automations.automation.templates.3b7281c75f", "Scan recent work and call out correctness, UX, and test coverage risks."),
    name: 'Daily change review',
    prompt:
      'Review recent changes in this workspace. Focus on correctness risks, UX regressions, missing tests, and follow-up tasks. Keep the report short and actionable.',
    preset: 'daily',
    time: '16:30',
    missedRunGraceMinutes: '180'
  },
  {
    id: 'maintenance-hourly',
    category: 'Maintenance',
    label: translate("auto.components.automations.automation.templates.8a0228bea3", "Hourly queue check"),
    description: translate("auto.components.automations.automation.templates.37571fcb16", "Look for stuck work, stale generated files, and failed local validation."),
    name: 'Hourly maintenance check',
    prompt:
      'Check for stuck work, stale generated files, failing validation, and anything that needs human attention. Report only actionable issues.',
    preset: 'hourly',
    time: '00:15',
    missedRunGraceMinutes: '30'
  }
]
