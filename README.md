# Slooze Food Ordering Application

## Project Overview

This is a full-stack web application built for a take-home assignment from Slooze. It is a complete food ordering platform featuring a robust authentication system and a sophisticated, multi-layered access control model. The application is built with a modern tech stack including Next.js, TypeScript, PostgreSQL, and Prisma, demonstrating proficiency in technologies relevant to the company.

The core of this project is its advanced permission system, which implements both **Role-Based Access Control (RBAC)** and a **Relational Access Model** to restrict user actions and data visibility based on their role (Admin, Manager, Member) and their assigned country.

---

## Features Implemented

-   ✅ **Secure User Authentication**: Robust login system using JSON Web Tokens (JWT).
-   ✅ **Advanced Access Control**:
    -   **Role-Based Access Control (RBAC)**: Admins, Managers, and Members have distinct, enforced permissions for all actions, including placing orders, canceling orders, and updating payment methods.
    -   **Relational Access Control (Bonus Objective)**: Managers and Members are strictly limited to viewing and acting on data only within their assigned country (e.g., a Manager from India cannot see or interact with American restaurants).
-   ✅ **Complete Ordering Flow**: A seamless user journey from viewing restaurants and menus to managing a shopping cart and placing an order.
-   ✅ **Interactive Cart Management**: Users can add, increase, decrease, or remove items from their cart with an instantaneously updating UI, implemented using optimistic updates for a superior user experience.
-   ✅ **Dynamic UI**: The user interface, including navigation links and action buttons (like "Place Order"), changes dynamically based on the logged-in user's role and permissions.
-   ✅ **Dynamic Currency Display**: The currency symbol automatically updates (₹ for India, $ for America) based on the restaurant's location.

---

## Table of Contents

