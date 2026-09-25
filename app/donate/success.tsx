import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  primary: '#1e1e1e',
  success: '#38875a',
  successBg: '#eaf4ee',
  successBorder: '#c2e0cc',
  muted: '#7a7872',
};

export default function SuccessScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      {/* Background blobs */}
      <View style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.04)' }} pointerEvents="none" />
      <View style={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.03)' }} pointerEvents="none" />

      {/* Icon */}
      <View style={{ width: 96, height: 96, borderRadius: 28, backgroundColor: C.successBg, borderWidth: 2, borderColor: C.successBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <CheckCircle2 size={52} color={C.success} />
      </View>

      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 32, color: '#f7f6f5', textAlign: 'center', letterSpacing: -0.8, marginBottom: 16 }}>
        Donation{'\n'}Submitted!
      </Text>

      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: 'rgba(247,246,245,0.65)', textAlign: 'center', lineHeight: 26, marginBottom: 48, maxWidth: 300 }}>
        Thank you! Your donation is now live. NGOs in your area have been notified and can claim it immediately.
      </Text>

      {/* CTA buttons */}
      <View style={{ width: '100%', gap: 12 }}>
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          style={({ pressed }) => ({
            backgroundColor: '#f7f6f5',
            borderRadius: 50,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.primary }}>
            Back to Dashboard
          </Text>
          <ArrowRight size={18} color={C.primary} />
        </Pressable>

        <Pressable
          onPress={() => router.replace('/donor/history')}
          style={({ pressed }) => ({
            backgroundColor: 'rgba(247,246,245,0.10)',
            borderRadius: 50,
            borderWidth: 1,
            borderColor: 'rgba(247,246,245,0.20)',
            paddingVertical: 16,
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: 'rgba(247,246,245,0.75)' }}>
            View Donation History
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
