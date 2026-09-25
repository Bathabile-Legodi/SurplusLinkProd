import React, { createContext, useContext, useState } from 'react';

export type DonationItem = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  expiry?: string;
};

type DonateContextType = {
  items: DonationItem[];
  addItem: (item: DonationItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
};

const DonateContext = createContext<DonateContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearItems: () => {},
});

export function DonateProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<DonationItem[]>([]);

  const addItem = (item: DonationItem) => setItems(prev => [...prev, item]);
  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const clearItems = () => setItems([]);

  return (
    <DonateContext.Provider value={{ items, addItem, removeItem, clearItems }}>
      {children}
    </DonateContext.Provider>
  );
}

export const useDonate = () => useContext(DonateContext);
