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
import { MapPin, Clock, Package, ChevronRight } from 'lucide-react-native';

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#faf9f8',
  card: '#ffffff',
  border: '#dddbd8',
  primary: '#1e1e1e',
  muted: '#7a7872',
  mutedBg: '#eeeceb',
  warning: '#c89520',
  warningBg: '#fef8e7',
};

export default function NGOExploreScreen() {
  useAuth();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('donation_batches')
        .select(`
          id, batch_type, status, submitted_at, collection_datetime,
          donation_items(name, category, quantity, unit),
          donors:donor_id(organization_name, business_name, address)
        `)
        .eq('status', 'unclaimed')
        .order('submitted_at', { ascending: false });
      if (cancelled) return;
      if (!error && data) setDonations(data);
      setLoading(false);
      setRefreshing(false);
    })();
    return () => { cancelled = true; };
  }, [refreshTick]);

  const onRefresh = () => { setRefreshing(true); setRefreshTick(t => t + 1); };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.primary, paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 }}>
        <View style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' }} pointerEvents="none" />
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(247,246,245,0.55)', marginBottom: 4 }}>
          Available Now
        </Text>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#f7f6f5', letterSpacing: -0.5 }}>
          Explore Donations
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' }} />
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(247,246,245,0.6)' }}>
            {donations.length} unclaimed donation{donations.length !== 1 ? 's' : ''} available
          </Text>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
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
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.primary }}>
              No donations available
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, textAlign: 'center' }}>
              Pull to refresh — new donations appear here in real time.
            </Text>
          </View>
        ) : (
          donations.map(d => {
            const donor: any = Array.isArray(d.donors) ? d.donors[0] : d.donors;
            const donorName = donor?.business_name || donor?.organization_name || 'Anonymous';
            const items: any[] = d.donation_items ?? [];
            const totalKg = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);

            return (
              <Pressable
                key={d.id}
                onPress={() => router.push(`/claim/${d.id}`)}
                style={({ pressed }) => ({
                  backgroundColor: C.card,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: C.border,
                  overflow: 'hidden',
                  opacity: pressed ? 0.85 : 1,
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2,
                })}
              >
                {/* Colour band top */}
                <View style={{ backgroundColor: C.primary, paddingHorizontal: 16, paddingVertical: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: '#f7f6f5', letterSpacing: -0.3 }}>
                        {d.batch_type || 'Donation'}
                      </Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(247,246,245,0.6)', marginTop: 2 }}>
                        From {donorName}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: C.warningBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.warning }}>
                        Unclaimed
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Details */}
                <View style={{ padding: 16, gap: 12 }}>
                  {donor?.address && (
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={15} color={C.muted} />
                      </View>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.primary, flex: 1, lineHeight: 20 }} numberOfLines={2}>
                        {donor.address}
                      </Text>
                    </View>
                  )}
                  {d.collection_datetime && (
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={15} color={C.muted} />
                      </View>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.primary }}>
                        Collect by {new Date(d.collection_datetime).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.muted }}>
                      {items.length} item{items.length !== 1 ? 's' : ''} · ~{totalKg} kg
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: C.primary }}>Claim</Text>
                      <ChevronRight size={14} color={C.primary} />
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
