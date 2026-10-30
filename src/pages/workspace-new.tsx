import { FileUp, Sparkles } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Panel } from '@/components/cards'
import { CurrencySelect } from '@/components/currency-select'
import { Field } from '@/components/field'
import { PageHeader } from '@/components/page-header'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fieldError, hasFieldErrors, type Workspace } from '@/core/api'
import { useCreateWorkspace } from '@/hooks/use-workspace-mutations'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

type Start = 'empty' | 'import'

export function WorkspaceNewPage() {
  const create = useCreateWorkspace()
  const navigate = useNavigate()
  const workspaces = useWorkspaces()
  // A new workspace most likely keeps the currency of the latest one; read once, as the starting value
  const [currency, setCurrency] = useState(() => latestCurrency(workspaces.data) ?? 'EUR')
  const [name, setName] = useState('')
  const [start, setStart] = useState<Start>('empty')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      { workspaceName: name.trim(), defaultCurrency: currency },
      {
        onSuccess: (workspace) =>
          navigate(start === 'import' ? `/w/${workspace.id}/import` : `/w/${workspace.id}`),
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New workspace" />
      <Panel title="Workspace">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_auto]">
            <Field id="new-workspace-name" label="Name" error={fieldError(create.error, 'workspaceName')}>
              <Input
                id="new-workspace-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={30}
                placeholder="Personal"
                autoFocus
                className="h-11 bg-card"
              />
            </Field>
            <Field
              id="new-workspace-currency"
              label="Default currency"
              error={fieldError(create.error, 'defaultCurrency')}
            >
              <CurrencySelect id="new-workspace-currency" value={currency} onChange={setCurrency} />
            </Field>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-[13px] text-muted-foreground">How to start</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <StartOption
                value="empty"
                current={start}
                onChange={setStart}
                icon={<Sparkles />}
                title="Start empty"
              >
                Add accounts and operations yourself.
              </StartOption>
              <StartOption
                value="import"
                current={start}
                onChange={setStart}
                icon={<FileUp />}
                title="Import history"
              >
                Bring your records in from another app first. Possible only while the workspace is empty.
              </StartOption>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={!name.trim() || create.isPending}
              className="h-11 rounded-[10px] px-5 font-bold"
            >
              {create.isPending ? 'Creating…' : 'Create workspace'}
            </Button>
            {create.error && !hasFieldErrors(create.error) && <Problem error={create.error} />}
          </div>
        </form>
      </Panel>
    </div>
  )
}

const latestCurrency = (workspaces: Workspace[] | undefined) =>
  workspaces?.reduce<Workspace | undefined>(
    (latest, each) => (!latest || each.createdAt > latest.createdAt ? each : latest),
    undefined,
  )?.defaultCurrency

function StartOption({
  value,
  current,
  onChange,
  icon,
  title,
  children,
}: {
  value: Start
  current: Start
  onChange: (value: Start) => void
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  const checked = value === current
  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border bg-card p-4 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 [&_svg]:size-5 [&_svg]:shrink-0',
        checked && 'border-foreground',
      )}
    >
      <input
        type="radio"
        name="start"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span className={cn('mt-0.5 text-muted-foreground', checked && 'text-foreground')}>{icon}</span>
      <span className="flex flex-col gap-1">
        <span className="text-sm font-bold">{title}</span>
        <span className="text-[13px] text-muted-foreground">{children}</span>
      </span>
    </label>
  )
}
