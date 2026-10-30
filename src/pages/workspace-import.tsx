import { CircleAlert, CircleCheck, FileUp, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useState, type DragEvent, type FormEvent } from 'react'
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
        <h2 className="text-lg font-bold">Importing…</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Reading the file and writing it into {workspace.name}. This can take a minute; keep this page open.
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
      <PageHeader title="Import history" />
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
      <Pending>
        Everything in the file arrives in one step: accounts, categories, operations, transfers and balances.
        If anything in it is refused, nothing is imported and the workspace stays empty.
      </Pending>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] text-muted-foreground">Import from</legend>
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
              {formatBytes(file.size)} · choose another
            </span>
          </>
        ) : (
          <>
            <span className="text-[15px] font-bold">
              <span className="hidden md:inline">Drop the file here, or </span>
              <span className="underline underline-offset-4">choose a file</span>
            </span>
            <span className="text-[13px] text-muted-foreground">
              {source.file}, up to {formatBytes(source.maxBytes)}
            </span>
          </>
        )}
      </label>
      {tooBig && (
        <p className="text-sm text-destructive">
          This file is {formatBytes(file.size)}; {source.name} imports accept up to{' '}
          {formatBytes(source.maxBytes)}.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!file || tooBig} className="h-11 rounded-[10px] px-5 font-bold">
          Import
        </Button>
        {error && <Problem error={error} />}
      </div>
    </form>
  )
}

function ImportClosed({ workspace }: { workspace: Workspace }) {
  if (workspace.status === 'IMPORTING') {
    return (
      <Panel title="An import is running">
        <Pending>Another import into this workspace has not finished yet. Come back in a minute.</Pending>
      </Panel>
    )
  }
  return (
    <Panel title="Import is closed">
      <Pending>
        History can be imported only into a new, empty workspace, and {workspace.name} is no longer new. To
        import history, create a workspace for it.
      </Pending>
      <div>
        <Button asChild className="h-11 rounded-[10px] px-5 font-bold">
          <Link to="/workspaces/new">New workspace</Link>
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
  if (job.status !== 'FAILED') {
    const counts: [string, number][] = [
      ['Accounts', job.accounts],
      ['Categories', job.categories],
      ['Operations', job.operations],
      ['Transfers', job.transfers],
      ['Balance anchors', job.anchors],
    ]
    return (
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <CircleCheck className="size-5 text-positive" aria-hidden />
            Imported into {workspace.name}
          </h2>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {counts.map(([label, n]) => (
              <div key={label} className="flex flex-col gap-0.5 rounded-xl bg-muted px-3 py-2.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-xl font-extrabold">{formatCount(n)}</dd>
              </div>
            ))}
          </dl>
          <div>
            <Button asChild className="h-11 rounded-[10px] px-5 font-bold">
              <Link to={`/w/${workspace.id}`}>Open the workspace</Link>
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
          Nothing was imported
        </h2>
        <Pending>
          {job.message ?? 'The file was refused.'} {workspace.name} is still empty, so you can fix the file
          and try again.
        </Pending>
        {shown.length > 0 && (
          <ul className="flex flex-col">
            {shown.map((problem, index) => (
              <li key={index} className="flex flex-col gap-0.5 border-t py-2.5">
                <span className="text-sm font-semibold">{problemLabel(problem.code)}</span>
                <span className="text-sm">{problem.message}</span>
                <span className="text-xs text-muted-foreground">
                  {entityCount(problem.aggregateType, problem.affectedCount)} affected
                  {problem.field && ` · field ${problem.field}`}
                </span>
              </li>
            ))}
          </ul>
        )}
        {job.problems.length > shown.length && (
          <p className="text-xs text-muted-foreground">
            And {formatCount(job.problems.length - shown.length)} more problems.
          </p>
        )}
        <div>
          <Button onClick={onRetry} className="h-11 rounded-[10px] px-5 font-bold">
            Choose another file
          </Button>
        </div>
      </section>
      <Diagnostics job={job} />
    </div>
  )
}

// What the importer noticed in the source without refusing it: skipped records, anomalies
function Diagnostics({ job }: { job: ImportJob }) {
  if (job.diagnostics.length === 0) {
    return null
  }
  return (
    <Panel title="Notes from the importer">
      <ul className="flex flex-col">
        {job.diagnostics.map((diagnostic, index) => (
          <li key={index} className="flex gap-3 border-t py-2.5">
            <TriangleAlert
              className={cn(
                'mt-0.5 size-4 shrink-0',
                diagnostic.severity === 'ERROR' ? 'text-destructive' : 'text-muted-foreground',
              )}
              aria-label={diagnostic.severity === 'ERROR' ? 'Error' : 'Warning'}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold">
                {diagnosticLabel(diagnostic.code)}: {formatCount(diagnostic.count)}
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
