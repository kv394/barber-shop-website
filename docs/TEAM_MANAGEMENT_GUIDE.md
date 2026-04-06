# How to Assign Admin Users to Shops

This guide explains how to assign admin users to shops and manage team members in your barber shop SaaS application.

## Overview

The system allows SHOP_ADMIN users to:
- Add team members to their shop with different roles
- Remove team members from the shop
- View all team members and their roles

There are two main user roles for shop management:
- **SHOP_ADMIN**: Can manage shop settings, template, team members, and services
- **CLIENT**: Can view the shop and book appointments

## How to Assign Admin Users to Shops

### Method 1: Using the Team Management UI (Easiest)

1. **Login as SHOP_ADMIN**
   - Sign in with your shop admin account

2. **Navigate to Team Management**
   - Go to your shop dashboard: `/shop/[shopId]`
   - Click on the "Team Members" tab
   - Or go directly to: `/shop/[shopId]/settings/team`

3. **Add a New Team Member**
   - In the "Add New Team Member" section, enter:
     - **Email Address**: The email of the person you want to add
     - **Role**: Choose between:
       - `Client` - Can book appointments
       - `Admin` - Can manage shop settings and team members
   - Click "Add Member" button

4. **Manage Existing Team Members**
   - View all current team members in the "Current Team" section
   - Click the "Remove" button to remove a team member from the shop

### Method 2: Using the API (Programmatic)

#### Add a User to Shop
```bash
POST /api/shops/[shopId]/users
Content-Type: application/json
Authorization: Bearer Your-Supabase-Session-Token

{
  "email": "john@example.com",
  "role": "SHOP_ADMIN"
}
```

**Response:**
```json
{
  "id": "user_123",
  "email": "john@example.com",
  "name": null,
  "role": "SHOP_ADMIN",
  "shopId": "shop_456",
  "createdAt": "2024-03-22T10:00:00Z",
  "updatedAt": "2024-03-22T10:00:00Z"
}
```

#### Get All Shop Users
```bash
GET /api/shops/[shopId]/users
Authorization: Bearer Your-Supabase-Session-Token
```

**Response:**
```json
[
  {
    "id": "user_123",
    "email": "admin@example.com",
    "name": "John Admin",
    "role": "SHOP_ADMIN",
    "createdAt": "2024-03-22T10:00:00Z"
  },
  {
    "id": "user_456",
    "email": "client@example.com",
    "name": "Jane Client",
    "role": "CLIENT",
    "createdAt": "2024-03-22T10:05:00Z"
  }
]
```

#### Remove a User from Shop
```bash
DELETE /api/shops/[shopId]/users
Content-Type: application/json
Authorization: Bearer Your-Supabase-Session-Token

{
  "userId": "user_123"
}
```

## Important Notes

1. **Permissions**:
   - Only SHOP_ADMIN or SUPER_ADMIN can assign users to shops
   - Only SHOP_ADMIN or SUPER_ADMIN can remove users from shops
   - You cannot remove yourself from a shop

2. **User Email**:
   - Enter the email address exactly as they registered with Supabase
   - If the user doesn't exist in the system yet, a placeholder account will be created

3. **Role Changes**:
   - If a user is already assigned to a shop, you can update their role by assigning them again
   - SUPER_ADMIN users cannot be assigned to shops

4. **Database**:
   - User assignments are stored in the PostgreSQL database
   - The `User.shopId` field links users to shops
   - The `User.role` field determines their permissions

## User Role Permissions

### SHOP_ADMIN
- Manage shop settings and appearance
- Select and customize shop templates
- Add/remove team members
- View team member list
- Manage services (if implemented)
- View shop dashboard

### CLIENT
- View shop public page
- Book appointments
- View services and pricing

### SUPER_ADMIN
- Manage all shops
- Create new shops
- Delete shops
- Manage shop admins

## Database Schema

The user-shop relationship is defined in the Prisma schema:

```prisma
model User {
  id       String    @id @default(cuid())
  email    String    @unique
  name     String?
  role     UserRole
  shopId   String?   // Optional - NULL for SUPER_ADMINs
  shop     Shop?     @relation(fields: [shopId], references: [id])
  ...
}

model Shop {
  id        String   @id @default(cuid())
  name      String
  users     User[]
  ...
}

enum UserRole {
  SUPER_ADMIN
  SHOP_ADMIN
  CLIENT
}
```

## Troubleshooting

### "User not found" error
- Make sure the email address matches exactly how they registered with Supabase
- Check that you're using the correct shop ID

### "Forbidden: You do not have permission" error
- Make sure you're logged in as a SHOP_ADMIN for that specific shop
- SUPER_ADMINs can manage any shop
- SHOP_ADMINs can only manage their own shop

### User not appearing in team list
- Refresh the page
- Check that the user was successfully added (look for success message)
- Make sure you're viewing the correct shop

## Next Steps

1. **Sign in as a SHOP_ADMIN** to your shop
2. **Navigate to the Team Members tab** at `/shop/[shopId]/settings/team`
3. **Add team members** by entering their email and selecting a role
4. **Invite them to log in** with their email to activate their account

That's it! Your team members can now access the shop dashboard with their assigned permissions.
