import React, { useState } from 'react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'
import { Check, ChevronRight } from 'lucide-react'

interface ProgressStepperProps {
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  onStepClick?: (step: number) => void
  className?: string
}

const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  onStepClick,
  className
}) => {
  return (
    <div className={cn('w-full py-4', className)}>
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          const isClickable = onStepClick && (isCompleted || stepNumber <= currentStep + 1)

          return (
            <React.Fragment key={stepNumber}>
              {/* Step Circle */}
              <div className="flex flex-col items-center relative">
                <button
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200',
                    isCompleted && 'bg-green-500 text-white',
                    isActive && !isCompleted && 'bg-indigo-600 text-white ring-4 ring-indigo-200',
                    !isActive && !isCompleted && 'bg-gray-200 text-gray-600',
                    isClickable && 'hover:scale-110 cursor-pointer',
                    !isClickable && 'cursor-not-allowed'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </button>
                
                {/* Step Label */}
                {(stepLabels[index] || stepNumber <= totalSteps) && (
                  <span className={cn(
                    'text-xs mt-2 text-center max-w-20',
                    isActive ? 'text-indigo-600 font-medium' : 'text-gray-500'
                  )}>
                    {stepLabels[index] || `Step ${stepNumber}`}
                  </span>
                )}
              </div>

              {/* Connector Line */}
              {stepNumber < totalSteps && (
                <div className={cn(
                  'flex-1 h-0.5 mx-4',
                  stepNumber < currentStep ? 'bg-green-500' : 'bg-gray-200'
                )}>
                  <ChevronRight className="w-4 h-4 text-gray-400 -mt-2 ml-auto mr-auto" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
}

interface FormProgressWrapperProps {
  children: React.ReactNode
  currentStep: number
  totalSteps: number
  stepLabels?: string[]
  onStepChange?: (step: number) => void
  showProgressBar?: boolean
  className?: string
}

const FormProgressWrapper: React.FC<FormProgressWrapperProps> = ({
  children,
  currentStep,
  totalSteps,
  stepLabels,
  onStepChange,
  showProgressBar = true,
  className
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      {showProgressBar && totalSteps > 1 && (
        <ProgressStepper
          currentStep={currentStep + 1}
          totalSteps={totalSteps}
          stepLabels={stepLabels}
          onStepClick={onStepChange ? (step) => onStepChange(step) : undefined}
        />
      )}
      
      <div className="min-h-[400px]">
        {children}
      </div>
    </div>
  )
}

export { ProgressStepper, FormProgressWrapper }
export default FormProgressWrapper
