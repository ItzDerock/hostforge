import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type LucideIcon } from "lucide-react";
import * as React from "react";
import { CgSpinner } from "react-icons/cg";
import { cn } from "~/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-500 text-white shadow-sm hover:bg-green-600",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  icon?: LucideIcon;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      children,
      isLoading,
      icon: Icon,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const Child = asChild ? "span" : React.Fragment;
    const iconPadding = children ? " mr-2" : "";
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const disabled = isLoading || props.disabled;

    // override onClick if disabled
    if (disabled) {
      props.onClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
    }

    // handle disabled ourselves, since disabled also hides it from screen readers and we don't want that
    delete props.disabled;

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          disabled && "!cursor-not-allowed brightness-75 filter",
        )}
        aria-disabled={disabled}
        ref={ref}
        {...props}
      >
        <Child>
          {isLoading && <CgSpinner className={"animate-spin" + iconPadding} />}
          {Icon && !isLoading && <Icon className={iconPadding} size={18} />}

          {children}
        </Child>
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
