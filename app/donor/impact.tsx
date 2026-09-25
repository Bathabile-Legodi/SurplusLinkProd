import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { Leaf, Users, Package, TrendingUp } from 'lucide-react-native';

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

interface Stats {
  totalBatches: number;
  completedBatches: number;
  totalKg: number;
  mealsEstimate: number;
  co2Prevented: number;
}

function ImpactCard({
  icon: Icon,
  value,
  label,
  sub,
  color,
  colorBg,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  sub?: string;
  color: string;
  colorBg: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: C.border,
        padding: 18,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colorBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={20} color={color} />
      </View>
      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: C.primary, letterSpacing: -0.5, lineHeight: 30 }}>
        {value}
      </Text>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.muted, marginTop: 4 }}>
        {label}
      </Text>
      {sub && (
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: color, marginTop: 3 }}>
          {sub}
        </Text>
      )}
    </View>
  );
}

export default function DonorImpactScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalBatches: 0, completedBatches: 0, totalKg: 0, mealsEstimate: 0, co2Prevented: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('donation_batches')
        .select('status, donation_items(quantity, unit)')
        .eq('donor_id', user.id);
      if (cancelled) return;
      if (!error && data) {
        const totalBatches = data.length;
        const completedBatches = data.filter(d => d.status === 'completed').length;
        let totalKg = 0;
        data.forEach((batch: any) => {
          (batch.donation_items || []).forEach((item: any) => {
            const qty = Number(item.quantity) || 0;
            const unit = (item.unit || '').toLowerCase();
            totalKg += unit === 'kg' ? qty : unit === 'g' ? qty / 1000 : qty;
          });
        });
        setStats({
          totalBatches,
          completedBatches,
          totalKg: Math.round(totalKg * 10) / 10,
          mealsEstimate: Math.round(totalKg * 2.5),
          co2Prevented: Math.round(totalKg * 2.5 * 10) / 10,
        });
      }
      setRefreshing(false);
    })();
    return () => { cancelled = true; };
  }, [user, refreshTick]);

  const onRefresh = () => { setRefreshing(true); setRefreshTick(t => t + 1); };

  const completionRate = stats.totalBatches > 0
    ? Math.round((stats.completedBatches / stats.totalBatches) * 100)
    : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header band */}
      <View style={{ backgroundColor: C.primary, paddingTop: 56, paddingBottom: 36, paddingHorizontal: 20 }}>
        <View style={{ position: 'absolute', bottom: -30, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)' }} pointerEvents="none" />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(247,246,245,0.55)', marginBottom: 4 }}>
          Your Impact
        </Text>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#f7f6f5', letterSpacing: -0.5 }}>
          Every donation counts.
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(247,246,245,0.6)', marginTop: 6 }}>
          Here&apos;s what you&apos;ve contributed to the SurplusLink network.
        </Text>
      </View>

      <View style={{ padding: 20, gap: 12, marginTop: -16 }}>
        {/* Top stats grid */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ImpactCard
            icon={Package}
            value={String(stats.totalBatches)}
            label="Total Donations"
            sub={`${stats.completedBatches} completed`}
            color={C.primary}
            colorBg={C.mutedBg}
          />
          <ImpactCard
            icon={Users}
            value={String(stats.mealsEstimate)}
            label="Meals Enabled"
            sub="estimated"
            color={C.success}
            colorBg={C.successBg}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ImpactCard
            icon={Leaf}
            value={`${stats.totalKg} kg`}
            label="Food Rescued"
            color="#15803d"
            colorBg="#dcfce7"
          />
          <ImpactCard
            icon={TrendingUp}
            value={`${stats.co2Prevented} kg`}
            label="CO₂ Prevented"
            sub="estimated offset"
            color="#0369a1"
            colorBg="#e0f2fe"
          />
        </View>

        {/* Completion rate card */}
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            padding: 20,
            shadowColor: C.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 1,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.primary }}>Completion Rate</Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, color: C.primary }}>{completionRate}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: C.mutedBg, borderRadius: 99 }}>
            <View style={{ height: 8, width: `${completionRate}%`, backgroundColor: C.success, borderRadius: 99 }} />
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted, marginTop: 8 }}>
            {stats.completedBatches} of {stats.totalBatches} donations collected by an NGO
          </Text>
        </View>

        {/* Info card */}
        <View
          style={{
            backgroundColor: C.successBg,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.successBorder,
            padding: 20,
            gap: 8,
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: C.success }}>
            How we measure impact
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#4a6e57', lineHeight: 22 }}>
            Meal estimates use an industry average of ~400g per meal. CO₂ figures are based on WRAP food waste emissions factors. All numbers are approximate.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
