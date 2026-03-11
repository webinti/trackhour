"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              "sr-only peer",
              className
            )}
            {...props}
          />
          {/* Toggle switch */}
          <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors peer-checked:bg-[var(--brand-green)]">
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform peer-checked:translate-x-5 ml-1"
              aria-hidden="true"
            />
          </div>
          {label && (
            <span className="text-sm font-medium text-[var(--brand-dark)]">
              {label}
            </span>
          )}
        </label>
        {description && (
          <p className="text-xs text-gray-500">{description}</p>
        )}
      </div>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle };
