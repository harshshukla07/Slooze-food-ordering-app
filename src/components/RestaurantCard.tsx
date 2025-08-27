
import Link from 'next/link';

type RestaurantProps = {
  restaurant: {
    id: string;
    name: string;
    country: string;
  };
};

export default function RestaurantCard({ restaurant }: RestaurantProps) {
  return (
    
    <Link href={`/restaurants/${restaurant.id}`} className="block">
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 h-full">
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{restaurant.name}</h5>
        <p className="font-normal text-gray-800">{restaurant.country}</p>
      </div>
    </Link>
  );
}