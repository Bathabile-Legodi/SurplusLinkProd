import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { ChevronLeft, MapPin, CalendarClock, Tag } from 'lucide-react-native';

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
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color={C.muted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.muted, marginBottom: 3 }}>{label}</Text>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: C.primary, lineHeight: 22 }}>{value}</Text>
      </View>
    </View>
  );
}

export default function ClaimDonationScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('donation_batches')
        .select(`id, batch_type, collection_datetime, status, submitted_at, donors:donor_id(organization_name, business_name, address), donation_items(name, category, quantity, unit, expiry)`)
        .eq('id', id).single();
      if (cancelled) return;
      if (!error && data) setDonation(data);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleClaim = async () => {
    if (!user || !donation) return;
    setClaiming(true);
    const { error } = await supabase.from('donation_batches').update({ status: 'claimed', claimed_by: user.id }).eq('id', id);
    setClaiming(false);
    if (error) {
      Alert.alert('Error', 'Failed to claim. It may have already been claimed.');
    } else {
      Alert.alert('Claimed!', 'You have successfully claimed this donation.', [{ text: 'OK', onPress: () => router.replace('/ngo/claims') }]);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Inter_400Regular', color: C.muted }}>Loading…</Text>
      </View>
    );
  }

  if (!donation) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.primary }}>Donation not found.</Text>
        <Button onPress={() => router.back()} variant="outline" style={{ borderRadius: 50 }}>Go Back</Button>
      </View>
    );
  }

  const donor: any = Array.isArray(donation.donors) ? donation.donors[0] : donation.donors;
  const donorName = donor?.business_name || donor?.organization_name || 'Anonymous';
  const items: any[] = donation.donation_items ?? [];
  const isUnclaimed = donation.status.toLowerCase() === 'unclaimed';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.card, paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={C.primary} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.primary, letterSpacing: -0.2 }}>Donation Details</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Hero card */}
        <View style={{ backgroundColor: C.primary, borderRadius: 20, padding: 22, marginBottom: 16, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -30, bottom: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' }} pointerEvents="none" />
          <View style={{ backgroundColor: isUnclaimed ? C.warningBg : 'rgba(247,246,245,0.1)', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 50, marginBottom: 14 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: isUnclaimed ? C.warning : 'rgba(247,246,245,0.7)' }}>
              {donation.status}
            </Text>
          </View>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: '#f7f6f5', letterSpacing: -0.5, textTransform: 'capitalize' }}>{donation.batch_type}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(247,246,245,0.6)', marginTop: 4 }}>From {donorName}</Text>
        </View>

        {/* Logistics card */}
        <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 20, gap: 16, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, marginBottom: 16 }}>
          {donor?.address && <InfoRow icon={MapPin} label="Pickup Location" value={donor.address} />}
          <InfoRow
            icon={CalendarClock}
            label="Collection Deadline"
            value={donation.collection_datetime ? new Date(donation.collection_datetime).toLocaleString('en-ZA', { dateStyle: 'long', timeStyle: 'short' }) : 'Not specified'}
          />
        </View>

        {/* Items card */}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.primary, marginBottom: 12 }}>
          Items Included ({items.length})
        </Text>
        <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, overflow: 'hidden', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}>
          {items.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: idx !== items.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Tag size={14} color={C.muted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.primary }}>{item.name}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted, marginTop: 1 }}>{item.category}</Text>
              </View>
              <View style={{ backgroundColor: C.mutedBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: C.primary }}>{item.quantity} {item.unit}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: C.card, padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: C.border }}>
        {isUnclaimed ? (
          <Button onPress={handleClaim} isLoading={claiming} size="lg" style={{ borderRadius: 50, width: '100%' }}>
            {!claiming ? 'Claim This Donation' : ''}
          </Button>
        ) : (
          <View style={{ backgroundColor: C.mutedBg, borderRadius: 14, padding: 14, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.muted }}>
              This donation has already been {donation.status}.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
