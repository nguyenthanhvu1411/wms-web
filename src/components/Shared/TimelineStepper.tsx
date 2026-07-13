import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, XCircle } from 'lucide-react';
import clsx from 'clsx';

export interface TimelineStep {
  status: number;
  label: string;
  timestamp: string | null;
  actor: string | null;
  duration: string | null;
  isCurrent: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  note?: string;
}

interface TimelineStepperProps {
  steps: TimelineStep[];
  className?: string;
}

export function TimelineStepper({ steps, className }: TimelineStepperProps) {
  return (
    <div className={clsx("flex flex-col", className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.status} className="relative flex gap-4">
            {/* Left Col: Line & Icon */}
            <div className="flex flex-col items-center">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white z-10 shrink-0">
                {step.isFailed ? (
                  <XCircle className="text-red-500" size={24} />
                ) : step.isCompleted ? (
                  <CheckCircle2 className="text-emerald-500" size={24} />
                ) : step.isCurrent ? (
                  <div className="relative flex items-center justify-center w-6 h-6">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                    <Circle className="text-blue-500 relative z-10 fill-blue-50" size={20} />
                  </div>
                ) : (
                  <Circle className="text-gray-300" size={20} />
                )}
              </div>
              {!isLast && (
                <div 
                  className={clsx(
                    "w-[2px] h-full flex-grow absolute top-8 bottom-[-8px]",
                    step.isCompleted ? "bg-emerald-500" : "bg-gray-200"
                  )}
                />
              )}
            </div>

            {/* Right Col: Content */}
            <div className="pb-8 pt-1 flex flex-col gap-1 w-full">
              <div className="flex justify-between items-start">
                <span className={clsx(
                  "font-medium",
                  step.isFailed ? "text-red-600" : 
                  step.isCurrent ? "text-blue-700" :
                  step.isCompleted ? "text-gray-900" : "text-gray-500"
                )}>
                  {step.label}
                </span>
                
                {step.timestamp && (
                  <div className="flex flex-col items-end text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{new Date(step.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {step.actor && (
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                    {step.actor.substring(0, 2).toUpperCase()}
                  </div>
                  <span>{step.actor}</span>
                </div>
              )}
              
              {step.duration && (
                <div className="text-xs text-gray-400 mt-1">
                  +{step.duration}
                </div>
              )}
              
              {step.note && (
                <div className={clsx(
                  "mt-2 p-3 rounded-md text-sm border-l-2",
                  step.isFailed ? "bg-red-50 border-red-500 text-red-800" : "bg-gray-50 border-gray-300 text-gray-700"
                )}>
                  {step.isFailed && <AlertCircle size={14} className="inline-block mr-1 mb-[2px]" />}
                  {step.note}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
