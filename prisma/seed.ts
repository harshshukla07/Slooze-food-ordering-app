
import { PrismaClient, Role, Country } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // --- HASH PASSWORD ---
  const password = await bcrypt.hash('password123', 10);

  // --- CREATE USERS ---
  // Using upsert to avoid creating duplicate users on subsequent seeds.
  // It will update the user if the email already exists, otherwise create it.
  
  await prisma.user.upsert({
    where: { email: 'nickfury@slooze.xyz' },
    update: {},
    create: {
      email: 'nickfury@slooze.xyz',
      name: 'Nick Fury',
      password: password,
      role: Role.ADMIN,
      country: Country.AMERICA, // Admin can be associated with any country
    },
  });

  await prisma.user.upsert({
    where: { email: 'marvel@slooze.xyz' },
    update: {},
    create: {
      email: 'marvel@slooze.xyz',
      name: 'Captain Marvel',
      password: password,
      role: Role.MANAGER,
      country: Country.INDIA,
    },
  });

  await prisma.user.upsert({
    where: { email: 'america@slooze.xyz' },
    update: {},
    create: {
      email: 'america@slooze.xyz',
      name: 'Captain America',
      password: password,
      role: Role.MANAGER,
      country: Country.AMERICA,
    },
  });

  await prisma.user.upsert({
    where: { email: 'thanos@slooze.xyz' },
    update: {},
    create: {
      email: 'thanos@slooze.xyz',
      name: 'Thanos',
      password: password,
      role: Role.MEMBER,
      country: Country.INDIA,
    },
  });

  await prisma.user.upsert({
    where: { email: 'thor@slooze.xyz' },
    update: {},
    create: {
      email: 'thor@slooze.xyz',
      name: 'Thor',
      password: password,
      role: Role.MEMBER,
      country: Country.INDIA,
    },
  });

  await prisma.user.upsert({
    where: { email: 'travis@slooze.xyz' },
    update: {},
    create: {
      email: 'travis@slooze.xyz',
      name: 'Travis',
      password: password,
      role: Role.MEMBER,
      country: Country.AMERICA,
    },
  });

  console.log('Users seeded.');

  // --- CREATE RESTAURANTS AND MENU ITEMS ---
  // Using a transaction to ensure all or none of the operations complete.
  
  await prisma.$transaction(async (tx) => {
    // Restaurant in India
    const paradiseBiryani = await tx.restaurant.create({
      data: {
        name: 'Paradise Biryani',
        country: Country.INDIA,
        menuItems: {
          create: [
            { name: 'Chicken Biryani', price: 250.0 },
            { name: 'Mutton Biryani', price: 350.0 },
            { name: 'Veg Biryani', price: 200.0 },
          ],
        },
      },
    });

    // Restaurant in America
    const pizzaHut = await tx.restaurant.create({
      data: {
        name: "America's Pizza Hub",
        country: Country.AMERICA,
        menuItems: {
          create: [
            { name: 'Pepperoni Pizza', price: 12.99 },
            { name: 'Margherita Pizza', price: 10.99 },
            { name: 'Garlic Bread', price: 5.99 },
          ],
        },
      },
    });

    console.log('Restaurants and menu items seeded.');
    console.log({ paradiseBiryani, pizzaHut });
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });