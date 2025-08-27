
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role');
    const userId = request.headers.get('x-user-id');

    // 1. Permission Check: ONLY Admins are allowed
    if (userRole !== Role.ADMIN) {
      return NextResponse.json({ message: 'Forbidden: You do not have permission to perform this action.' }, { status: 403 });
    }

    if (!userId) {
      return NextResponse.json({ message: 'User not authenticated' }, { status: 401 });
    }

    const { paymentMethod } = await request.json();
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return NextResponse.json({ message: 'A valid paymentMethod string is required' }, { status: 400 });
    }

    // 2. Update the Admin's payment method in the database
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        paymentMethod,
      },
      // Use 'select' to ensure we DON'T return the hashed password
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        paymentMethod: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}