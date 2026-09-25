import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Link } from 'expo-router';
import { Plus, Clock, CheckCircle2, Package } from 'lucide-react-native';

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
  warning: '#c89520',
  warningBg: '#fef8e7',
  destructive: '#c94a2a',
  destructiveBg: '#fdf0ec',
};

// ─── Helper components ─────────────────────────────────────────────────────

function SectionHeader({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontFamily: 'Inter_700Bold',
        fontSize: 17,
        color: C.primary,
        marginBottom: 12,
        letterSpacing: -0.2,
      }}
    >
      {children}
    </Text>
  );
}

function StatCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <Text
        style={{
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: C.muted,
          marginBottom: 6,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, color: C.primary, letterSpacing: -0.5 }}>
        {value}
      </Text>
      {trend && (
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: C.success, marginTop: 4 }}>
          {trend}
        </Text>
      )}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = C.mutedBg;
  let fg = C.muted;
  if (s === 'completed') { bg = C.successBg; fg = C.success; }
  else if (s === 'claimed') { bg = '#e8f0fe'; fg = '#1a56db'; }
  else if (s === 'unclaimed') { bg = C.warningBg; fg = C.warning; }

  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: fg, textTransform: 'capitalize' }}>
        {status}
      </Text>
    </View>
  );
}

function ActivityRow({ item }: { item: any }) {
  const isComplete = item.status === 'completed';
  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isComplete ? C.successBg : C.warningBg,
        }}
      >
        {isComplete
          ? <CheckCircle2 size={20} color={C.success} />
          : <Clock size={20} color={C.warning} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.primary }}>
          {item.batch_type || 'Donation'}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted, marginTop: 2 }}>
          {new Date(item.submitted_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <StatusBadge status={item.status} />
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const displayName =
    user?.user_metadata?.business_name ||
    user?.user_metadata?.organization_name ||
    'Partner';
  const role = user?.user_metadata?.role as string;

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('donation_batches')
        .select('*, donation_items(*)')
        .eq(role === 'ngo' ? 'claimed_by' : 'donor_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(5);
      if (cancelled) return;
      if (!error && data) setDonations(data);
      setLoading(false);
      setRefreshing(false);
    })();

    return () => { cancelled = true; };
  }, [user, role, refreshTick]);

  const onRefresh = () => { setRefreshing(true); setRefreshTick((t) => t + 1); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ── Header band ── */}
      <View
        style={{
          backgroundColor: C.primary,
          paddingHorizontal: 24,
          paddingTop: 60,
          paddingBottom: 36,
        }}
      >
        {/* Subtle blob */}
        <View
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
          pointerEvents="none"
        />
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(247,246,245,0.6)', marginBottom: 4 }}>
          {greeting()}
        </Text>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#f7f6f5', letterSpacing: -0.5 }}>
          {displayName}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(247,246,245,0.55)', marginTop: 6 }}>
          Thank you for helping fight food waste.
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: -20 }}>

        {/* ── Stats row ── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          <StatCard label="People Fed" value="1,240" trend="↑ 18% this month" />
          <StatCard label="Kilos Saved" value="1,750" trend="↑ 12% this month" />
        </View>

        {/* ── Donor CTA ── */}
        {role === 'donor' && (
          <Link href="/donate/consent" asChild>
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: C.primary,
                borderRadius: 18,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 28,
                opacity: pressed ? 0.88 : 1,
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 4,
              })}
            >
              {/* Blob accent */}
              <View
                style={{
                  position: 'absolute',
                  right: -20,
                  top: -20,
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}
                pointerEvents="none"
              />
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: '#f7f6f5', letterSpacing: -0.2 }}>
                  Log New Donation
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(247,246,245,0.6)', marginTop: 3 }}>
                  Help feed more people today.
                </Text>
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={22} color="#f7f6f5" />
              </View>
            </Pressable>
          </Link>
        )}

        {/* ── Recent Activity ── */}
        <View>
          <SectionHeader>Recent Activity</SectionHeader>

          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', color: C.muted }}>Loading…</Text>
            </View>
          ) : donations.length === 0 ? (
            <View
              style={{
                backgroundColor: C.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: C.border,
                padding: 32,
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: C.mutedBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}
              >
                <Package size={24} color={C.muted} />
              </View>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.primary }}>No activity yet</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.muted, textAlign: 'center' }}>
                {role === 'donor'
                  ? 'Log your first donation to get started.'
                  : 'Donations you claim will appear here.'}
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {donations.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
}
