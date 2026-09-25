import * as React from 'react';
import {
  TextInput,
  View,
  Text,
  type TextInputProps,
} from 'react-native';
import { cn } from '@/lib/utils';

// ─── Props ─────────────────────────────────────────────────────────────────

interface InputProps extends TextInputProps {
  /** NativeWind class string forwarded to the TextInput element */
  className?: string;
  /** Optional label rendered above the input */
  label?: string;
  /** Error message shown below the input */
  error?: string;
  containerClassName?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, label, error, containerClassName, style, ...props }, ref) => {
    const hasError = !!error;

    return (
      <View className={cn('gap-1', containerClassName)}>
        {label && (
          <Text className="text-xs font-semibold uppercase tracking-widest text-[#7a7872] mb-1">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor="#b0aea8"
          className={cn(
            'h-12 w-full rounded-xl border bg-white px-4 text-[15px] text-[#1e1e1e]',
            hasError ? 'border-[#c94a2a]' : 'border-[#dddbd8]',
            'focus:border-[#1e1e1e]',
            className
          )}
          style={[{ fontFamily: 'Inter_400Regular' }, style as any]}
          {...props}
        />
        {hasError && (
          <Text className="text-xs text-[#c94a2a] mt-0.5">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