1.  [Tech Stack](#tech-stack)
2.  [Project Setup Guide](#project-setup-guide)
    -   [Step 1: Clone the Repository](#step-1-clone-the-repository)
    -   [Step 2: Install Dependencies](#step-2-install-dependencies)
    -   [Step 3: Set Up the Supabase PostgreSQL Database](#step-3-set-up-the-supabase-postgresql-database)
    -   [Step 4: Configure Environment Variables (`.env.local`)](#step-4-configure-environment-variables-envlocal)
    -   [Step 5: Sync Schema and Seed the Database](#step-5-sync-schema-and-seed-the-database)
    -   [Step 6: Run the Application](#step-6-run-the-application)
3.  [Testing the Application](#testing-the-application)
    -   [UI Testing Guide (Role by Role)](#ui-testing-guide-role-by-role)
    -   [API Endpoint Testing with Postman](#api-endpoint-testing-with-postman)

---

## Tech Stack

-   **Framework**: Next.js (App Router)
-   **Language**: TypeScript
-   **Database**: PostgreSQL (hosted on Supabase)
-   **ORM**: Prisma
-   **Authentication**: JSON Web Tokens (JWT)
-   **Styling**: Tailwind CSS

---

## Project Setup Guide

This guide provides detailed, step-by-step instructions to get the application running locally.

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd <repository-name>
```

### Step 2: Install Dependencies
This command will install all the necessary packages defined in package.json.

```Bash
npm install
```

### Step 3: Set Up the Supabase PostgreSQL Database
This application requires a PostgreSQL database. A free instance can be easily obtained from Supabase.

#### Create a Supabase Project:

Go to Supabase.io and sign up or log in.

Create a new project. During setup, you will be asked to create a database password. Save this password securely, as you will need it for the connection string.

#### Get the Database Connection Strings:

Once your project is created, navigate to Project Settings (the gear icon on the left sidebar).

In the settings menu, click on Database.

Under the Connection string section, you will find the URLs needed. This project uses both a direct connection (for the ORM) and a pooled connection (for the application) for optimal performance.

#### You will need to copy two strings:

The Transaction Pooler string (which ends in port 6543).

The Session Pooler string (which ends in port 5432).

### Step 4: Configure Environment Variables (.env.local)
In the root directory of the project, create a new file named .env.local. This file will store your secret keys and is ignored by Git for security.

Copy the template below and paste it into your .env.local file.

```
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings
# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.teegxhhqbwrznxptfrqs:<your-password>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.teegxhhqbwrznxptfrqs:<your-password>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

JWT_SECRET=[your-secret-key]

```
Important: Replace [YOUR-PASSWORD] and [YOUR-SECRET-KEY] with the actual credentials from your Supabase project.

### Step 5: Sync Schema and Seed the Database
These two commands will configure your new database with the required tables and populate it with the initial data set (users, restaurants, etc.).

**Sync the Database Schema**: This command reads the schema definition in prisma/schema.prisma and creates the corresponding tables in your PostgreSQL database.
```
Bash

npx prisma db push
```
**Seed the Database**: This command executes the script at prisma/seed.ts to fill the newly created tables with the initial data required for testing.
```
Bash

npx prisma db seed
```
### Step 6: Run the Application
You are now ready to start the local development server.
```
Bash

npm run dev
```
The application will be available at http://localhost:3000.

## Testing the Application

You can test the application thoroughly via the user interface or by using the provided Postman collection for the API endpoints.

### UI Testing Guide (Role by Role)

The password for all seeded users is **`password123`**.

#### Test 1: Member Journey (Thor - `thor@slooze.xyz`)
This test confirms a Member has the most restricted access.
1.  **Login**: Sign in as Thor.
2.  **View Restaurants**: Confirm you can **only** see the Indian restaurant ("Paradise Biryani").
3.  **View Menu**: Click on "Paradise Biryani" to view its menu.
4.  **Add to Cart**: Add items to the cart. The UI should update instantly.
5.  **View Cart**: Navigate to the cart page.
6.  **Verify Checkout Restriction**: Confirm that there is **no "Place Order" button** visible in the cart. This is a critical check.

#### Test 2: Manager Journey (Captain Marvel - `marvel@slooze.xyz`)
This test confirms a Manager can complete the full ordering process but is still restricted by country.
1.  **Login**: Sign in as Captain Marvel.
2.  **View Restaurants**: Confirm you can **only** see the Indian restaurant.
3.  **Add to Cart**: Add items to the cart.
4.  **View Cart & Checkout**: Navigate to the cart page. Confirm that the **"Place Order" button is now visible**.
5.  **Place Order**: Click the "Place Order" button to successfully check out. The cart should be empty afterward.

#### Test 3: Admin Journey (Nick Fury - `nickfury@slooze.xyz`)
This test confirms the Admin has unrestricted, org-wide access.
1.  **Login**: Sign in as Nick Fury.
2.  **View All Restaurants**: Confirm you can see **both** the Indian and American restaurants.
3.  **Place Order**: Confirm you can complete the full order flow for a restaurant in **either country**.

---

### API Endpoint Testing with Postman

The included Postman collection (`Slooze.postman_collection.json`) makes it easy to test all API endpoints directly.

#### Setup in Postman

1.  **Import the Collection**: Import the provided JSON file into Postman.
2.  **Set Up an Environment**: It's highly recommended to create a Postman Environment with a `baseURL` variable set to `http://localhost:3000`.
3.  **Authentication**: The "Login User" request includes a script in its **Tests** tab that automatically saves the JWT to an environment variable named `authToken`. All other requests are pre-configured to use this variable for authorization.

<!-- #### Testing Workflow

The collection uses variables like `{{orderId}}` for dynamic IDs. Here’s how to test the full flow:

1.  **Login**: Run the **"Login User"** request with any user's credentials (e.g., `marvel@slooze.xyz`). The `authToken` will be saved automatically.
2.  **Get Restaurant and Menu IDs**:
    * Run the **"Get All Restaurants"** request.
    * From the response, copy the `id` of a restaurant.
    * In the "Get Single Restaurant" request, replace `YOUR_RESTAURANT_ID` with the copied ID and run it.
    * From this response, copy the `id` of a menu item.
3.  **Create an Order**:
    * In the **"Add Item to Cart"** request, replace `YOUR_MENU_ITEM_ID` with the ID you just copied.
    * Run the request. The response will contain the newly created order. Copy the order's `id`.
4.  **Test Order Actions**:
    * You can now use the `orderId` to test the **"Place Order"** and **"Cancel Order"** endpoints by replacing `YOUR_ORDER_ID` in their URLs.
    * The items within the order will have their own unique IDs. You can copy an `orderItemId` from the "Get User's Cart" response to test the **"Update Item Quantity"** and **"Remove Item from Cart"** endpoints. -->


### API Endpoint Testing with Postman

To make testing the backend API as seamless as possible, this project includes both a Postman **collection** and an **environment** file.

-   `Slooze Foods Assignment.postman_collection.json`: Contains all the pre-configured API requests.
-   `Slooze Dev.postman_environment.json`: Contains the necessary environment variables, like the `baseURL`.

#### Setup in Postman

1.  **Import Both Files**:
    * In Postman, go to **File > Import** and select both the `Slooze.postman_collection.json` and `Slooze.postman_environment.json` files from the project directory.

2.  **Activate the Environment**:
    * In the top-right corner of Postman, click on the environment dropdown menu and select **"Slooze Project Env"**. This will activate the `baseURL` and other variables needed for the requests to work.

3.  **Authentication**:
    * The "Login User" request includes a script in its **Tests** tab that automatically saves the JWT to the `authToken` environment variable. All other requests are pre-configured to use this variable for authorization.

#### Testing Workflow (Automated)

The collection is scripted to make testing seamless. The requests will automatically capture and use the necessary IDs.

**To test the full workflow, simply run the requests in the following order:**

1.  **Login User**: Establishes your session and saves the auth token.
2.  **Get All Restaurants**: Automatically saves the ID of the first restaurant.
3.  **Get Single Restaurant**: Automatically uses the saved `restaurantId` and saves the ID of the first menu item.
4.  **Add Item to Cart**: Automatically uses the saved `menuItemId` and saves the new `orderId` and `orderItemId`.
5.  **Test Other Endpoints**: You can now run "Place Order", "Cancel Order", "Update Item Quantity", etc., without needing to manually copy any IDs.