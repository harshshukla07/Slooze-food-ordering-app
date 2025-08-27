'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import RestaurantCard from '@/components/RestaurantCard';

// Define a type for the restaurant data we expect from the API
type Restaurant = {
  id: string;
  name: string;
  country: string;
};

export default function HomePage() {
  const { user, token } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      const fetchRestaurants = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/restaurants', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch restaurants');
          }
          const data = await response.json();
          setRestaurants(data);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('An unexpected error occurred');
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchRestaurants();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  if (!user) {
    return <div className="text-center"><p className="text-gray-800">Please log in to view restaurants.</p></div>;
  }
  
  if (isLoading) {
    return <div className="text-center"><p className="text-gray-800">Loading restaurants...</p></div>;
  }

  if (error) {
    return <div className="text-center text-red-500"><p>Error: {error}</p></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Restaurants</h1>
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <p className="text-gray-700">No restaurants found for your region.</p>
      )}
    </div>
  );
}