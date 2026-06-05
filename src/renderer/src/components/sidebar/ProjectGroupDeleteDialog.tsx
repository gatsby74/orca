import React, { useCallback, useId, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type ProjectGroupDeleteDialogProps = {
  open: boolean
  groupName: string
  projectCount: number
  projectNames: string[]
  deleteChildRepos: boolean
  onDeleteChildReposChange: (deleteChildRepos: boolean) => void
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void> | void
}

export function ProjectGroupDeleteDialog({
  open,
  groupName,
  projectCount,
  projectNames,
  deleteChildRepos,
  onDeleteChildReposChange,
  onOpenChange,
  onConfirm
}: ProjectGroupDeleteDialogProps): React.JSX.Element {
  const [deleting, setDeleting] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)
  const mountedRef = useRef(true)
  const checkboxId = useId()
  const projectLabel = projectCount === 1 ? 'project' : 'projects'

  const handleDialogContentRef = useCallback((node: HTMLDivElement | null): void => {
    // Why: deleting can resolve after the dialog closes; the content ref keeps
    // late completions from mutating stale dialog state without an Effect.
    mountedRef.current = node !== null
  }, [])

  // Why: opening the dialog must clear a stale in-flight state before the
  // destructive button renders; an Effect would leave one disabled frame.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open && deleting) {
      setDeleting(false)
    }
  }

  const handleConfirm = useCallback(async () => {
    if (deleting) {
      return
    }
    setDeleting(true)
    try {
      await onConfirm()
      if (mountedRef.current) {
        setDeleting(false)
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Failed to delete project group:', error)
      if (mountedRef.current) {
        setDeleting(false)
      }
    }
  }, [deleting, onConfirm, onOpenChange])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && deleting) {
          return
        }
        if (!nextOpen) {
          setDeleting(false)
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        ref={handleDialogContentRef}
        className="max-w-sm sm:max-w-sm"
        showCloseButton={false}
      >
        <DialogHeader>
          <DialogTitle className="text-sm">Delete Project Group</DialogTitle>
          <DialogDescription className="text-xs">
            Delete <span className="break-all font-medium text-foreground">{groupName}</span> and
            ungroup its projects.
          </DialogDescription>
        </DialogHeader>
        {projectCount > 0 && (
          <div
            className="rounded-md border border-border bg-muted/30 p-3"
            data-disabled={deleting ? 'true' : undefined}
          >
            <div className="flex items-start gap-2.5">
              <Checkbox
                id={checkboxId}
                checked={deleteChildRepos}
                disabled={deleting}
                onCheckedChange={(checked) => onDeleteChildReposChange(checked === true)}
                aria-describedby={`${checkboxId}-description`}
                className="mt-0.5"
              />
              <div className="min-w-0 space-y-1">
                <Label htmlFor={checkboxId} className="text-xs leading-4">
                  Remove {projectCount} contained {projectLabel} from Orca
                </Label>
                <p id={`${checkboxId}-description`} className="text-xs text-muted-foreground">
                  Project folders on disk are not deleted.
                </p>
                {projectNames.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Projects that will be removed if selected
                    </p>
                    <ul
                      className="max-h-24 space-y-0.5 overflow-y-auto rounded-sm border border-border/70 bg-background/60 px-2 py-1.5 text-xs text-foreground"
                      aria-label="Contained projects"
                    >
                      {projectNames.map((projectName, index) => (
                        <li
                          key={`${projectName}:${index}`}
                          className="truncate"
                          title={projectName}
                        >
                          {projectName}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="text-xs"
            disabled={deleting}
            onClick={handleConfirm}
          >
            {deleting
              ? 'Deleting...'
              : deleteChildRepos
                ? 'Delete Group and Remove Projects'
                : 'Delete Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
