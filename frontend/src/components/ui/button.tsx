import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium tracking-tight ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-[0_18px_35px_rgba(47,75,255,0.35)] hover:shadow-[0_25px_45px_rgba(47,75,255,0.35)]",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border border-white/70 bg-white/70 text-foreground shadow-[0_8px_25px_rgba(15,23,42,0.08)] backdrop-blur hover:border-foreground/30",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-foreground/5 text-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                tonal: "bg-primary/10 text-primary border border-primary/15 hover:bg-primary/15",
                soft: "bg-gradient-to-r from-white/90 to-white text-foreground border border-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:-translate-y-0.5",
                "ghost-tonal": "text-foreground hover:bg-primary/10 hover:text-primary",
            },
            size: {
                default: "h-11 px-5",
                sm: "h-9 rounded-full px-4 text-xs",
                lg: "h-12 rounded-full px-8 text-base",
                icon: "h-11 w-11",
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
