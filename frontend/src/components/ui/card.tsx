import * as React from "react"

import { cn } from "@/lib/utils"

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
    blur?: boolean
    variant?: "solid" | "glass"
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, blur, variant = "solid", ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "rounded-[24px] border border-white/60 bg-card text-card-foreground shadow-[0_25px_65px_rgba(15,23,42,0.08)] transition-all duration-300",
            "hover:shadow-[0_35px_85px_rgba(15,23,42,0.12)]",
            blur && "bg-white/70 backdrop-blur-xl border-white/30",
            variant === "glass" && "bg-white/60 border-white/40 backdrop-blur-lg",
            className
        )}
        {...props}
    />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex flex-col space-y-1.5 p-8 pb-4", className)}
        {...props}
    />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn(
            "text-2xl font-semibold leading-tight tracking-tight",
            className
        )}
        {...props}
    />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-8 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-8 pt-0", className)}
        {...props}
    />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
