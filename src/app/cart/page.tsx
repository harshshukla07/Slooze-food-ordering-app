'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getCurrencySymbol } from '@/utils/currency';

// Define types to match the complex data from our new API endpoint
type MenuItem = { id: string; name: string; price: number };
type OrderItem = { id: string; quantity: number; menuItem: MenuItem };
type Restaurant = { id: string; name: string; country: string };
type Order = {
  id: string;
  totalPrice: number;
  status: string;
  restaurant: Restaurant;
  items: OrderItem[];
};

export default function CartPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!token) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        const res = await fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error('Failed to fetch cart');
        const data = await res.json();
        setOrders(data);
    } catch (err) {
        if (err instanceof Error) setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleQuantityChange = async (orderId: string, itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
        handleRemoveItem(orderId, itemId);
        return;
    }

    const originalOrders = [...orders];
    setOrders(prevOrders =>
        prevOrders.map(order => {
            if (order.id !== orderId) return order;
            
            let newTotalPrice = 0;
            const newItems = order.items.map(item => {
                let currentItemPrice = Number(item.menuItem.price) * item.quantity;
                if (item.id === itemId) {
                    currentItemPrice = Number(item.menuItem.price) * newQuantity;
                }
                newTotalPrice += currentItemPrice;
                
                return item.id === itemId ? { ...item, quantity: newQuantity } : item;
            });

            return { ...order, items: newItems, totalPrice: newTotalPrice };
        })
    );

    try {
      const res = await fetch(`/api/orders/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (!res.ok) throw new Error('Failed to update quantity');
    } catch (err) {
      alert('Error: Failed to update quantity. Reverting changes.');
      setOrders(originalOrders);
      if (err instanceof Error) console.error(err.message);
    }
  };

  const handleRemoveItem = async (orderId: string, itemId: string) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    const originalOrders = [...orders];
    
    // Optimistically remove the item from the state
    setOrders(prevOrders =>
        prevOrders
            .map(order => 
                order.id === orderId 
                    ? { ...order, items: order.items.filter(item => item.id !== itemId) } 
                    : order
            )
            .filter(order => order.items.length > 0) // Remove order if it becomes empty
    );

    try {
      const res = await fetch(`/api/orders/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to remove item');
      
      // Re-fetch to ensure consistency after a successful deletion
      fetchCart();
    } catch (err) {
      alert('Error: Failed to remove item. Reverting changes.');
      setOrders(originalOrders);
      if (err instanceof Error) console.error(err.message);
    }
  };

  const handleCheckout = async (orderId: string) => {
    if (!confirm('Are you sure you want to place this order?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/checkout`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to place order');
      }
      alert('Order placed successfully!');
      router.push('/');
    } catch (err) {
      if (err instanceof Error) alert(`Error: ${err.message}`);
    }
  };

  if (isLoading) return <p className="text-gray-800">Loading cart...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!user) return <p className="text-gray-800">Please log in to view your cart.</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 border-b pb-3 text-gray-900">Your Carts</h1>
      {orders.length === 0 ? (
        <p className="text-gray-700">You have no pending orders.</p>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const currencySymbol = getCurrencySymbol(order.restaurant.country);
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b"><h2 className="text-xl font-bold text-gray-800">{order.restaurant.name}</h2></div>
                <ul className="divide-y divide-gray-200 p-6">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-3 flex justify-between items-center">
                      <div>
                        <p className="text-gray-700">{item.menuItem.name}</p>
                        <p className="text-sm text-gray-500">{currencySymbol}{Number(item.menuItem.price).toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-gray-800">
                          <button onClick={() => handleQuantityChange(order.id, item.id, item.quantity - 1)} className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100">-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(order.id, item.id, item.quantity + 1)} className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100">+</button>
                        </div>
                        <button onClick={() => handleRemoveItem(order.id, item.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-6 bg-gray-50 rounded-b-lg flex justify-between items-center">
                  <p className="font-bold text-lg text-gray-900">Total: {currencySymbol}{Number(order.totalPrice).toFixed(2)}</p>
                  {user.role !== 'MEMBER' && (
                    <button onClick={() => handleCheckout(order.id)} className="px-6 py-2 text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700">Place Order</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}