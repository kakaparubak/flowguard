import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:outline-none focus-visible:ring-0 transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-black",
        secondary:
          "bg-secondary text-black",
        destructive:
          "bg-destructive text-white",
        outline:
          "bg-white text-black",
        ghost: "border-transparent shadow-none hover:bg-accent/20 hover:border-black hover:translate-x-0 hover:translate-y-0 text-black",
        link: "text-primary border-transparent shadow-none underline-offset-4 hover:underline hover:translate-x-0 hover:translate-y-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
