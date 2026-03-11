import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-[var(--brand-dark)]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm text-[var(--brand-dark)]",
              "placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-150",
              icon && "pl-10",
              error && "border-red-400 focus:ring-red-400",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
