"use client";

import React from "react";
import { Check } from "lucide-react";

interface Step {
  id: number;
  name: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[#E4E7E9] shadow-sm mb-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto relative">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    steps[idx - 1].id < currentStep
                      ? "bg-[hsl(var(--primary))] h-[2px]"
                      : "border-t-2 border-dashed border-[#E4E7E9]"
                  }`}
                />
              )}

              {/* Step indicator */}
              <div
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => onStepClick?.(step.id)}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    isCompleted
                      ? "bg-[hsl(var(--primary))] text-white shadow"
                      : isCurrent
                      ? "border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-white shadow"
                      : "border-2 border-[#E4E7E9] text-[#5B6B65] bg-white"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.id}
                </div>
                <span
                  className={`text-xs mt-2 font-medium transition ${
                    isCurrent ? "font-bold text-[#0F2A22]" : "text-[#5B6B65]"
                  }`}
                >
                  {step.name}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
