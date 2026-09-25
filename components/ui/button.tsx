import * as React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
} from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ─── Variant definitions ───────────────────────────────────────────────────

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-full overflow-hidden',
  {
    variants: {
      variant: {
        /** Charcoal-black pill — mirrors the web's primary button */
        default: 'bg-[#1e1e1e] active:bg-[#333]',
        /** Outlined charcoal border — mirrors web's "Sign In" ghost */
        outline: 'border border-[#dddbd8] bg-white active:bg-[#eeeceb]',
        /** Destructive red */
        destructive: 'bg-[#c94a2a] active:bg-[#a33a1e]',
        /** Light muted surface */
        secondary: 'bg-[#eeeceb] active:bg-[#dddbd8]',
        ghost: 'bg-transparent active:bg-[#eeeceb]',
        link: 'bg-transparent',
      },
      size: {
        default: 'h-12 px-6 py-2',
        sm: 'h-9 px-4',
        lg: 'h-14 px-8',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva('font-semibold tracking-tight', {
  variants: {
    variant: {
      default: 'text-[#f7f6f5]',
      outline: 'text-[#1e1e1e]',
      destructive: 'text-white',
      secondary: 'text-[#1e1e1e]',
      ghost: 'text-[#1e1e1e]',
      link: 'text-[#1e1e1e] underline',
    },
    size: {
      default: 'text-[15px]',
      sm: 'text-sm',
      lg: 'text-base',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

// ─── Props ─────────────────────────────────────────────────────────────────

interface ButtonProps
  extends React.ComponentPropsWithoutRef<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
  textClassName?: string;
  isLoading?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────────

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      textClassName,
      children,
      style,
      isLoading,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <Pressable
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        style={[{ opacity: isDisabled ? 0.5 : 1 }, style as any]}
        disabled={isDisabled}
        {...props}
      >
        {isLoading && (
          <ActivityIndicator
            size="small"
            color={variant === 'default' || variant === 'destructive' ? '#f7f6f5' : '#1e1e1e'}
            style={{ marginRight: 8 }}
          />
        )}
        {typeof children === 'string' ? (
          <Text className={cn(buttonTextVariants({ variant, size }), textClassName)}>
            {children}
          </Text>
        ) : (
          children as React.ReactNode
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants, buttonTextVariants };
export type { ButtonProps };
