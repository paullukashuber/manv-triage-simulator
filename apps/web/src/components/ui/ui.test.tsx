import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CategoryBadge } from './CategoryBadge.tsx'
import { StepBadge } from './StepBadge.tsx'
import { ProgressBar } from './ProgressBar.tsx'
import { PrototypeModal } from './PrototypeModal.tsx'

describe('CategoryBadge', () => {
  it('renders the short label per category', () => {
    render(
      <>
        <CategoryBadge category="red" />
        <CategoryBadge category="white" />
      </>,
    )
    expect(screen.getByText('SK 1')).toBeInTheDocument()
    expect(screen.getByText('PAK weiß')).toBeInTheDocument()
  })
})

describe('StepBadge', () => {
  it('renders the badge letter of the step', () => {
    render(<StepBadge stepKey="abnormalBreathingRate" />)
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})

describe('ProgressBar', () => {
  it('exposes progress via aria attributes', () => {
    render(<ProgressBar current={3} total={9} />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '9')
    expect(screen.getByText('Schritt 3/9')).toBeInTheDocument()
  })
})

describe('PrototypeModal', () => {
  it('disappears after acknowledging and stays away on re-render', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<PrototypeModal />)
    await user.click(screen.getByRole('button', { name: 'Verstanden' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    unmount()
    render(<PrototypeModal />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
