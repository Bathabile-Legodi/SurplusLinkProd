import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { Button } from '@/components/ui/button';
import { router } from 'expo-router';
import { useDonate } from './DonateContext';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Package, Tag } from 'lucide-react-native';

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

export default function ReviewScreen() {
  const { items, clearItems } = useDonate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const batchType = (() => {
    const cats = Array.from(new Set(items.flatMap(item => item.category ? item.category.split(', ').map(c => c.trim()) : []))).filter(Boolean);
    if (cats.length === 0) return 'Donation';
    if (cats.length === 1) return cats[0];
    return 'Mixed Donation';
  })();

  const totalKg = items.reduce((sum, i) => sum + (parseFloat(i.quantity) || 0), 0);

  const submitDonation = async () => {
    if (items.length === 0 || !user) return;
    setLoading(true);
    try {
      const { data: batchRow, error: batchError } = await supabase
        .from('donation_batches')
        .insert({ donor_id: user.id, batch_type: batchType, status: 'unclaimed', submitted_at: new Date().toISOString() })
        .select().single();
      if (batchError || !batchRow) throw new Error('Failed to create donation batch.');

      const { error: itemsError } = await supabase.from('donation_items').insert(
        items.map(item => ({ batch_id: batchRow.id, name: item.name, category: item.category, quantity: Number(item.quantity) || 0, unit: item.unit }))
      );
      if (itemsError) throw new Error('Failed to save donation items.');

      clearItems();
      router.replace('/donate/success');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.card, paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={C.primary} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.primary, letterSpacing: -0.2 }}>Review Batch</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 22 }}>
          Confirm the details below before submitting. NGOs in your area will be notified immediately.
        </Text>

        {/* Batch summary card */}
        <View style={{ backgroundColor: C.primary, borderRadius: 18, padding: 20, marginBottom: 16, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} pointerEvents="none" />
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(247,246,245,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} color="#f7f6f5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(247,246,245,0.55)', marginBottom: 4 }}>Batch Type</Text>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22, color: '#f7f6f5', letterSpacing: -0.3 }}>{batchType}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: 'rgba(247,246,245,0.6)', marginTop: 4 }}>
                {items.length} item{items.length !== 1 ? 's' : ''} · ~{totalKg.toFixed(1)} kg total
              </Text>
            </View>
          </View>
        </View>

        {/* Items card */}
        <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 20, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.primary, marginBottom: 16 }}>
            Items ({items.length})
          </Text>
          <View style={{ gap: 12 }}>
            {items.map(item => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Tag size={14} color={C.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.primary }}>{item.name}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted, marginTop: 1 }}>{item.category}</Text>
                </View>
                <View style={{ backgroundColor: C.successBg, borderWidth: 1, borderColor: C.successBorder, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: C.success }}>{item.quantity} {item.unit}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: C.card, padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: C.border }}>
        <Button disabled={items.length === 0 || loading} onPress={submitDonation} isLoading={loading} size="lg" style={{ borderRadius: 50, width: '100%' }}>
          {!loading ? 'Submit Donation' : ''}
        </Button>
      </View>
    </View>
  );
}
