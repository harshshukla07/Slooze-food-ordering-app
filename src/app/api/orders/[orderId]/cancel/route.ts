import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient, Role, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await context.params;
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    // 1. Permission Check: Block Members
    if (userRole === Role.MEMBER) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to cancel orders.' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    // 2. Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // 3. Ownership Check: Managers can only cancel their own orders
    if (userRole === Role.MANAGER && order.userId !== userId) {
        return NextResponse.json({ message: 'Forbidden: You can only cancel your own orders.' }, { status: 403 });
    }
    // Admins can cancel any order, so we don't add a check for them.

    // 4. Status Check: Only PLACED orders can be canceled
    if (order.status !== OrderStatus.PLACED) {
      return NextResponse.json({ message: `Cannot cancel an order with status "${order.status}"` }, { status: 400 });
    }

    // 5. Update the order status to "CANCELLED"
    const cancelledOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });

    return NextResponse.json(cancelledOrder, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}