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
  TouchableOpacity,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, router } from 'expo-router';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react-native';

// ─── Constants ─────────────────────────────────────────────────────────────

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const emptyAddress = { formatted: '', lat: null as number | null, lng: null as number | null };

// ─── Schema ────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().min(5, 'Enter a valid phone number.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  name: z.string().min(1, 'Name is required.'),
});

type RegisterForm = z.infer<typeof registerSchema>;

// ─── Colour tokens ─────────────────────────────────────────────────────────

const C = {
  bg: '#faf9f8',
  card: '#ffffff',
  border: '#dddbd8',
  primary: '#1e1e1e',
  muted: '#7a7872',
  shadow: 'rgba(30,30,30,0.06)',
};

// ─── Role selector pill ────────────────────────────────────────────────────

function RoleSelector({
  role,
  onChange,
}: {
  role: 'donor' | 'ngo';
  onChange: (r: 'donor' | 'ngo') => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#eeeceb',
        borderRadius: 50,
        padding: 4,
        marginBottom: 24,
      }}
    >
      {(['donor', 'ngo'] as const).map((r) => (
        <TouchableOpacity
          key={r}
          onPress={() => onChange(r)}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 50,
            alignItems: 'center',
            backgroundColor: role === r ? C.primary : 'transparent',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 13,
              color: role === r ? '#f7f6f5' : C.muted,
              letterSpacing: 0.5,
            }}
          >
            {r === 'donor' ? 'Donor' : 'NGO'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Step progress bar ─────────────────────────────────────────────────────

function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, marginBottom: 28 }}>
      {[1, 2].map((s) => (
        <View
          key={s}
          style={{
            flex: 1,
            height: 3,
            borderRadius: 99,
            backgroundColor: s <= step ? C.primary : '#dddbd8',
          }}
        />
      ))}
    </View>
  );
}

// ─── Field label ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: string }) {
  return (
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
      {children}
    </Text>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const [role, setRole] = useState<'donor' | 'ngo'>('donor');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', phone: '', password: '', name: '' },
  });

  const nextStep = async () => {
    const valid = await trigger(['name', 'email', 'phone']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterForm) => {
    if (!address.formatted) {
      Alert.alert('Address required', 'Please search and select your address.');
      return;
    }

    setLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role,
          business_name: role === 'donor' ? data.name : undefined,
          organization_name: role === 'ngo' ? data.name : undefined,
          phone: data.phone,
          address: address.formatted,
          is_verified: true,
        },
      },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Registration failed', error.message);
      return;
    }

    if (signUpData.user && !signUpData.session) {
      Alert.alert('Check your inbox', 'A confirmation link has been sent to your email.');
    }
    router.replace('/(auth)/login');
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
        {/* ── Subtle background blob ── */}
        <View
          style={{
            position: 'absolute',
            top: -60,
            left: -80,
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: 'rgba(30,30,30,0.04)',
          }}
          pointerEvents="none"
        />

        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>

          {/* ── Logo + wordmark ── */}
          <View style={{ alignItems: 'center', marginBottom: 36 }}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 16 }}
              resizeMode="contain"
            />
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 28, color: C.primary, letterSpacing: -0.5 }}>
              Create Account
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, marginTop: 4 }}>
              Join the SurplusLink network
            </Text>
          </View>

          {/* ── Form card ── */}
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
            <StepBar step={step} />
            <RoleSelector role={role} onChange={setRole} />

            {step === 1 ? (
              <View style={{ gap: 16 }}>
                {/* Name */}
                <View>
                  <FieldLabel>{role === 'donor' ? 'Business Name' : 'Organisation Name'}</FieldLabel>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder={role === 'donor' ? "Joe's Bakery" : 'Food Rescue NGO'}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        error={errors.name?.message}
                      />
                    )}
                  />
                </View>

                {/* Email */}
                <View>
                  <FieldLabel>Email Address</FieldLabel>
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

                {/* Phone */}
                <View>
                  <FieldLabel>Phone Number</FieldLabel>
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        placeholder="+27 ..."
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="phone-pad"
                        error={errors.phone?.message}
                      />
                    )}
                  />
                </View>

                <Button onPress={nextStep} size="lg" style={{ borderRadius: 50, marginTop: 8 }}>
                  Continue
                </Button>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                {/* Address */}
                <View style={{ zIndex: 2, minHeight: 200 }}>
                  <FieldLabel>Address</FieldLabel>
                  <GooglePlacesAutocomplete
                    placeholder="Search your address…"
                    fetchDetails
                    onPress={(data) => {
                      setAddress({ formatted: data.description, lat: null, lng: null });
                    }}
                    query={{ key: GOOGLE_PLACES_API_KEY, language: 'en', components: 'country:za' }}
                    styles={{
                      textInput: {
                        height: 48,
                        borderWidth: 1,
                        borderColor: '#dddbd8',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        fontSize: 15,
                        fontFamily: 'Inter_400Regular',
                        backgroundColor: '#fff',
                        color: '#1e1e1e',
                      },
                      listView: {
                        position: 'absolute',
                        top: 52,
                        zIndex: 1000,
                        elevation: 6,
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#dddbd8',
                        shadowColor: '#1e1e1e',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                      },
                      description: { fontFamily: 'Inter_400Regular', color: '#1e1e1e', fontSize: 14 },
                      row: { paddingHorizontal: 14, paddingVertical: 12 },
                    }}
                  />
                </View>

                {/* Password */}
                <View>
                  <FieldLabel>Password</FieldLabel>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View style={{ position: 'relative' }}>
                        <Input
                          placeholder="Min. 8 characters"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                          secureTextEntry={!showPassword}
                          error={errors.password?.message}
                        />
                        <Pressable
                          onPress={() => setShowPassword((v) => !v)}
                          style={{ position: 'absolute', right: 14, top: 14 }}
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

                {/* Action row */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Button
                    variant="outline"
                    onPress={() => setStep(1)}
                    style={{ flex: 1, borderRadius: 50 }}
                  >
                    <ChevronLeft size={16} color="#1e1e1e" />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#1e1e1e', marginLeft: 4 }}>
                      Back
                    </Text>
                  </Button>
                  <Button
                    onPress={handleSubmit(onSubmit)}
                    isLoading={loading}
                    style={{ flex: 2, borderRadius: 50 }}
                    size="lg"
                  >
                    {!loading ? 'Sign Up' : ''}
                  </Button>
                </View>
              </View>
            )}
          </View>

          {/* ── Login link ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 6 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', color: C.muted, fontSize: 14 }}>
              Already have an account?
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
