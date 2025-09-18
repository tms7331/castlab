import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-150 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 active:brightness-95 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 motion-reduce:transition-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-primary/90 to-primary/75 text-primary-foreground shadow-lg shadow-primary/25 active:shadow-md",
        destructive:
          "bg-gradient-to-r from-destructive via-destructive/90 to-destructive/75 text-destructive-foreground shadow-lg shadow-destructive/25 active:shadow-md",
        outline:
          "border border-primary/60 bg-gradient-to-r from-white/70 to-white/40 text-primary active:border-primary active:bg-primary/10 dark:from-white/10 dark:to-white/5 dark:text-primary-foreground",
        secondary:
          "bg-gradient-to-r from-secondary via-secondary/90 to-secondary/70 text-secondary-foreground shadow-md shadow-secondary/20 active:shadow-sm",
        ghost:
          "bg-transparent text-primary active:bg-primary/10 active:text-primary dark:text-primary-foreground",
        link:
          "text-primary underline-offset-4 active:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
