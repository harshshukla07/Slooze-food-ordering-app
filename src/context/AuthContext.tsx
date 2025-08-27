'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

// Define the shape of the decoded user data from the JWT
interface User {
  userId: string;
  name: string;
  role: string;
  country: string;
}

// Define the shape of the cart data
type OrderItem = { id: string; quantity: number; menuItemId: string; };
type Order = { id: string; items: OrderItem[]; restaurantId: string; };

interface AuthContextType {
  user: User | null;
  token: string | null;
  cart: Order[];
  fetchCart: () => void;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<Order[]>([]);

  const fetchCart = useCallback(async (authToken?: string) => {
    const currentToken = authToken || token;
    if (!currentToken) {
        setCart([]);
        return;
    };
    try {
        const res = await fetch('/api/orders', { headers: { 'Authorization': `Bearer ${currentToken}` } });
        if (res.ok) {
            const data = await res.json();
            setCart(data);
        } else {
            setCart([]);
        }
    } catch (error) {
        console.error("Failed to fetch cart:", error);
        setCart([]);
    }
  }, [token]);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      const decodedUser = jwtDecode<User>(storedToken);
      setUser(decodedUser);
      setToken(storedToken);
      fetchCart(storedToken);
    }
  }, [fetchCart]); // FIX: Added fetchCart to dependency array

  const login = (newToken: string) => {
    localStorage.setItem('authToken', newToken);
    const decodedUser = jwtDecode<User>(newToken);
    setToken(newToken);
    setUser(decodedUser);
    fetchCart(newToken);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setCart([]);
  };

  return (
    <AuthContext.Provider value={{ user, token, cart, fetchCart, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};