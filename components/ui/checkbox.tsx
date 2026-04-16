"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked, onCheckedChange, disabled, className, id, ...props }, ref) => {
    return (
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={cn(
          "h-4 w-4 rounded border-2 border-gray-300 bg-white",
          "checked:bg-blue-600 checked:border-blue-600",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "cursor-pointer transition-colors",
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
