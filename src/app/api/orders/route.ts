
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient, Role, Country, OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

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

    // 2. Define a specific type for our where clause
    const whereClause: Prisma.OrderWhereInput = {
      userId: userId,
      status: OrderStatus.PENDING,
    };

    if (userRole !== Role.ADMIN) {
      if (isValidCountry(userCountry)) {
        whereClause.restaurant = {
          country: userCountry,
        };
      } else {
        return NextResponse.json([], { status: 200 });
      }
    }

    const pendingOrders = await prisma.order.findMany({
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

    return NextResponse.json(pendingOrders, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const { menuItemId, quantity } = await request.json();
    if (!menuItemId || quantity == null || quantity <= 0) {
      return NextResponse.json({ message: 'MenuItemId and a valid quantity are required' }, { status: 400 });
    }

    const menuItem = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!menuItem) {
      return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Find an existing pending order for this user and restaurant
      let order = await tx.order.findFirst({
        where: {
          userId,
          restaurantId: menuItem.restaurantId,
          status: OrderStatus.PENDING,
        },
      });

      // 2. If no pending order, create one
      if (!order) {
        order = await tx.order.create({
          data: {
            userId,
            restaurantId: menuItem.restaurantId,
            status: OrderStatus.PENDING,
            totalPrice: 0, // Will be calculated later
          },
        });
      }

      // 3. Check if the item is already in the order
      const existingOrderItem = await tx.orderItem.findFirst({
        where: {
          orderId: order.id,
          menuItemId: menuItem.id,
        },
      });

      if (existingOrderItem) {
        // If item exists, update its quantity
        await tx.orderItem.update({
          where: { id: existingOrderItem.id },
          data: { quantity: { increment: quantity } },
        });
      } else {
        // If item doesn't exist, create a new order item
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            menuItemId: menuItem.id,
            quantity: quantity,
          },
        });
      }
      
      // 4. Recalculate the total price of the order
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: order.id },
        include: { menuItem: true },
      });

      const totalPrice = orderItems.reduce((total, item) => {
        return total + item.menuItem.price.toNumber() * item.quantity;
      }, 0);

      // 5. Update the order with the new total price
      const finalOrder = await tx.order.update({
        where: { id: order.id },
        data: { totalPrice },
        include: { items: { include: { menuItem: true } } }, // Include items for the response
      });

      return finalOrder;
    });

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}