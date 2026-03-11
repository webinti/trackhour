"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-blue)] text-white shadow-md hover:bg-blue-700 hover:shadow-lg",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border-2 border-[var(--brand-blue)] text-[var(--brand-blue)] bg-transparent hover:bg-[var(--brand-blue)] hover:text-white",
        secondary:
          "bg-white text-[var(--brand-dark)] border border-[var(--border)] hover:bg-gray-50 shadow-sm",
        ghost:
          "hover:bg-gray-100 text-[var(--brand-dark)]",
        link: "text-[var(--brand-blue)] underline-offset-4 hover:underline",
        green:
          "bg-[var(--brand-green)] text-white hover:bg-emerald-600 shadow-md hover:shadow-lg",
        dark:
          "bg-[var(--brand-dark)] text-white hover:bg-[#2D1B4E] shadow-md",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {children}
          </span>
        ) : children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
