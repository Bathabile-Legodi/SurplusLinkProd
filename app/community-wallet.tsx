import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft, HeartHandshake, Truck, Banknote, Users, ArrowRight } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';

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

const PRESET_AMOUNTS = [50, 100, 250, 500];

const PERKS = [
  { icon: Truck, title: 'Fuel collection runs', desc: 'Cover transport so NGOs can reach donors across the city.' },
  { icon: Banknote, title: 'Sustain the platform', desc: 'Keep SurplusLink free for every NGO and donor.' },
  { icon: Users, title: 'Grow the network', desc: 'Fund outreach to onboard more donors and vetted NGOs.' },
];

export default function CommunityWalletScreen() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const finalAmount = selected ?? parseFloat(amount);
  const isValid = finalAmount > 0 && !isNaN(finalAmount);

  const handleContribute = async () => {
    if (!isValid || !user) return;
    setLoading(true);
    const { error } = await supabase.from('community_wallet_contributions').insert({
      user_id: user.id,
      amount: finalAmount,
      currency: 'ZAR',
      created_at: new Date().toISOString(),
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error', 'Could not process your contribution. Please try again.');
    } else {
      Alert.alert('Thank you!', `Your contribution of R${finalAmount} has been received.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.card, paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={C.primary} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.primary, letterSpacing: -0.2 }}>Community Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 20 }} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={{ backgroundColor: C.primary, borderRadius: 20, padding: 22, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.05)' }} pointerEvents="none" />
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(247,246,245,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <HeartHandshake size={26} color="#f7f6f5" />
          </View>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, color: '#f7f6f5', letterSpacing: -0.5, marginBottom: 8 }}>
            Can&apos;t donate food?{'\n'}Donate to the cause.
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: 'rgba(247,246,245,0.6)', lineHeight: 22 }}>
            Every food rescue involves real costs — fuel, storage, coordination. Your contribution keeps the logistics running so no edible meal goes to waste.
          </Text>
        </View>

        {/* Perks */}
        <View style={{ gap: 12 }}>
          {PERKS.map(p => (
            <View
              key={p.title}
              style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <p.icon size={18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: C.primary, marginBottom: 3 }}>{p.title}</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.muted, lineHeight: 20 }}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Amount picker */}
        <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 20, gap: 16 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.primary }}>Choose an Amount (ZAR)</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {PRESET_AMOUNTS.map(amt => (
              <Pressable
                key={amt}
                onPress={() => { setSelected(amt); setAmount(''); }}
                style={{
                  flex: 1,
                  minWidth: '45%',
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: selected === amt ? C.primary : C.mutedBg,
                  borderWidth: 1,
                  borderColor: selected === amt ? C.primary : C.border,
                }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: selected === amt ? '#f7f6f5' : C.primary }}>
                  R{amt}
                </Text>
              </Pressable>
            ))}
          </View>

          <View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
              Or enter custom amount
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 12, overflow: 'hidden' }}>
              <View style={{ paddingHorizontal: 14, paddingVertical: 13, backgroundColor: C.mutedBg }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.primary }}>R</Text>
              </View>
              <TextInput
                value={amount}
                onChangeText={v => { setAmount(v); setSelected(null); }}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor={C.muted}
                style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 13, fontFamily: 'Inter_400Regular', fontSize: 16, color: C.primary }}
              />
            </View>
          </View>

          <Pressable
            onPress={handleContribute}
            disabled={!isValid || loading}
            style={({ pressed }) => ({
              backgroundColor: isValid ? C.primary : C.mutedBg,
              borderRadius: 50,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed || loading ? 0.7 : 1,
            })}
          >
            <HeartHandshake size={18} color={isValid ? '#f7f6f5' : C.muted} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: isValid ? '#f7f6f5' : C.muted }}>
              {loading ? 'Processing…' : `Contribute${isValid ? ` R${finalAmount}` : ''}`}
            </Text>
            {isValid && !loading && <ArrowRight size={16} color="#f7f6f5" />}
          </Pressable>

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted, textAlign: 'center' }}>
            Secure · All contributions go directly to logistics costs
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
