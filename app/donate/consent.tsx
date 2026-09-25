import React, { useState } from 'react';
import { View, Text, Switch, ScrollView, Pressable } from 'react-native';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { useAuth } from '@/components/AuthProvider';
import { CheckCircle2, ChevronLeft } from 'lucide-react-native';

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#faf9f8',
  card: '#ffffff',
  border: '#dddbd8',
  primary: '#1e1e1e',
  muted: '#7a7872',
  mutedBg: '#eeeceb',
  success: '#38875a',
  successBg: '#eaf4ee',
  successBorder: '#c2e0cc',
};

const bulletPoints = [
  'The food being donated is safe for human consumption.',
  'Pre-weight, category and expiry information is accurate.',
  'Your business / organisation is protected from liability.',
  'I have read and agree to the donation terms.',
];

export default function ConsentScreen() {
  const [agreed, setAgreed] = useState(false);
  const { user } = useAuth();
  const displayName =
    user?.user_metadata?.business_name ||
    user?.user_metadata?.organization_name ||
    user?.user_metadata?.full_name ||
    'Partner';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: C.card,
          paddingTop: 56,
          paddingBottom: 14,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: C.mutedBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={20} color={C.primary} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.primary, letterSpacing: -0.2 }}>
          Donation Consent
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.muted, marginBottom: 4 }}>
            SurplusLink
          </Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, color: C.primary, letterSpacing: -0.4 }}>
            Welcome, {displayName}
          </Text>
        </View>

        {/* Declaration card */}
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            padding: 22,
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 12,
            elevation: 2,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: C.primary, marginBottom: 8, letterSpacing: -0.2 }}>
            Declaration Form
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 20 }}>
            By proceeding to log a donation, your affiliate confirms that:
          </Text>

          <View style={{ gap: 14 }}>
            {bulletPoints.map((point, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    backgroundColor: C.successBg,
                    borderWidth: 1,
                    borderColor: C.successBorder,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={16} color={C.success} />
                </View>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.primary, lineHeight: 22, flex: 1 }}>
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Agreement toggle */}
        <View
          style={{
            backgroundColor: agreed ? C.successBg : C.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: agreed ? C.successBorder : C.border,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: agreed ? C.success : C.primary, marginBottom: 2 }}>
              I Agree
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted }}>
              I have read and agree to the declaration above.
            </Text>
          </View>
          <Switch
            value={agreed}
            onValueChange={setAgreed}
            trackColor={{ false: C.border, true: C.success }}
            thumbColor="#ffffff"
          />
        </View>
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          backgroundColor: C.card,
          padding: 20,
          paddingBottom: 36,
          borderTopWidth: 1,
          borderTopColor: C.border,
        }}
      >
        <Button
          disabled={!agreed}
          onPress={() => router.push('/donate/batch')}
          size="lg"
          style={{ borderRadius: 50, width: '100%' }}
        >
          Continue to Donation
        </Button>
      </View>
    </View>
  );
}
