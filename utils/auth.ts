import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "kisanx_token";

export type DecodedUser = {
  id: string;
  firstName: string;
  lastName: string;
  role: "farmer" | "customer"; // Role strict define kiya
};

export const saveToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async () => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const getLoggedInUser = async (): Promise<DecodedUser | null> => {
  try {
    const token = await getToken();
    if (!token) return null;
    return jwtDecode<DecodedUser>(token);
  } catch (error) {
    return null;
  }
};