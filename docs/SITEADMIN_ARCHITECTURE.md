# KutzApp Site Admin Architecture

This document provides a comprehensive overview of the Site Admin portion of the KutzApp application. The Site Admin dashboard is the central command center for platform administrators to manage tenants (Shops), monitor platform usage, assign custom AI-generated templates, and track system health.

## 1. Tech Stack Overview

The Site Admin module is built on the same core stack as the rest of the KutzApp application:

*   **Framework:** Next.js (App Router)
*   **Database ORM:** Prisma
*   **Database:** PostgreSQL
*   **Authentication:** Supabase Auth (checking for `SITE_ADMIN` role)
*   **Styling:** Tailwind CSS (with specific CRM aesthetic classes like `bg-crm-surface`, `text-crm-accent`)
*   **AI Integration:** Groq / Google Gemini APIs (for dynamic template generation)
*   **Asset Storage:** Google Drive (via `googleapis` and custom utility functions, used for storing template assets and generated code)

## 2. Core Data Models

The Site Admin interacts with almost all models in the system, but the following are central to its operation:

### `Shop`
The core multi-tenant entity. A shop represents a single salon or barbershop business on the platform. It holds relationships to Users, Services, Products, Appointments, and Customization settings.
*   **Key Fields:** `id`, `name`, `subdomain`, `customDomain`, `template`, `customization`

### `User`
Users belong to shops but are managed platform-wide by Site Admins.
*   **Roles:** `SITE_ADMIN`, `SHOP_ADMIN`, `STAFF`, `CLIENT`, `ATTENDANCE_KIOSK`. Site Admins have global access.

### `DynamicTemplate`
Stores custom AI-generated HTML/CSS templates that can be assigned to shops.
*   **Key Fields:** `name`, `prompt`, `htmlCode`, `cssCode`, `variables`, `shopId`.

### `ShopUsageReport`
Tracks the resource consumption of a shop over time to help determine appropriate SaaS billing tiers.
*   **Key Fields:** `userCount`, `appointmentCount`, `estimatedStorageMB`, `suggestedMonthlyFeeUSD`, `pricingTierName`.

### `SaaSTier`
Defines the pricing tiers for the platform based on usage metrics.
*   **Key Fields:** `name`, `baseFeeUSD`, `maxAppointments`, `maxUsers`, `storageLimitMB`.

### `SystemLog`
Centralized error and event logging for platform health monitoring.
*   **Key Fields:** `level`, `message`, `stack`, `isResolved`.

## 3. Core Workflows & Features

### A. Platform Dashboard (`/siteadmin`)
The main entry point provides a high-level overview of platform health and metrics.
*   **KPIs:** Total Shops, Total Users, Unresolved System Errors.
*   **Role Breakdown:** Visualizes the distribution of users across different roles (Staff, Clients, Admins).
*   **Recent Activity:** Lists recently onboarded shops with quick actions to assign teams or templates.

### B. Usage & Cost Analysis (`/api/siteadmin/shops/[id]/usage`)
Site Admins can view a detailed breakdown of a specific shop's resource consumption.
*   **Metrics Gathered:** Appointment count, User count, Intake Form submissions, Image uploads (Portfolio & Client History).
*   **Cost Calculation:** The system aggregates these metrics to estimate database storage (in MB) and runs them through a deterministic strategy calculator (`calculateUsageCostStrategy`) to recommend a specific `SaaSTier` and a suggested monthly fee.
*   **UI:** Displayed via the `UsageAnalysisModal` component.

### C. AI Template Generation & Assignment (`/api/siteadmin/templates/generate`)
A standout feature of the Site Admin is the ability to generate fully custom, single-page website templates for shops using AI.
*   **Process:** The admin provides a prompt, base assets (images, zip files), and a target shop.
*   **AI Prompting:** The system constructs a complex prompt for Groq/Gemini, injecting real shop data (services, staff, reviews) as context. It forces the AI to output standard Tailwind CSS and Handlebars templates (`{{shop.name}}`, `{{#each shop.services}}`).
*   **Asset Management:** Uploaded assets (HTML, CSS, images) are parsed and uploaded to a structured folder in Google Drive (`/kutzapp/[shopId]/[name]`). Local asset paths in the generated code are automatically replaced with their respective Google Drive URLs.
*   **Assignment:** The `AssignTemplateModal` allows the admin to switch a shop's active template between built-in options (Modern, Classic, Elegant) and the newly generated `DynamicTemplate`.

### D. System Health Monitoring
Site Admins monitor `SystemLog` entries to identify and resolve unhandled exceptions or critical platform errors across all tenant instances.

## 4. API Structure

All Site Admin APIs are located under `app/api/siteadmin/` and are protected by a strict `requireSiteAdmin()` middleware check that validates the user's session and `SITE_ADMIN` role via Supabase.

*   `GET /api/siteadmin/shops/[shopId]/usage` - Aggregates shop metrics and calculates SaaS tier pricing.
*   `POST /api/siteadmin/templates/generate` - Invokes LLMs to create custom Handlebars HTML/CSS templates.
*   `PATCH /api/siteadmin/shops/[shopId]/template` - Assigns a specific template to a shop.
*   `GET /api/siteadmin/templates` - Lists available dynamic templates.

## 5. Security Considerations

*   **Role-Based Access Control (RBAC):** All `/siteadmin` pages and `/api/siteadmin` routes strictly verify the `SITE_ADMIN` role. Regular `SHOP_ADMIN` users cannot access these routes.
*   **Tenant Data Isolation:** While Site Admins can view aggregated data across all shops, the APIs ensure that queries are properly scoped to prevent accidental cross-tenant data leakage when performing actions on a specific shop.
