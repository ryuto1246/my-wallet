import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border-2 border-white/50",
          "bg-white/70 backdrop-blur-xl",
          "px-4 py-3 text-base shadow-glass font-medium",
          "transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-gray-400",
          "text-gray-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/60",
          "focus-visible:border-blue-600/60",
          "focus-visible:bg-white/80",
          "hover:bg-white/75",
          "hover:border-white/60",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
