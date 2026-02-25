import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type CartItem = {
  _id: string;
  name: string;
  category?: string; // ✨ Added this to fix the TypeScript error
  price: number;
  quantity: number;
  image?: string;
  unit?: string;
  pricePerUnit?: number; 
  finalPrice?: number;   
  selectedWeight?: string;
};

type CartContextType = {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const loadCart = async () => {
      const stored = await AsyncStorage.getItem("@kisanx_cart");
      if (stored) setCart(JSON.parse(stored));
    };
    loadCart();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("@kisanx_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id && i.selectedWeight === item.selectedWeight);
      if (existing) {
        return prev.map((i) =>
          (i._id === item._id && i.selectedWeight === item.selectedWeight) ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, item];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return removeFromCart(id);
    setCart((prev) =>
      prev.map((item) => (item._id === id ? { ...item, quantity: qty } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    AsyncStorage.removeItem("@kisanx_cart");
  };

  return (
    <CartContext.Provider value={{ cart, setCart, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};