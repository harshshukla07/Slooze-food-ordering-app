'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCurrencySymbol } from '@/utils/currency';

// Define types to match the data from our new API endpoint
type MenuItem = { id: string; name: string; price: number };
type OrderItem = { id: string; quantity: number; menuItem: MenuItem };
type Restaurant = { id: string; name: string; country: string };
type Order = {
  id: string;
  totalPrice: number;
  status: string;
  restaurant: Restaurant;
  items: OrderItem[];
  createdAt: string;
};

export default function OrderHistoryPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/orders/history', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch order history');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to cancel order');
      }
      alert('Order cancelled successfully!');
      fetchHistory(); // Refresh the history to show the updated status
    } catch (err) {
      if (err instanceof Error) alert(`Error: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLACED': return 'text-blue-600 bg-blue-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) return <p className="text-gray-800">Loading order history...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!user) return <p className="text-gray-800">Please log in to view your orders.</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 border-b pb-3 text-gray-900">Your Order History</h1>
      {orders.length === 0 ? (
        <p className="text-gray-700">You have no past orders.</p>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const currencySymbol = getCurrencySymbol(order.restaurant.country);
            return (
              <div key={order.id} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{order.restaurant.name}</h2>
                    <p className="text-sm text-gray-500">
                      Ordered on: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <ul className="divide-y divide-gray-200 p-6">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-3 flex justify-between">
                      <span className="text-gray-700">{item.menuItem.name} (x{item.quantity})</span>
                      <span className="font-medium text-gray-900">{currencySymbol}{(Number(item.menuItem.price) * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 p-6 bg-gray-50 rounded-b-lg flex justify-between items-center">
                  <p className="font-bold text-lg text-gray-900">Total: {currencySymbol}{Number(order.totalPrice).toFixed(2)}</p>
                  {/* --- PERMISSION CHECK --- */}
                  {/* Only show Cancel button for Admins/Managers on PLACED orders */}
                  {user.role !== 'MEMBER' && order.status === 'PLACED' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg shadow-sm hover:bg-red-700"
                    >
                      Cancel Order
                    </button>
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