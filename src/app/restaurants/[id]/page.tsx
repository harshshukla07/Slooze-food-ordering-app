'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getCurrencySymbol } from '@/utils/currency';

// Define our data types
type MenuItem = {
  id: string;
  name: string;
  price: number;
};

type RestaurantDetails = {
  id: string;
  name: string;
  country: string;
  menuItems: MenuItem[];
};

export default function RestaurantPage() {
  const { token, cart, fetchCart } = useAuth();
  const params = useParams();
  const restaurantId = params.id as string;

  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && restaurantId) {
      const fetchRestaurantDetails = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/restaurants/${restaurantId}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) throw new Error('Failed to fetch restaurant details');
          setRestaurant(await response.json());
        } catch (err) {
          if (err instanceof Error) setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchRestaurantDetails();
    }
  }, [restaurantId, token]);
  
  const cartItemMap = useMemo(() => {
    const itemMap = new Map<string, { quantity: number; cartItemId: string; orderId: string }>();
    const relevantOrder = cart.find(order => order.restaurantId === restaurantId);
    if (relevantOrder) {
        relevantOrder.items.forEach(item => {
            itemMap.set(item.menuItemId, { quantity: item.quantity, cartItemId: item.id, orderId: relevantOrder.id });
        });
    }
    return itemMap;
  }, [cart, restaurantId]);

  const handleCartUpdate = async (menuItemId: string, cartItemId?: string, newQuantity?: number) => {
    const apiAction = async () => {
      // If the item is already in the cart, we update or delete it
      if (cartItemId && newQuantity !== undefined) {
        if (newQuantity < 1) {
          return fetch(`/api/orders/items/${cartItemId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        } else {
          return fetch(`/api/orders/items/${cartItemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ quantity: newQuantity }),
          });
        }
      } else {
        // If it's a new item, we add it
        return fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ menuItemId, quantity: 1 }),
        });
      }
    };

    try {
      const res = await apiAction();
      if (!res.ok) throw new Error('Cart update failed');
      // After a successful API call, refresh the global cart state for consistency
      fetchCart();
    } catch (err) {
      if (err instanceof Error) alert(`Error: ${err.message}`);
      // In a real app, you might want to revert the optimistic update here
    }
  };

  if (isLoading) return <p className="text-center text-gray-800">Loading...</p>;
  if (error) return <p className="text-center text-red-500">Error: {error}</p>;
  if (!restaurant) return <p className="text-center text-gray-800">Restaurant not found.</p>;

  const currencySymbol = getCurrencySymbol(restaurant.country);

  return (
    <div>
      <h1 className="text-4xl font-extrabold mb-1 text-gray-900">{restaurant.name}</h1>
      <p className="text-lg text-gray-500 mb-8 capitalize">{restaurant.country.toLowerCase()}</p>
      <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-900">Menu</h2>
      <div className="divide-y divide-gray-200">
        {restaurant.menuItems.map((item) => {
          const cartItem = cartItemMap.get(item.id);
          
          return (
            <div key={item.id} className="flex justify-between items-center py-4">
              <div>
                <p className="font-semibold text-lg text-gray-800">{item.name}</p>
                <p className="text-gray-600">{currencySymbol}{Number(item.price).toFixed(2)}</p>
              </div>
              <div>
                {cartItem ? (
                  <div className="flex items-center space-x-2 text-gray-800">
                    <button onClick={() => handleCartUpdate(item.id, cartItem.cartItemId, cartItem.quantity - 1)} className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100">-</button>
                    <span>{cartItem.quantity}</span>
                    <button onClick={() => handleCartUpdate(item.id, cartItem.cartItemId, cartItem.quantity + 1)} className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100">+</button>
                  </div>
                ) : (
                  <button onClick={() => handleCartUpdate(item.id)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none">
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}