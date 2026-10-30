import { CircleAlert, CircleCheck, FileUp, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useState, type DragEvent, type FormEvent } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { Panel, Pending } from '@/components/cards'
import { PageHeader } from '@/components/page-header'
import { Problem } from '@/components/problem'
import { Button } from '@/components/ui/button'
import type { ImportJob, Workspace } from '@/core/api'
import { formatBytes, formatCount } from '@/core/format'
import { diagnosticLabel, entityCount, problemLabel } from '@/core/import-labels'
import { importSources, type ImportSource } from '@/core/import-sources'
import { useImportDump } from '@/hooks/use-workspace-mutations'
import { useWorkspace } from '@/hooks/use-workspaces'
import { cn } from '@/lib/utils'

// Enough to act on; a file this broken is fixed at its source, not read problem by problem here
const SHOWN_PROBLEMS = 20

export function WorkspaceImportPage() {
  // WorkspaceLayout renders this page only for a workspace it has found
  const workspace = useWorkspace(useParams().workspaceId)!
  const importDump = useImportDump(workspace.id)
  const { t } = useTranslation()

  // The result is checked first: a finished import has already moved the workspace out of NEW
  let body
  if (importDump.data) {
    body = <ImportResult job={importDump.data} workspace={workspace} onRetry={() => importDump.reset()} />
  } else if (importDump.isPending) {
    body = (
      <section
        role="status"
        className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border bg-card px-6 py-10 text-center"
      >
        <LoaderCircle
          className="size-16 animate-spin text-(--ws) motion-reduce:animate-[spin_3s_linear_infinite]"
          strokeWidth={1.5}
          aria-hidden
        />
        <h2 className="text-lg font-bold">{t('import.importing')}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t('import.importingText', { workspace: workspace.name })}
        </p>
      </section>
    )
  } else if (workspace.status !== 'NEW') {
    body = <ImportClosed workspace={workspace} />
  } else {
    body = (
      <DumpPicker onImport={(source, file) => importDump.mutate({ source, file })} error={importDump.error} />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('import.title')} />
      {body}
    </div>
  )
}

function DumpPicker({
  onImport,
  error,
}: {
  onImport: (source: ImportSource, file: File) => void
  error: Error | null
}) {
  const [sourceId, setSourceId] = useState(importSources[0]!.id)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const source = importSources.find((each) => each.id === sourceId)!
  const tooBig = file !== null && file.size > source.maxBytes
  const { t } = useTranslation()

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const dropped = event.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (file && !tooBig) {
      onImport(source, file)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <Pending>{t('import.intro')}</Pending>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] text-muted-foreground">{t('import.from')}</legend>
        <div className="flex flex-wrap gap-2">
          {importSources.map((each) => (
            <label
              key={each.id}
              className={cn(
                'flex min-h-11 cursor-pointer items-center rounded-[10px] border bg-card px-4 text-sm font-semibold has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                each.id === sourceId && 'border-foreground',
              )}
            >
              <input
                type="radio"
                name="source"
                value={each.id}
                checked={each.id === sourceId}
                onChange={() => {
                  setSourceId(each.id)
                  setFile(null)
                }}
                className="sr-only"
              />
              {each.name}
            </label>
          ))}
        </div>
      </fieldset>

      <label
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-input bg-card px-4 py-8 text-center has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
          dragging && 'border-(--ws) bg-(--ws-soft)',
        )}
      >
        <input
          type="file"
          className="sr-only"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <FileUp className="size-8 text-muted-foreground" aria-hidden />
        {file ? (
          <>
            <span className="text-[15px] font-bold break-all">{file.name}</span>
            <span className="text-[13px] text-muted-foreground">
              {t('import.chosen', { size: formatBytes(file.size) })}
            </span>
          </>
        ) : (
          <>
            <span className="text-[15px] font-bold">
              <Trans
                i18nKey="import.drop"
                components={{
                  desktop: <span className="hidden md:inline" />,
                  u: <span className="underline underline-offset-4" />,
                }}
              />
            </span>
            <span className="text-[13px] text-muted-foreground">
              {t('import.fileHint', {
                file: t(`importSources.${source.id}.file`),
                size: formatBytes(source.maxBytes),
              })}
            </span>
          </>
        )}
      </label>
      {tooBig && (
        <p className="text-sm text-destructive">
          {t('import.tooBig', {
            size: formatBytes(file.size),
            source: source.name,
            max: formatBytes(source.maxBytes),
          })}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!file || tooBig} className="h-11 rounded-[10px] px-5 font-bold">
          {t('import.submit')}
        </Button>
        {error && <Problem error={error} />}
      </div>
    </form>
  )
}

