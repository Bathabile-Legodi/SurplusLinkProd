import { Stack } from 'expo-router';
import { DonateProvider } from './DonateContext';

export default function DonateLayout() {
  return (
    <DonateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="consent" />
        <Stack.Screen name="batch" />
        <Stack.Screen name="review" />
        <Stack.Screen name="success" />
      </Stack>
    </DonateProvider>
  );
}
