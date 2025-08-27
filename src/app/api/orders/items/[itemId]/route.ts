
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// --- UPDATE ITEM QUANTITY ---
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const { quantity } = await request.json();
    const userId = request.headers.get('x-user-id');

    if (quantity == null || quantity <= 0) {
      return NextResponse.json({ message: 'A valid quantity is required' }, { status: 400 });
    }

    // Use a transaction to ensure data integrity
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.findUnique({
        where: { id: itemId },
        include: { order: true },
      });

      if (!orderItem || orderItem.order.userId !== userId) {
        throw new Error('Item not found or you do not have permission to edit it.');
      }

      await tx.orderItem.update({
        where: { id: itemId },
        data: { quantity },
      });

      // Recalculate total price
      const allItems = await tx.orderItem.findMany({
        where: { orderId: orderItem.orderId },
        include: { menuItem: true },
      });
      const totalPrice = allItems.reduce((total, item) => total + item.menuItem.price.toNumber() * item.quantity, 0);
      
      return tx.order.update({
        where: { id: orderItem.orderId },
        data: { totalPrice },
      });
    });
    
    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to update item' }, { status: 500 });
  }
}

// --- REMOVE ITEM FROM CART ---
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await context.params;
    const userId = request.headers.get('x-user-id');
    
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const orderItem = await tx.orderItem.findUnique({
        where: { id: itemId },
        include: { order: true },
      });

      if (!orderItem || orderItem.order.userId !== userId) {
        throw new Error('Item not found or you do not have permission to remove it.');
      }

      await tx.orderItem.delete({ where: { id: itemId } });
      
      // Recalculate total price
      const allItems = await tx.orderItem.findMany({
        where: { orderId: orderItem.orderId },
        include: { menuItem: true },
      });
      const totalPrice = allItems.reduce((total, item) => total + item.menuItem.price.toNumber() * item.quantity, 0);
      
      return tx.order.update({
        where: { id: orderItem.orderId },
        data: { totalPrice },
        include: { items: true } // Return the remaining items
      });
    });

    if (updatedOrder.items.length === 0) {
      // If the cart is empty, delete the order itself
      await prisma.order.delete({ where: { id: updatedOrder.id } });
      return NextResponse.json({ message: 'Item removed and cart deleted as it was empty.' }, { status: 200 });
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to remove item' }, { status: 500 });
  }
}