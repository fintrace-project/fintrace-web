import { Archive, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Panel, Pending } from '@/components/cards'
import { CurrencySelect } from '@/components/currency-select'
import { PageHeader } from '@/components/page-header'
import { Field } from '@/components/field'
import { Problem } from '@/components/problem'
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
import { fieldError, hasFieldErrors, type Workspace } from '@/core/api'
import { useDeleteWorkspace, useEditWorkspace, useSetArchived } from '@/hooks/use-workspace-mutations'
import { useReloadWorkspaces, useWorkspace } from '@/hooks/use-workspaces'

export function WorkspaceSettingsPage() {
  // WorkspaceLayout renders this page only for a workspace it has found
  const workspace = useWorkspace(useParams().workspaceId)!
  const edit = useEditWorkspace(workspace.id)
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('settings.title')} />
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
  const reload = useReloadWorkspaces()
  const { t } = useTranslation()
  const [name, setName] = useState(workspace.name)
  const [currency, setCurrency] = useState(workspace.defaultCurrency)
  const changed = name.trim() !== workspace.name || currency !== workspace.defaultCurrency

  const submit = (event: FormEvent) => {
    event.preventDefault()
    edit.mutate({ version: workspace.version, workspaceName: name.trim(), defaultCurrency: currency })
  }

  return (
    <Panel title={t('settings.general')}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_auto]">
          <Field id="workspace-name" label={t('common.name')} error={fieldError(edit.error, 'workspaceName')}>
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
            label={t('common.defaultCurrency')}
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
            {t(edit.isPending ? 'common.saving' : 'common.save')}
          </Button>
          {edit.isSuccess && !changed && <span className="text-sm text-positive">{t('common.saved')}</span>}
          {edit.error && !hasFieldErrors(edit.error) && <Problem error={edit.error} onReload={reload} />}
        </div>
      </form>
    </Panel>
  )
}

function StatusPanel({ workspace }: { workspace: Workspace }) {
  const setArchived = useSetArchived(workspace.id)
  const { t } = useTranslation()

  return (
    <Panel title={t('settings.archive.title')}>
      {workspace.status === 'ACTIVE' && (
        <>
          <Pending>{t('settings.archive.active')}</Pending>
          <div>
            <Button
              variant="outline"
              disabled={setArchived.isPending}
              onClick={() => setArchived.mutate(true)}
              className="h-11 rounded-[10px] px-4 font-semibold"
            >
              <Archive aria-hidden />
              {t('settings.archive.action')}
            </Button>
          </div>
        </>
      )}
      {workspace.status === 'ARCHIVED' && <Pending>{t('settings.archive.archived')}</Pending>}
      {workspace.status === 'NEW' && <Pending>{t('settings.archive.new')}</Pending>}
      {workspace.status === 'IMPORTING' && <Pending>{t('settings.archive.importing')}</Pending>}
      {setArchived.error && <Problem error={setArchived.error} />}
    </Panel>
  )
}

function DeletePanel({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-card p-5">
      <h2 className="text-base font-bold text-destructive">{t('settings.delete.title')}</h2>
      <Pending>{t('settings.delete.text')}</Pending>
      <Dialog>
        <div>
          <DialogTrigger asChild>
            <Button variant="destructive" className="h-11 rounded-[10px] px-4 font-semibold">
              <Trash2 aria-hidden />
              {t('settings.delete.action')}
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
  const reload = useReloadWorkspaces()
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')
  const { t } = useTranslation()

  // The typed name is a brake for the hand, not an authorisation: Core takes no confirmation (§4.1.1)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    remove.mutate(workspace.version, { onSuccess: () => navigate('/workspaces', { replace: true }) })
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t('settings.delete.confirmTitle', { name: workspace.name })}</DialogTitle>
        <DialogDescription>{t('settings.delete.confirmText')}</DialogDescription>
      </DialogHeader>
      <Field
        id="confirm-name"
        label={
          <Trans
            i18nKey="settings.delete.typeToConfirm"
            values={{ name: workspace.name }}
            components={{ b: <b className="font-bold text-foreground" /> }}
          />
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
      {remove.error && <Problem error={remove.error} onReload={reload} />}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="h-11 md:h-9">
            {t('common.cancel')}
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={typed !== workspace.name || remove.isPending}
          className="h-11 bg-destructive text-white hover:bg-destructive/90 md:h-9"
        >
          {t(remove.isPending ? 'settings.delete.deleting' : 'settings.delete.confirm')}
        </Button>
      </DialogFooter>
    </form>
  )
}
