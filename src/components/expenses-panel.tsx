import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ExpenseChartView } from '@/components/balance-chart'
import { LoadError } from '@/components/load-error'
import { Panel, Pending } from '@/components/panel'
import { cashflowOf } from '@/core/charts/windows'
import { useYearOfMonths } from '@/hooks/use-cashflow'

const noop = () => {}

// A year of expenses in the display currency, one bar a month from this month last year; the Charts page has the rest. The
// chart spans to this month's end rather than today, so the current month's bar, drawn mid-month, is never cut.
export function ExpensesPanel({
  workspaceId,
  currency,
  className,
}: {
  workspaceId: string
  currency: string
  className?: string
}) {
  const { t } = useTranslation()
  const { cashflow, window } = useYearOfMonths(workspaceId)
  const points = useMemo(
    () => (cashflow.data ? cashflowOf(cashflow.data, currency) : []),
    [cashflow.data, currency],
  )

  return (
    <Panel
      title={t('overview.expensesByMonth')}
      className={className}
      footer={
        <Link
          to={`/w/${workspaceId}/charts`}
          className="flex min-h-11 items-center px-1 text-caption font-bold"
        >
          {t('overview.allCharts')}
        </Link>
      }
    >
      {cashflow.error ? (
        <LoadError
          title={t('errors.loadSeries')}
          error={cashflow.error}
          onRetry={() => void cashflow.refetch()}
        />
      ) : !cashflow.data ? (
        <Pending>{t('common.loading')}</Pending>
      ) : points.every((point) => point.expense === 0) ? (
        <Pending>{t('overview.noExpenses')}</Pending>
      ) : (
        <ExpenseChartView
          group={`overview-expenses-${workspaceId}`}
          currency={currency}
          points={points}
          bounds={window}
          window={window}
          onWindow={noop}
          compact
          className="h-36"
        />
      )}
    </Panel>
  )
}