function ImportClosed({ workspace }: { workspace: Workspace }) {
  const { t } = useTranslation()
  if (workspace.status === 'IMPORTING') {
    return (
      <Panel title={t('import.running.title')}>
        <Pending>{t('import.running.text')}</Pending>
      </Panel>
    )
  }
  return (
    <Panel title={t('import.closed.title')}>
      <Pending>{t('import.closed.text', { workspace: workspace.name })}</Pending>
      <div>
        <Button asChild className="h-11 rounded-[10px] px-5 font-bold">
          <Link to="/workspaces/new">{t('import.closed.action')}</Link>
        </Button>
      </div>
    </Panel>
  )
}

function ImportResult({
  job,
  workspace,
  onRetry,
}: {
  job: ImportJob
  workspace: Workspace
  onRetry: () => void
}) {
  const { t } = useTranslation()

  if (job.status !== 'FAILED') {
    const counts = [
      ['accounts', job.accounts],
      ['categories', job.categories],
      ['operations', job.operations],
      ['transfers', job.transfers],
      ['anchors', job.anchors],
    ] as const
    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <CircleCheck className="size-5 text-positive" aria-hidden />
            {t('import.done', { workspace: workspace.name })}
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {counts.map(([key, n]) => (
              <div key={key} className="flex flex-col gap-0.5 rounded-xl bg-muted px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{t(`import.counts.${key}`)}</dt>
                <dd className="text-xl font-extrabold">{formatCount(n)}</dd>
              </div>
            ))}
          </dl>
          <div>
            <Button asChild className="h-11 rounded-[10px] px-5 font-bold">
              <Link to={`/w/${workspace.id}`}>{t('import.open')}</Link>
            </Button>
          </div>
        </section>
        <Diagnostics job={job} />
      </div>
    )
  }

  const shown = job.problems.slice(0, SHOWN_PROBLEMS)
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-destructive">
          <CircleAlert className="size-5" aria-hidden />
          {t('import.failed')}
        </h2>
        <Pending>
          {job.message ?? t('import.refused')} {t('import.stillEmpty', { workspace: workspace.name })}
        </Pending>
        {shown.length > 0 && (
          <ul className="flex flex-col">
            {shown.map((problem, index) => (
              <li key={index} className="flex flex-col gap-0.5 border-t py-2.5">
                <span className="text-sm font-semibold">{problemLabel(problem.code)}</span>
                <span className="text-sm">{problem.message}</span>
                <span className="text-xs text-muted-foreground">
                  {problem.field
                    ? t('import.affectedField', {
                        entities: entityCount(problem.aggregateType, problem.affectedCount),
                        field: problem.field,
                      })
                    : t('import.affected', {
                        entities: entityCount(problem.aggregateType, problem.affectedCount),
                      })}
                </span>
              </li>
            ))}
          </ul>
        )}
        {job.problems.length > shown.length && (
          <p className="text-xs text-muted-foreground">
            {t('import.more', { count: job.problems.length - shown.length })}
          </p>
        )}
        <div>
          <Button onClick={onRetry} className="h-11 rounded-[10px] px-5 font-bold">
            {t('import.retry')}
          </Button>
        </div>
      </section>
      <Diagnostics job={job} />
    </div>
  )
}

// What the importer noticed in the source without refusing it: skipped records, anomalies
function Diagnostics({ job }: { job: ImportJob }) {
  const { t } = useTranslation()
  if (job.diagnostics.length === 0) {
    return null
  }
  return (
    <Panel title={t('import.notes')}>
      <ul className="flex flex-col">
        {job.diagnostics.map((diagnostic, index) => (
          <li key={index} className="flex gap-3 border-t py-2.5">
            <TriangleAlert
              className={cn(
                'mt-0.5 size-4 shrink-0',
                diagnostic.severity === 'ERROR' ? 'text-destructive' : 'text-muted-foreground',
              )}
              aria-label={t(diagnostic.severity === 'ERROR' ? 'import.error' : 'import.warning')}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold">
                {t('import.diagnostic', { label: diagnosticLabel(diagnostic.code), count: diagnostic.count })}
              </span>
              {diagnostic.detail && (
                <span className="text-xs text-muted-foreground">{diagnostic.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
