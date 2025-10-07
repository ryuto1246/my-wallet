import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-glass hover:from-blue-600 hover:to-purple-700 hover:scale-105 backdrop-blur-sm border border-white/20",
        destructive:
          "bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-glass hover:from-red-600 hover:to-pink-700 hover:scale-105 backdrop-blur-sm border border-white/20",
        outline:
          "border-2 border-white/40 bg-white/30 backdrop-blur-md shadow-glass hover:bg-white/50 hover:border-white/60 text-gray-900",
        secondary:
          "bg-white/40 text-gray-900 backdrop-blur-md shadow-glass hover:bg-white/60 border border-white/30",
        ghost: "hover:bg-white/40 backdrop-blur-sm text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3 text-xs",
        lg: "h-11 rounded-2xl px-8",
        icon: "h-10 w-10",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
