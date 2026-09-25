import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { router } from 'expo-router';
import { CheckCircle2, Clock, Package, ChevronRight, MapPin } from 'lucide-react-native';

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
  warning: '#c89520',
  warningBg: '#fef8e7',
  blue: '#1a56db',
  blueBg: '#e8f0fe',
};

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let bg = C.mutedBg, fg = C.muted;
  if (s === 'completed') { bg = C.successBg; fg = C.success; }
  else if (s === 'claimed') { bg = C.blueBg; fg = C.blue; }
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 }}>
      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: fg, textTransform: 'capitalize' }}>
        {status}
      </Text>
    </View>
  );
}

function ClaimRow({ d }: { d: any }) {
  const donor: any = Array.isArray(d.donors) ? d.donors[0] : d.donors;
  const donorName = donor?.business_name || donor?.organization_name || 'Donor';
  const items: any[] = d.donation_items ?? [];
  const isComplete = d.status === 'completed';

  return (
    <Pressable
      onPress={() => router.push(`/claim/${d.id}`)}
      style={({ pressed }) => ({
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
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
        backgroundColor: isComplete ? C.successBg : C.blueBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {isComplete
          ? <CheckCircle2 size={22} color={C.success} />
          : <Clock size={22} color={C.blue} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: C.primary, marginBottom: 2 }}>
          {d.batch_type || 'Donation'}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted }}>
          {donorName} · {items.length} item{items.length !== 1 ? 's' : ''}
        </Text>
        {donor?.address && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <MapPin size={11} color={C.muted} />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.muted }} numberOfLines={1}>
              {donor.address}
            </Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <StatusBadge status={d.status} />
        <ChevronRight size={14} color={C.muted} />
      </View>
    </Pressable>
  );
}

function Section({ title, data }: { title: string; data: any[] }) {
  if (data.length === 0) return null;
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 17, color: C.primary, marginBottom: 12 }}>
        {title}
      </Text>
      <View style={{ gap: 10 }}>
        {data.map(d => <ClaimRow key={d.id} d={d} />)}
      </View>
    </View>
  );
}

export default function NGOClaimsScreen() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('donation_batches')
        .select(`
          id, batch_type, status, submitted_at, collection_datetime,
          donation_items(name, quantity, unit),
          donors:donor_id(business_name, organization_name, address)
        `)
        .eq('claimed_by', user.id)
        .order('submitted_at', { ascending: false });
      if (cancelled) return;
      if (!error && data) setClaims(data);
      setLoading(false);
      setRefreshing(false);
    })();
    return () => { cancelled = true; };
  }, [user, refreshTick]);

  const onRefresh = () => { setRefreshing(true); setRefreshTick(t => t + 1); };

  const active = claims.filter(c => c.status === 'claimed');
  const completed = claims.filter(c => c.status === 'completed');

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.05)' }} pointerEvents="none" />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(247,246,245,0.55)', marginBottom: 4 }}>
          NGO Dashboard
        </Text>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#f7f6f5', letterSpacing: -0.5 }}>
          My Claims
        </Text>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
          <View style={{ backgroundColor: 'rgba(247,246,245,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: '#f7f6f5' }}>{active.length}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(247,246,245,0.55)' }}>Active</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(247,246,245,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, color: '#f7f6f5' }}>{completed.length}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: 'rgba(247,246,245,0.55)' }}>Completed</Text>
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', color: C.muted }}>Loading…</Text>
          </View>
        ) : claims.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
              <Package size={24} color={C.muted} />
            </View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.primary }}>No claims yet</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, textAlign: 'center' }}>
              Donations you claim from the Explore tab will appear here.
            </Text>
          </View>
        ) : (
          <>
            <Section title="Active Claims" data={active} />
            <Section title="Completed" data={completed} />
          </>
        )}
      </ScrollView>
    </View>
  );
}
