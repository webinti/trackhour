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
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            ref={ref}
            type="checkbox"
            className={cn("sr-only", className)}
            {...props}
          />
          {/* Toggle switch */}
          <div className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-gray-300 transition-colors group-has-[:checked]:bg-[var(--brand-green)]">
            <span
              className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white shadow-sm transition-transform group-has-[:checked]:translate-x-6"
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
