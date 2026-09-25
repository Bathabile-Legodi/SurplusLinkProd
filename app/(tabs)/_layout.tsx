import { Tabs, Redirect } from 'expo-router';
import { Platform } from 'react-native';
import {
  LayoutDashboard,
  User,
  History,
  TrendingUp,
  Search,
  Bookmark,
} from 'lucide-react-native';
import { useAuth } from '@/components/AuthProvider';

// ─── Design tokens ─────────────────────────────────────────────────────────

const C = {
  primary: '#1e1e1e',
  bg: '#faf9f8',
  border: '#dddbd8',
  muted: '#b0aea8',
};

// ─── Layout ────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { session, user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  const role = user?.user_metadata?.role as string;
  const isDonor = role === 'donor';
  const isNGO = role === 'ngo';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 10,
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: C.bg,
          borderBottomColor: C.border,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: C.primary,
        headerTitleStyle: {
          fontFamily: 'Inter_700Bold',
          fontSize: 17,
          color: C.primary,
        },
        headerShadowVisible: false,
      }}
    >
      {/* ── Dashboard (both roles) ── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size ?? 22} color={color} />,
        }}
      />

      {/* ── Donor: History tab ── */}
      <Tabs.Screen
        name="donor/history"
        options={{
          title: 'History',
          href: isDonor ? '/donor/history' : null,
          tabBarIcon: ({ color, size }) => <History size={size ?? 22} color={color} />,
        }}
      />

      {/* ── Donor: Impact tab ── */}
      <Tabs.Screen
        name="donor/impact"
        options={{
          title: 'Impact',
          href: isDonor ? '/donor/impact' : null,
          tabBarIcon: ({ color, size }) => <TrendingUp size={size ?? 22} color={color} />,
        }}
      />

      {/* ── NGO: Explore tab ── */}
      <Tabs.Screen
        name="ngo/explore"
        options={{
          title: 'Explore',
          href: isNGO ? '/ngo/explore' : null,
          tabBarIcon: ({ color, size }) => <Search size={size ?? 22} color={color} />,
        }}
      />

      {/* ── NGO: Claims tab ── */}
      <Tabs.Screen
        name="ngo/claims"
        options={{
          title: 'My Claims',
          href: isNGO ? '/ngo/claims' : null,
          tabBarIcon: ({ color, size }) => <Bookmark size={size ?? 22} color={color} />,
        }}
      />

      {/* ── Profile (both roles) ── */}
      <Tabs.Screen
        name="two"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size ?? 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
