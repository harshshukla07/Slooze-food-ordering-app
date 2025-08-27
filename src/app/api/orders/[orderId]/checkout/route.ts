
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient, Role, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// No separate 'RouteParams' interface is needed.
// We define the type of the 'context' object directly in the function signature.
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    // 1. Get the orderId from the 'context' object
    const { orderId } = await context.params;
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    // 2. Permission Check: Block Members from placing orders
    if (userRole === Role.MEMBER) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to place orders.' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    // 3. Find the order to make sure it exists and belongs to the user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found or you do not own this order' }, { status: 404 });
    }
    
    if (order.status !== OrderStatus.PENDING) {
        return NextResponse.json({ message: `Order has already been ${order.status.toLowerCase()}`}, { status: 400 });
    }

    // 4. Update the order status to "PLACED"
    const placedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: OrderStatus.PLACED,
      },
    });

    return NextResponse.json(placedOrder, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}