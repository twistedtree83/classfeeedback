import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary text-white shadow-soft hover:shadow-medium hover:bg-dark-purple-400 hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-red text-white shadow-soft hover:shadow-medium hover:bg-red/90 hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-2 border-border bg-background shadow-soft hover:bg-muted hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0",
        secondary:
          "bg-deep-sky-blue text-white shadow-soft hover:shadow-medium hover:bg-deep-sky-blue-600 hover:-translate-y-0.5 active:translate-y-0",
        accent:
          "bg-harvest-gold text-dark-purple shadow-soft hover:shadow-medium hover:bg-harvest-gold-600 hover:-translate-y-0.5 active:translate-y-0",
        success:
          "bg-sea-green text-white shadow-soft hover:shadow-medium hover:bg-sea-green-600 hover:-translate-y-0.5 active:translate-y-0",
        info: "bg-bice-blue text-white shadow-soft hover:shadow-medium hover:bg-bice-blue-600 hover:-translate-y-0.5 active:translate-y-0",
        ghost:
          "hover:bg-muted hover:text-foreground hover:-translate-y-0.5 active:translate-y-0",
        link: "text-brand-primary underline-offset-4 hover:underline hover:text-dark-purple-400",
        gradient:
          "bg-gradient-to-r from-brand-primary via-deep-sky-blue to-harvest-gold text-white shadow-soft hover:shadow-glow-blue hover:-translate-y-0.5 active:translate-y-0",
        glass:
          "glass backdrop-blur-sm border border-white/20 text-foreground shadow-soft hover:shadow-medium hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-2xl px-10 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
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
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const content = isLoading ? (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    ) : (
      children
    );

    // When using asChild, we can't add any wrapper elements or multiple children
    if (asChild) {
      // Create modified props that include disabled state
      const childProps = {
        ...props,
        disabled: disabled || isLoading,
        className: cn(
          buttonVariants({ variant, size, className }),
          (props as any).className
        ),
      };

      return (
        <Slot ref={ref} {...childProps}>
          {content}
        </Slot>
      );
    }

    // For regular buttons, we can include the shimmer effect
    const hasShimmerEffect =
      variant === "default" ||
      variant === "secondary" ||
      variant === "accent" ||
      variant === "gradient";

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {hasShimmerEffect && (
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out" />
        )}
        {content}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
