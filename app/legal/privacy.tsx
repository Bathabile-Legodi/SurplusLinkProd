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

export default function PrivacyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ backgroundColor: C.card, paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={C.primary} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.primary }}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26, color: C.primary, letterSpacing: -0.5, marginBottom: 6 }}>Privacy Policy</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.muted, marginBottom: 28 }}>Last updated: September 2026</Text>

        <Section title="1. Information We Collect">
          We collect information you provide directly to us, such as when you create an account, submit a donation, or contact support. This includes name, email address, phone number, and location data used for matching donations to nearby NGOs.
        </Section>
        <Section title="2. How We Use Your Information">
          We use your information to facilitate the donation matching process, send notifications about available or claimed donations, verify NGO accounts, and improve our platform services.
        </Section>
        <Section title="3. Data Sharing">
          We share your information only with verified NGO partners for the purposes of coordinating food collection. We do not sell your personal data to third parties.
        </Section>
        <Section title="4. Data Security">
          We implement industry-standard security measures including encryption in transit and at rest, access controls, and regular security audits to protect your personal information.
        </Section>
        <Section title="5. Your Rights">
          You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@surpluslink.org.
        </Section>
        <Section title="6. Contact">
          For privacy-related questions, please contact our Data Protection Officer at privacy@surpluslink.org or write to SurplusLink, Cape Town, South Africa.
        </Section>
      </ScrollView>
    </View>
  );
}
