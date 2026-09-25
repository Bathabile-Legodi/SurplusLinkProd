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
import { router } from 'expo-router';
import {
  CheckCircle2,
  Clock,
  Package,
  ChevronRight,
} from 'lucide-react-native';

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
  blue: '#1a56db',
  blueBg: '#e8f0fe',
};

const STATUS_FILTERS = ['All', 'Unclaimed', 'Claimed', 'Completed'];

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = C.mutedBg, fg = C.muted;
  if (s === 'completed') { bg = C.successBg; fg = C.success; }
  else if (s === 'claimed') { bg = C.blueBg; fg = C.blue; }
  else if (s === 'unclaimed') { bg = C.warningBg; fg = C.warning; }
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: fg, textTransform: 'capitalize' }}>
        {status}
      </Text>
    </View>
  );
}

export default function DonorHistoryScreen() {
  const { user } = useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      let query = supabase
        .from('donation_batches')
        .select('*, donation_items(*)')
        .eq('donor_id', user.id)
        .order('submitted_at', { ascending: false });
      if (filter !== 'All') {
        query = query.eq('status', filter.toLowerCase());
      }
      const { data, error } = await query;
      if (cancelled) return;
      if (!error && data) setDonations(data);
      setLoading(false);
      setRefreshing(false);
    })();
    return () => { cancelled = true; };
  }, [user, filter, refreshTick]);

  const onRefresh = () => { setRefreshing(true); setRefreshTick(t => t + 1); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)' }} pointerEvents="none" />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(247,246,245,0.55)', marginBottom: 4 }}>
          Donation History
        </Text>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#f7f6f5', letterSpacing: -0.5 }}>
          My Donations
        </Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14, gap: 8 }}
        style={{ backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border, maxHeight: 60 }}
      >
        {STATUS_FILTERS.map(f => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 50,
              backgroundColor: filter === f ? C.primary : C.mutedBg,
            }}
          >
            <Text style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 12,
              color: filter === f ? '#f7f6f5' : C.muted,
            }}>
              {f}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', color: C.muted }}>Loading…</Text>
          </View>
        ) : donations.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} color={C.muted} />
            </View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.primary }}>No donations yet</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, textAlign: 'center' }}>
              {filter !== 'All' ? `No ${filter.toLowerCase()} donations found.` : 'Your donation history will appear here.'}
            </Text>
          </View>
        ) : (
          donations.map(d => {
            const items: any[] = d.donation_items ?? [];
            const isComplete = d.status === 'completed';
            return (
              <Pressable
                key={d.id}
                onPress={() => router.push(`/claim/${d.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: C.card,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  opacity: pressed ? 0.8 : 1,
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 1,
                })}
              >
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 13,
                  backgroundColor: isComplete ? C.successBg : C.warningBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {isComplete
                    ? <CheckCircle2 size={22} color={C.success} />
                    : <Clock size={22} color={C.warning} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: C.primary, marginBottom: 3 }}>
                    {d.batch_type || 'Donation'}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted }}>
                    {items.length} item{items.length !== 1 ? 's' : ''} · {new Date(d.submitted_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <StatusBadge status={d.status} />
                  <ChevronRight size={14} color={C.muted} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
