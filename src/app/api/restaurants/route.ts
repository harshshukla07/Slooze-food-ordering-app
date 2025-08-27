
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Make sure to import the Country and Role enums
import { PrismaClient, Role, Country } from '@prisma/client';

const prisma = new PrismaClient();

// A helper function to check if a string is a valid Country enum value
function isValidCountry(value: string): value is Country {
  return Object.values(Country).includes(value as Country);
}

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userCountry = request.headers.get('x-user-country');

    if (!userRole || !userCountry) {
      return NextResponse.json(
        { message: 'User information not found in request' },
        { status: 400 }
      );
    }

    let restaurants;

    if (userRole === Role.ADMIN) {
      // Admins can see all restaurants
      restaurants = await prisma.restaurant.findMany();
    } else {
      // For non-admins, validate the country from the header
      if (!isValidCountry(userCountry)) {
        // If the country is invalid for any reason, return an error
        return NextResponse.json({ message: 'Invalid country in token' }, { status: 400 });
      }

      // Now that we've validated it, we can safely use it in the query
      restaurants = await prisma.restaurant.findMany({
        where: {
          country: userCountry,
        },
      });
    }

    return NextResponse.json(restaurants, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}