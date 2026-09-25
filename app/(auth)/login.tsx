import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, router } from 'expo-router';
import { useAuth } from '@/components/AuthProvider';
import { Eye, EyeOff } from 'lucide-react-native';

// ─── Schema ────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Screen ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (session) {
    router.replace('/(tabs)');
    return null;
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#faf9f8' }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Subtle background blob ── */}
        <View
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: 'rgba(30,30,30,0.04)',
          }}
          pointerEvents="none"
        />

        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>

          {/* ── Logo + wordmark ── */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text
              style={{
                fontFamily: 'Inter_900Black',
                fontSize: 28,
                color: '#1e1e1e',
                letterSpacing: -0.5,
              }}
            >
              SurplusLink
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 14,
                color: '#7a7872',
                marginTop: 4,
              }}
            >
              Sign in to your account
            </Text>
          </View>

          {/* ── Form card ── */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#dddbd8',
              padding: 24,
              shadowColor: '#1e1e1e',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 16,
              elevation: 3,
            }}
          >

            {/* Email */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: '#7a7872',
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
                    autoComplete="email"
                    error={errors.email?.message}
                  />
                )}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text
                  style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 11,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    color: '#7a7872',
                  }}
                >
                  Password
                </Text>
                <Link href="/(auth)/forgot-password">
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#7a7872', textDecorationLine: 'underline' }}>
                    Forgot password?
                  </Text>
                </Link>
              </View>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ position: 'relative' }}>
                    <Input
                      placeholder="••••••••"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      error={errors.password?.message}
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: 14,
                      }}
                    >
                      {showPassword
                        ? <EyeOff size={18} color="#7a7872" />
                        : <Eye size={18} color="#7a7872" />
                      }
                    </Pressable>
                  </View>
                )}
              />
            </View>

            {/* Sign In button */}
            <Button
              onPress={handleSubmit(onSubmit)}
              isLoading={loading}
              size="lg"
              style={{ width: '100%', borderRadius: 50 }}
            >
              {!loading ? 'Sign In' : ''}
            </Button>
          </View>

          {/* ── Register link ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 6 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', color: '#7a7872', fontSize: 14 }}>
              Don&apos;t have an account?
            </Text>
            <Link href="/(auth)/register">
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  color: '#1e1e1e',
                  fontSize: 14,
                  textDecorationLine: 'underline',
                }}
              >
                Register
              </Text>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
