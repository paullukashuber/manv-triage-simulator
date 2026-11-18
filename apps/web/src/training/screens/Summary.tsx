import { CATEGORIES, type Verdict } from '@manv/triage'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button.tsx'
import { CategoryBadge } from '../../components/ui/CategoryBadge.tsx'
import { Card } from '../../components/ui/Card.tsx'
import { Header } from '../../components/ui/Header.tsx'
import type { CaseResult } from '../machine.ts'

type SummaryProps = { results: CaseResult[]; onRetry?: () => void; onHome: () => void }

const VERDICT_ROW: Record<Verdict, { border: string; marker: string }> = {
  correct: { border: 'border-l-correct', marker: '✓' },
  wrongPath: { border: 'border-l-accent', marker: '≈' },
  wrong: { border: 'border-l-wrong', marker: '✗' },
}

function ratingKey(percent: number) {
  if (percent === 100) return 'perfect'
  if (percent >= 75) return 'good'
  if (percent >= 50) return 'okay'
  return 'needsPractice'
}

export function Summary({ results, onRetry, onHome }: SummaryProps) {
  const { t } = useTranslation()
  const total = results.length
  const correct = results.filter((r) => r.grade.verdict === 'correct').length
  const wrongPath = results.filter((r) => r.grade.verdict === 'wrongPath').length
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0
  const distribution = CATEGORIES.map((category) => ({
    category,
    count: results.filter((r) => r.grade.correctCategory === category).length,
  }))

  return (
    <>
      <Header badge={t('summary.badge')} title={t('summary.heading')} />

      <Card className="gap-2.5">
        <div className="text-center py-4 bg-surface rounded-lg border border-border">
          <p className="text-4xl font-bold text-accent leading-none tabular-nums">
            {correct}/{total}
          </p>
          <p className="text-[0.7rem] text-dim mt-1">
            {t('summary.patientsCorrect')} ({percent}%)
          </p>
          {wrongPath > 0 && (
            <p className="text-[0.7rem] text-accent mt-1">{t('summary.wrongPathCount', { count: wrongPath })}</p>
          )}
        </div>

        <p className="text-[0.82rem] text-center text-muted">{t(`summary.ratings.${ratingKey(percent)}`)}</p>

        <div className="bg-accent-muted border border-accent/15 rounded-lg px-3 py-2 text-[0.8rem]">
          <strong className="text-accent">{t('summary.distributionLabel')}:</strong>{' '}
          <span className="text-muted">
            {distribution.map(({ category, count }, i) => (
              <span key={category}>
                {i > 0 && ' · '}
                {t(`categories.${category}.short`)}: {count}
              </span>
            ))}
          </span>
        </div>

        <h2 className="text-[0.65rem] font-bold text-dim uppercase tracking-[0.12em]">{t('summary.detailHeading')}</h2>

        <ol className="flex flex-col gap-1.5">
          {results.map(({ trainingCase, grade }, i) => (
            <li
              key={trainingCase.caseId}
              className={`px-3 py-2 rounded-lg bg-surface border-l-3 text-[0.8rem] leading-snug ${
                VERDICT_ROW[grade.verdict].border
              }`}
            >
              <p className="font-medium line-clamp-2">
                {VERDICT_ROW[grade.verdict].marker} {t('summary.patientPrefix')} {i + 1}: {trainingCase.description}
              </p>
              <p className="text-dim mt-0.5 flex items-center gap-1 flex-wrap">
                {t('summary.correctLabel')}: <CategoryBadge category={grade.correctCategory} size="sm" />
                {!grade.categoryCorrect && (
                  <>
                    {' · '}
                    {t('summary.yourAnswerLabel')}: <CategoryBadge category={grade.userCategory} size="sm" />
                  </>
                )}
                {grade.verdict === 'wrongPath' && (
                  <>
                    {' · '}
                    {t('summary.wrongPathLabel')}
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="sticky-actions mt-auto">
        <div className="flex gap-2.5">
          {onRetry && <Button onClick={onRetry}>{t('summary.retryButton')}</Button>}
          <Button variant="secondary" onClick={onHome}>
            {t('summary.homeButton')}
          </Button>
        </div>
      </div>
    </>
  )
}
