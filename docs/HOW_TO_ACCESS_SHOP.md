# How to Access the Shop - Complete Guide

## Quick Navigation

### For SITE_ADMIN Users

#### 1. Create a New Shop
1. Go to `http://localhost:3000/` (home page)
2. Sign in with your account
3. You'll see "Provision a New Shop" form
4. Enter a shop name
5. Click "Create Shop"

#### 2. Configure an Existing Shop
1. Click on the shop name from "Existing Shops" list
2. You'll be taken to `/shop/[shopId]/config` (Setup page)
3. From here you can:
   - **Step 1:** Add admin users (assign them SHOP_ADMIN role)
   - **Step 2:** Select a template style (Modern, Classic, Minimal, Vibrant)

#### 3. Customize Shop Appearance
1. From the config page, click the **"Appearance"** tab
2. Or navigate to `/shop/[shopId]/settings`
3. You can customize:
   - Brand colors (primary, secondary)
   - Contact information (phone, email, address)
   - Social media links (Facebook, Instagram, Twitter)

#### 4. Manage Team Members
1. From any shop page, click **"Team Members"** tab
2. Or navigate to `/shop/[shopId]/settings/team`
3. You can:
   - Add new team members by email
   - Assign roles (Admin or Client)
   - Remove team members

#### 5. Preview Public Shop Page
1. Click the **"Preview"** button on the config page
2. Or navigate to `/shop-template/[shop-name-slug]`
3. Example: `/shop-template/barber-shop-downtown`

---

### For SHOP_ADMIN Users

#### 1. Access Your Shop Dashboard
1. Go to `http://localhost:3000/` (home page)
2. Sign in with your account
3. You'll see "Shop Admin Dashboard"
4. You have quick links to:
   - **⚙️ Settings** - Customize appearance
   - **👥 Team** - Manage team members
   - **👁️ Preview** - View your public shop page

#### 2. Customize Your Shop Appearance
1. Click **"Settings"** from the dashboard
2. Or navigate to `/shop/[shopId]/settings`
3. You can modify:
   - Template selection (change anytime)
   - Brand colors
   - Contact information
   - Social media links

#### 3. Manage Your Team
1. Click **"Team"** from the dashboard
2. Or navigate to `/shop/[shopId]/settings/team`
3. You can:
   - Invite new staff/team members
   - Assign roles
   - Remove team members

#### 4. View Your Public Shop Page
1. Click **"Preview"** button
2. Or navigate to `/shop-template/[your-shop-slug]`
3. See how customers view your shop

---

### For CLIENT Users

#### 1. Browse Available Shops
1. Go to `http://localhost:3000/` (home page)
2. You'll see "Browse Shops" button
3. Or navigate to `/shops`
4. You'll see all available shops

#### 2. View Shop Details
1. Click on any shop from the list
2. See shop name, description, and services
3. View pricing and service duration

#### 3. Book an Appointment
1. On a shop page, click **"Book Now"** button
2. (Future feature - currently shows the button)

---

### For Unauthenticated Users

#### 1. Browse Shops Without Signing In
1. Go to `http://localhost:3000/` (home page)
2. Click **"Browse Shops"** button
3. Or navigate directly to `/shops`
4. View all available shops and services

#### 2. Sign In
1. Click **"Sign In"** button (top right)
2. Use Supabase authentication
3. Create an account with email or social login

---

## Direct URL Navigation

| Role | Path | Description |
|------|------|-------------|
| Any | `/` | Home page / Dashboard |
| Any | `/shops` | Browse all shops |
| SITE_ADMIN | `/shop/[shopId]/config` | Shop configuration & setup |
| SHOP_ADMIN | `/shop/[shopId]/settings` | Customize shop appearance |
| SHOP_ADMIN | `/shop/[shopId]/settings/team` | Manage team members |
| Any | `/shop-template/[slug]` | Public shop page |

---

## API Endpoints

### User Management
- `POST /api/users/init` - Create new user profile
- `GET /api/users/profile/[id]` - Get user profile

### Shop Management
- `GET /api/shops` - List all shops
- `POST /api/shops` - Create new shop

### Shop Configuration
- `POST /api/shops/[shopId]/template` - Update template
- `POST /api/shops/[shopId]/customization` - Update customization
- `POST /api/shops/[shopId]/users` - Add team member
- `GET /api/shops/[shopId]/users` - List team members
- `DELETE /api/shops/[shopId]/users` - Remove team member

---

## Quick Start Guide

### Scenario 1: Create and Configure a Shop (SITE_ADMIN)

1. Sign in as SITE_ADMIN
2. Enter shop name: "Downtown Barber"
3. Click "Create Shop"
4. Click on "Downtown Barber" from existing shops
5. On Setup page:
   - Email: `admin@downtown-barber.com`
   - Role: Select "Admin"
   - Click "Add Member"
6. Select "Modern" template
7. Click "Appearance" tab to customize colors
8. Add contact info (phone, email, address)
9. Click "Preview" to see public page

### Scenario 2: Manage Your Shop (SHOP_ADMIN)

1. Sign in as SHOP_ADMIN (assigned to a shop)
2. See your shop in dashboard
3. Click "Settings" to customize
4. Add brand colors and contact info
5. Click "Team" to invite more staff
6. Add email of staff member
7. Select role (Admin or Client)
8. Click "Preview" to see public page

### Scenario 3: Browse and View Shops (CLIENT)

1. Sign in or stay anonymous
2. Click "Browse Shops" or go to `/shops`
3. View all shops and their services
4. Click on a shop to see details
5. View pricing, duration, and contact info
6. Click "Book Now" to reserve (coming soon)

---

## Common Questions

**Q: How do I become a SHOP_ADMIN?**
A: A SITE_ADMIN must add you to a shop with the SHOP_ADMIN role.

**Q: Can I manage multiple shops?**
A: SITE_ADMINs can manage all shops. SHOP_ADMINs can only manage their assigned shop.

**Q: How do I reset my role?**
A: Contact a SITE_ADMIN to reassign your role.

**Q: Can I change the template later?**
A: Yes! Go to Settings → Appearance and select a new template anytime.

**Q: How do customers find my shop?**
A: They visit `/shops` and browse all available shops.

---

## Environment & Deployment

### Development
- Run: `npm run dev`
- Access: `http://localhost:3000`

### Production
- Run: `npm run build && npm run start`
- Access: Your deployed URL

---

## Need Help?

- **404 Error?** Make sure you're signed in and have permission
- **Can't save changes?** Check your internet connection
- **Template not updating?** Refresh the page
- **Team member not appearing?** Wait a moment and refresh
