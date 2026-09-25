import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9f8', padding: 24 }}>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 72, color: '#eeeceb', letterSpacing: -2 }}>404</Text>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1e1e1e', marginTop: 8, letterSpacing: -0.3 }}>
          Page not found
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#7a7872', marginTop: 6, textAlign: 'center' }}>
          This screen doesn&apos;t exist or has been moved.
        </Text>
        <Link href="/(tabs)" style={{ marginTop: 28 }}>
          <Text
            style={{
              fontFamily: 'Inter_600SemiBold',
              fontSize: 15,
              color: '#f7f6f5',
              backgroundColor: '#1e1e1e',
              paddingHorizontal: 28,
              paddingVertical: 13,
              borderRadius: 50,
              overflow: 'hidden',
            }}
          >
            Go to Dashboard
          </Text>
        </Link>
      </View>
    </>
  );
}
