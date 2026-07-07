import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded border border-brand-slate/30 bg-white px-3 text-sm text-brand-deep",
      "focus:outline-none focus:ring-2 focus:ring-brand/40",
      "disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";
