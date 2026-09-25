import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Mail, Phone, MapPin, Building, LogOut, ChevronRight, HeartHandshake, Shield, FileText } from 'lucide-react-native';

// ─── Design tokens ─────────────────────────────────────────────────────────

const C = {
  bg: '#faf9f8',
  card: '#ffffff',
  border: '#dddbd8',
  primary: '#1e1e1e',
  muted: '#7a7872',
  mutedBg: '#eeeceb',
  destructive: '#c94a2a',
  destructiveBg: '#fdf0ec',
};

// ─── Row component ─────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  isLast,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: C.border,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: C.mutedBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} color={C.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: C.muted, marginBottom: 2, letterSpacing: 0.3 }}>
          {label}
        </Text>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.primary }} numberOfLines={1}>
          {value || 'Not provided'}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.business_name ||
    user?.user_metadata?.organization_name ||
    user?.user_metadata?.full_name ||
    'Partner';
  const role = user?.user_metadata?.role as string;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  // Initials avatar
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Header band ── */}
      <View
        style={{
          backgroundColor: C.primary,
          paddingHorizontal: 24,
          paddingTop: 64,
          paddingBottom: 48,
          alignItems: 'center',
        }}
      >
        {/* Background blob */}
        <View
          style={{
            position: 'absolute',
            bottom: -30,
            left: -40,
            width: 180,
            height: 180,
            borderRadius: 90,
            backgroundColor: 'rgba(255,255,255,0.04)',
          }}
          pointerEvents="none"
        />

        {/* Avatar */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            backgroundColor: 'rgba(247,246,245,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(247,246,245,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: '#f7f6f5' }}>
            {initials}
          </Text>
        </View>

        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22, color: '#f7f6f5', letterSpacing: -0.4 }}>
          {displayName}
        </Text>

        {/* Role badge */}
        <View
          style={{
            marginTop: 8,
            paddingHorizontal: 14,
            paddingVertical: 5,
            borderRadius: 50,
            backgroundColor: 'rgba(247,246,245,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(247,246,245,0.20)',
          }}
        >
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 11,
              color: 'rgba(247,246,245,0.75)',
              textTransform: 'uppercase',
              letterSpacing: 1.2,
            }}
          >
            {role}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: -20 }}>

        {/* ── Info card ── */}
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 2,
            marginBottom: 24,
          }}
        >
          <InfoRow icon={Mail} label="Email Address" value={user?.email ?? ''} />
          <InfoRow icon={Phone} label="Phone Number" value={user?.user_metadata?.phone ?? ''} />
          <InfoRow icon={Building} label="Organisation / Business" value={displayName} />
          <InfoRow icon={MapPin} label="Address" value={user?.user_metadata?.address ?? ''} isLast />
        </View>

        {/* ── Quick links ── */}
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
            marginBottom: 12,
          }}
        >
          {[
            { icon: HeartHandshake, label: 'Community Wallet', onPress: () => router.push('/community-wallet') },
            { icon: Shield, label: 'Privacy Policy', onPress: () => router.push('/legal/privacy') },
            { icon: FileText, label: 'Terms of Service', onPress: () => router.push('/legal/terms') },
          ].map(({ icon: Icon, label, onPress }, idx, arr) => (
            <Pressable
              key={label}
              onPress={onPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                paddingHorizontal: 16,
                gap: 12,
                backgroundColor: pressed ? C.mutedBg : C.card,
                borderBottomWidth: idx !== arr.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              })}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={C.muted} />
              </View>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.primary, flex: 1 }}>{label}</Text>
              <ChevronRight size={16} color={C.muted} />
            </Pressable>
          ))}
        </View>

        {/* ── Sign out ── */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => ({
            backgroundColor: pressed ? C.destructiveBg : C.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: pressed ? C.destructive : C.border,
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            gap: 12,
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: C.destructiveBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={18} color={C.destructive} />
          </View>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.destructive, flex: 1 }}>
            Sign Out
          </Text>
          <ChevronRight size={16} color={C.destructive} />
        </Pressable>

      </View>
    </ScrollView>
  );
}
