import { Stack } from "expo-router";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";

export default function RootLayout() {
  return (
    <WishlistProvider>
      {/* Provider must be outside the Stack to share data across all nested routes */}
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="customer/(tabs)" />
          <Stack.Screen name="customer/checkout" />
          <Stack.Screen name="product/[id]" />
        </Stack>
      </CartProvider>
    </WishlistProvider>
  );
}