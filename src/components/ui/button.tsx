import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-bold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary/90 text-primary-foreground backdrop-blur-md shadow-lg hover:bg-primary hover:shadow-primary/20",
        destructive:
          "bg-destructive/90 text-destructive-foreground backdrop-blur-md hover:bg-destructive shadow-lg",
        outline:
          "border-2 border-white/40 bg-white/20 backdrop-blur-md hover:bg-white/40 hover:text-accent-foreground shadow-sm",
        secondary:
          "bg-secondary/80 text-secondary-foreground backdrop-blur-md hover:bg-secondary/90 shadow-sm",
        ghost: "hover:bg-white/30 hover:backdrop-blur-md hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl hover:bg-white/60 dark:hover:bg-white/20 text-primary dark:text-white",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-xl px-4",
        lg: "h-14 rounded-3xl px-10 text-base",
        icon: "h-11 w-11 rounded-full",
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