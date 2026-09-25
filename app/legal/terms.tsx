import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

const C = {
  bg: '#faf9f8', card: '#ffffff', border: '#dddbd8',
  primary: '#1e1e1e', muted: '#7a7872', mutedBg: '#eeeceb',
};

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: C.primary, marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, lineHeight: 24 }}>{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ backgroundColor: C.card, paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={C.primary} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.primary }}>Terms of Service</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: C.primary, letterSpacing: -0.5, marginBottom: 6 }}>Terms of Service</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.muted, marginBottom: 28 }}>Last updated: September 2026</Text>

        <Section title="1. Acceptance of Terms">
          By accessing or using SurplusLink, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform.
        </Section>
        <Section title="2. Eligibility">
          Donors must be a registered business or individual with surplus food to donate. NGOs must be a registered non-profit organisation operating legally within South Africa.
        </Section>
        <Section title="3. Donor Responsibilities">
          Donors confirm that all donated food is safe for human consumption, accurately described, and handled in accordance with applicable food safety laws. Donors are responsible for accurate pickup information.
        </Section>
        <Section title="4. NGO Responsibilities">
          NGOs agree to collect claimed donations within the stated timeframe, handle food safely, and report collection outcomes through the platform. Failure to collect may result in suspension.
        </Section>
        <Section title="5. Platform Conduct">
          Users must not misuse the platform, submit false information, or act in bad faith. SurplusLink reserves the right to suspend or terminate accounts that violate these terms.
        </Section>
        <Section title="6. Limitation of Liability">
          SurplusLink acts as an intermediary and is not liable for the quality, safety, or fitness of donated food, or for any losses arising from failed collections or donations.
        </Section>
        <Section title="7. Changes to Terms">
          We may update these terms at any time. Continued use of the platform after changes constitutes acceptance. Contact legal@surpluslink.org with questions.
        </Section>
      </ScrollView>
    </View>
  );
}
