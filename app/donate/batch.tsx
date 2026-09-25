import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { router } from 'expo-router';
import { useDonate } from './DonateContext';
import { ChevronLeft, Plus, X, Package } from 'lucide-react-native';

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#faf9f8',
  card: '#ffffff',
  border: '#dddbd8',
  primary: '#1e1e1e',
  muted: '#7a7872',
  mutedBg: '#eeeceb',
  destructive: '#c94a2a',
  destructiveBg: '#fdf0ec',
};

const CATEGORIES = [
  'Produce', 'Bakery', 'Dairy', 'Prepared Meals',
  'Canned Goods', 'Meat', 'Beverages', 'Snacks',
];

function FieldLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

export default function BatchScreen() {
  const { items, addItem, removeItem } = useDonate();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const canAdd = name.trim().length > 0 && selectedCategories.length > 0 && quantity.trim().length > 0;

  const handleAddItem = () => {
    if (!canAdd) return;
    addItem({ id: Date.now().toString(), name: name.trim(), category: selectedCategories.join(', '), quantity: quantity.trim(), unit: 'Kg' });
    setName(''); setQuantity(''); setSelectedCategories([]);
  };

  const toggleCategory = (cat: string) =>
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ backgroundColor: C.card, paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.mutedBg, alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={20} color={C.primary} />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.primary, letterSpacing: -0.2 }}>Add Items</Text>
        {items.length > 0 && (
          <View style={{ marginLeft: 'auto', backgroundColor: C.primary, borderRadius: 50, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#f7f6f5' }}>{items.length}</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 22 }}>
          Add individual items to your batch before submitting for NGO collection.
        </Text>

        {/* Add item form */}
        <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 20, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2, marginBottom: 16, gap: 18 }}>
          <View>
            <FieldLabel>Food Type</FieldLabel>
            <Input placeholder="e.g. Fresh Apples" value={name} onChangeText={setName} />
          </View>

          <View>
            <FieldLabel>Category</FieldLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, borderWidth: 1, borderColor: isSelected ? C.primary : C.border, backgroundColor: isSelected ? C.primary : C.card }}
                  >
                    <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: isSelected ? '#f7f6f5' : C.muted }}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View>
            <FieldLabel>Quantity (kg)</FieldLabel>
            <Input placeholder="e.g. 10" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>

          <Button
            variant={canAdd ? 'default' : 'outline'}
            onPress={handleAddItem}
            disabled={!canAdd}
            style={{ borderRadius: 50 }}
          >
            <Plus size={16} color={canAdd ? '#f7f6f5' : C.muted} style={{ marginRight: 6 }} />
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: canAdd ? '#f7f6f5' : C.muted }}>
              Add to Batch
            </Text>
          </Button>
        </View>

        {/* Items list */}
        <View style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 20, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.primary, marginBottom: 16 }}>
            Batch Items ({items.length})
          </Text>

          {items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
              <Package size={24} color={C.muted} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.muted }}>No items added yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {items.map(item => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.primary }}>{item.name}</Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.muted, marginTop: 2 }}>{item.category}</Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: C.primary, marginRight: 14 }}>
                    {item.quantity} {item.unit}
                  </Text>
                  <Pressable
                    onPress={() => removeItem(item.id)}
                    style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: C.destructiveBg, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} color={C.destructive} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: C.card, padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: C.border }}>
        <Button disabled={items.length === 0} onPress={() => router.push('/donate/review')} size="lg" style={{ borderRadius: 50, width: '100%' }}>
          Review Batch ({items.length})
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
