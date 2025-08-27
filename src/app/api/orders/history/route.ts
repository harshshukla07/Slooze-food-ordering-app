
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient, Role, OrderStatus, Country } from '@prisma/client'; // Import Country
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Helper function for validation
function isValidCountry(value: string): value is Country {
  return Object.values(Country).includes(value as Country);
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    const userCountry = request.headers.get('x-user-country');

    if (!userId || !userRole || !userCountry) {
      return NextResponse.json({ message: 'User information not found' }, { status: 401 });
    }

    const whereClause: Prisma.OrderWhereInput = {
      userId: userId,
      status: {
        not: OrderStatus.PENDING,
      },
    };

    // For non-admins, validate the country and add the restriction
    if (userRole !== Role.ADMIN) {
      if (isValidCountry(userCountry)) {
        whereClause.restaurant = {
          country: userCountry, // Use the validated country
        };
      } else {
        // If the country is invalid for any reason, return an empty array
        return NextResponse.json([], { status: 200 });
      }
    }

    const orderHistory = await prisma.order.findMany({
      where: whereClause,
      include: {
        restaurant: true,
        items: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orderHistory, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}