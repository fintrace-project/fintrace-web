import { useQueryClient } from '@tanstack/react-query'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Panel, Pending } from '@/components/cards'
import { CurrencySelect } from '@/components/currency-select'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError, type Workspace } from '@/core/api'
import { useDeleteWorkspace, useEditWorkspace, useSetArchived } from '@/hooks/use-workspace-mutations'
import { useWorkspace } from '@/hooks/use-workspaces'

export function WorkspaceSettingsPage() {
  // WorkspaceLayout renders this page only for a workspace it has found
  const workspace = useWorkspace(useParams().workspaceId)!
  const edit = useEditWorkspace(workspace.id)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Workspace settings" />
      {/* Keyed by version: a newer workspace, saved here or elsewhere, starts the form afresh */}
      <GeneralPanel key={workspace.version} workspace={workspace} edit={edit} />
      <StatusPanel workspace={workspace} />
      <DeletePanel workspace={workspace} />
    </div>
  )
}

function GeneralPanel({
  workspace,
  edit,
}: {
  workspace: Workspace
  edit: ReturnType<typeof useEditWorkspace>
}) {
  const [name, setName] = useState(workspace.name)
  const [currency, setCurrency] = useState(workspace.defaultCurrency)
  const changed = name.trim() !== workspace.name || currency !== workspace.defaultCurrency

  const submit = (event: FormEvent) => {
    event.preventDefault()
    edit.mutate({ version: workspace.version, workspaceName: name.trim(), defaultCurrency: currency })
  }

  return (
    <Panel title="General">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_auto]">
          <Field id="workspace-name" label="Name" error={fieldError(edit.error, 'workspaceName')}>
            <Input
              id="workspace-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={30}
              className="h-11 bg-card"
            />
          </Field>
          <Field
            id="workspace-currency"
            label="Default currency"
            error={fieldError(edit.error, 'defaultCurrency')}
          >
            <CurrencySelect id="workspace-currency" value={currency} onChange={setCurrency} />
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={!changed || edit.isPending}
            className="h-11 rounded-[10px] px-5 font-bold"
          >
            {edit.isPending ? 'Saving…' : 'Save'}
          </Button>
          {edit.isSuccess && !changed && <span className="text-sm text-positive">Saved.</span>}
          {edit.error && !hasFieldErrors(edit.error) && <Problem error={edit.error} />}
        </div>
      </form>
    </Panel>
  )
}

function StatusPanel({ workspace }: { workspace: Workspace }) {
  const setArchived = useSetArchived(workspace.id)

  return (
    <Panel title="Archive">
      {workspace.status === 'ACTIVE' && (
        <>
          <Pending>
            An archived workspace is read-only: everything in it stays, nothing can be added or changed. You
            can unarchive it at any time.
          </Pending>
          <div>
            <Button
              variant="outline"
              disabled={setArchived.isPending}
              onClick={() => setArchived.mutate(true)}
              className="h-11 rounded-[10px] px-4 font-semibold"
            >
              <Archive aria-hidden />
              Archive workspace
            </Button>
          </div>
        </>
      )}
      {workspace.status === 'ARCHIVED' && (
        <>
          <Pending>This workspace is archived and read-only. Unarchive it to make changes again.</Pending>
          <div>
            <Button
              disabled={setArchived.isPending}
              onClick={() => setArchived.mutate(false)}
              className="h-11 rounded-[10px] px-4 font-bold"
            >
              <ArchiveRestore aria-hidden />
              Unarchive workspace
            </Button>
          </div>
        </>
      )}
      {workspace.status === 'NEW' && (
        <Pending>
          A new workspace has nothing to archive yet. It becomes active with its first entry or a successful
          import.
        </Pending>
      )}
      {workspace.status === 'IMPORTING' && (
        <Pending>An import is running. The workspace can be archived once it has finished.</Pending>
      )}
      {setArchived.error && <Problem error={setArchived.error} />}
    </Panel>
  )
}

function DeletePanel({ workspace }: { workspace: Workspace }) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-card p-5">
      <h2 className="text-base font-bold text-destructive">Delete workspace</h2>
      <Pending>
        Deletion cannot be undone. The workspace and all its accounts, operations and history become
        unreachable at once and cannot be restored. To keep it out of sight instead, archive it.
      </Pending>
      <Dialog>
        <div>
          <DialogTrigger asChild>
            <Button variant="destructive" className="h-11 rounded-[10px] px-4 font-semibold">
              <Trash2 aria-hidden />
              Delete workspace…
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent>
          <DeleteConfirmation workspace={workspace} />
        </DialogContent>
      </Dialog>
    </section>
  )
}

// Mounted only while the dialog is open, so the typed name starts empty every time
function DeleteConfirmation({ workspace }: { workspace: Workspace }) {
  const remove = useDeleteWorkspace(workspace.id)
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')

  // The typed name is a brake for the hand, not an authorisation: Core takes no confirmation (§4.1.1)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    remove.mutate(workspace.version, { onSuccess: () => navigate('/workspaces', { replace: true }) })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Delete “{workspace.name}”?</DialogTitle>
        <DialogDescription>
          This cannot be undone. Every account, operation and balance in this workspace becomes unreachable
          immediately.
        </DialogDescription>
      </DialogHeader>
      <Field
        id="confirm-name"
        label={
          <>
            Type <b className="font-bold text-foreground">{workspace.name}</b> to confirm
          </>
        }
      >
        <Input
          id="confirm-name"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          className="h-11"
        />
      </Field>
      {remove.error && <Problem error={remove.error} />}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 md:h-9">
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={typed !== workspace.name || remove.isPending}
          className="h-11 bg-destructive text-white hover:bg-destructive/90 md:h-9"
        >
          {remove.isPending ? 'Deleting…' : 'Delete forever'}
        </Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: ReactNode
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px] font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}

const problemOf = (error: Error | null) => (error instanceof ApiError ? error.problem : undefined)

const fieldError = (error: Error | null, field: string) =>
  problemOf(error)?.errors?.find((each) => each.field === field)?.message

const hasFieldErrors = (error: Error) => (problemOf(error)?.errors?.length ?? 0) > 0

// A stale version is the one failure the user can fix from here: reload and look again
function Problem({ error }: { error: Error }) {
  const queryClient = useQueryClient()
  if (problemOf(error)?.code === 'VERSION_CONFLICT') {
    return (
      <span className="flex flex-wrap items-center gap-2 text-sm text-destructive">
        This workspace changed since the page loaded.
        <Button
          type="button"
          variant="outline"
          className="h-9"
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['workspaces'], exact: true })}
        >
          Reload
        </Button>
      </span>
    )
  }
  return <span className="text-sm text-destructive">{error.message}</span>
}
