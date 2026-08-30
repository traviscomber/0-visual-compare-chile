import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30",
  {
    variants: {
      variant: {
        default: 'border-0 bg-primary text-primary-foreground hover:bg-[#568D81]',
        destructive:
          'border-0 bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/40',
        outline:
          'border-0 bg-[#26363A] text-white hover:bg-[#304247] hover:text-white',
        secondary:
          'border-0 bg-secondary text-secondary-foreground hover:bg-[#1E4A44]',
        ghost:
          'border-0 bg-transparent text-muted-foreground hover:bg-accent hover:text-white',
        link: 'border-0 bg-transparent text-primary underline-offset-4 hover:text-[#96B5A6] hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3.5',
        sm: 'h-9 rounded-[9px] gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-[10px] px-6 has-[>svg]:px-4',
        icon: 'size-10',
        'icon-sm': 'size-9 rounded-[9px]',
        'icon-lg': 'size-11 rounded-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
