
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!paymentMethod) {
      setMessage('Payment method cannot be empty.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/users/payment', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update payment method');
      }
      
      setMessage('Payment method updated successfully!');
      setPaymentMethod(''); // Clear the input field on success
    } catch (err) {
      if (err instanceof Error) {
        setMessage(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <p className="text-gray-800">Please log in to view your profile.</p>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 border-b pb-3 text-gray-900">Your Profile</h1>
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-md">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-lg text-gray-900">{user.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Email</p>
            <p className="text-lg text-gray-900">{user.userId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Role</p>
            <p className="text-lg text-gray-900 capitalize">{user.role.toLowerCase()}</p>
          </div>
          
          {/* --- ADMIN ONLY SECTION --- */}
          {user.role === 'ADMIN' && (
            <form onSubmit={handleUpdatePaymentMethod} className="pt-4 border-t">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">Update Payment Method</h2>
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                  New Payment Method
                </label>
                <input
                  id="paymentMethod"
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., S.H.I.E.L.D. Credit Card"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full px-4 py-2 text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {isLoading ? 'Updating...' : 'Update'}
              </button>
              {message && <p className="mt-3 text-sm text-center">{message}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}