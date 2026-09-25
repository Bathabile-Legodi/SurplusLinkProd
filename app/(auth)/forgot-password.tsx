import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, router } from 'expo-router';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';

// ─── Schema ────────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().email('Enter a valid email address.'),
});
type Form = z.infer<typeof schema>;

// ─── Design tokens ─────────────────────────────────────────────────────────

const C = {
  bg: '#faf9f8',
  card: '#ffffff',
  border: '#dddbd8',
  primary: '#1e1e1e',
  muted: '#7a7872',
  success: '#38875a',
  successBg: '#eaf4ee',
  successBorder: '#c2e0cc',
};

// ─── Screen ────────────────────────────────────────────────────────────────

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.EXPO_PUBLIC_APP_URL}/update-password`,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: C.bg }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Background blob */}
        <View
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: 'rgba(30,30,30,0.04)',
          }}
          pointerEvents="none"
        />

        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>

          {/* Back */}
          <Pressable
            onPress={() => router.back()}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 }}
          >
            <ChevronLeft size={20} color={C.muted} />
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: C.muted }}>
              Back to Sign In
            </Text>
          </Pressable>

          {/* Header */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 28, color: C.primary, letterSpacing: -0.5 }}>
              Reset Password
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 22 }}>
              Enter your email and we&apos;ll send you a reset link.
            </Text>
          </View>

          {sent ? (
            /* ── Success state ── */
            <View
              style={{
                backgroundColor: C.successBg,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: C.successBorder,
                padding: 24,
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: C.successBorder,
                }}
              >
                <CheckCircle2 size={28} color={C.success} />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: C.success, textAlign: 'center' }}>
                Check your inbox
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#4a6e57', textAlign: 'center', lineHeight: 22 }}>
                We&apos;ve sent a reset link to{' '}
                <Text style={{ fontFamily: 'Inter_600SemiBold' }}>{getValues('email')}</Text>
              </Text>
              <Button
                variant="outline"
                onPress={() => router.replace('/(auth)/login')}
                style={{ marginTop: 8, borderRadius: 50 }}
              >
                Back to Sign In
              </Button>
            </View>
          ) : (
            /* ── Form card ── */
            <View
              style={{
                backgroundColor: C.card,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: C.border,
                padding: 24,
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: C.muted,
                    marginBottom: 6,
                  }}
                >
                  Email Address
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="name@example.com"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={errors.email?.message}
                    />
                  )}
                />
              </View>

              <Button
                onPress={handleSubmit(onSubmit)}
                isLoading={loading}
                size="lg"
                style={{ borderRadius: 50 }}
              >
                {!loading ? 'Send Reset Link' : ''}
              </Button>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 6 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', color: C.muted, fontSize: 14 }}>
              Remembered your password?
            </Text>
            <Link href="/(auth)/login">
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.primary, fontSize: 14, textDecorationLine: 'underline' }}>
                Sign In
              </Text>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
