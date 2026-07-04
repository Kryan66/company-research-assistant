import { Check, Loader2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ResearchStage } from '@/lib/types'
import { STAGE_LABELS, STAGE_ORDER } from '@/lib/types'

interface ProgressStepsProps {
  currentStage: ResearchStage
  message?: string
}

export function ProgressSteps({ currentStage, message }: ProgressStepsProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage)

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <div className="flex items-center justify-between">
        {STAGE_ORDER.filter((s) => s !== 'error').map((stage, i) => {
          const isComplete = i < currentIndex || currentStage === 'done'
          const isCurrent = stage === currentStage
          const isError = currentStage === 'error' && i === currentIndex

          return (
            <div key={stage} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                  isComplete && 'border-primary bg-primary text-primary-foreground',
                  isCurrent && !isComplete && 'border-primary text-primary',
                  !isComplete && !isCurrent && 'border-border text-muted-foreground',
                  isError && 'border-destructive text-destructive'
                )}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs text-center leading-tight',
                  (isComplete || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {STAGE_LABELS[stage]}
              </span>
            </div>
          )
        })}
      </div>
      {message && (
        <p className="text-xs text-muted-foreground text-center animate-pulse">{message}</p>
      )}
    </div>
  )
}
