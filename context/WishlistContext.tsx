import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type WishlistItem = {
  _id: string;
  name: string;
  price: number;
  unit?: string;
  image?: string;
  category?: string;
  rating?: number;
};

type WishlistContextType = {
  wishlist: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  isWishlisted: (id: string) => boolean;
  clearWishlist: () => void;
};

const WishlistContext = createContext<WishlistContextType | null>(null);
const WISHLIST_STORAGE_KEY = "@kisanx_wishlist";

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const loadWishlist = async () => {
      const stored = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      if (stored) setWishlist(JSON.parse(stored));
    };
    loadWishlist();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (item: WishlistItem) => {
    setWishlist((prev) => {
      const exists = prev.find((p) => p._id === item._id);
      if (exists) return prev.filter((p) => p._id !== item._id);
      return [item, ...prev];
    });
  };

  const isWishlisted = (id: string) => wishlist.some((item) => item._id === id);
  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
};