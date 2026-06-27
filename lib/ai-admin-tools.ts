import { SchemaType, FunctionDeclaration } from '@google-cloud/vertexai';
import { prisma } from '@/lib/prisma';

export const adminToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'get_shop_context',
    description: 'Retrieve current services, products, addons, blackout dates, staff, resources (seats/stations), and general settings for the shop to understand its current state before making changes.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {}
    }
  },
  {
    name: 'manage_service',
    description: 'Create, update, or delete a service for the shop.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        action: { type: SchemaType.STRING, description: '"create", "update", or "delete"' },
        serviceId: { type: SchemaType.STRING, description: 'Required for update or delete' },
        name: { type: SchemaType.STRING, description: 'Name of the service (required for create)' },
        price: { type: SchemaType.NUMBER, description: 'Price in dollars (e.g. 30)' },
        duration: { type: SchemaType.INTEGER, description: 'Duration in minutes (e.g. 45)' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_product',
    description: 'Create, update, or delete a product/inventory item.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        action: { type: SchemaType.STRING, description: '"create", "update", or "delete"' },
        productId: { type: SchemaType.STRING, description: 'Required for update or delete' },
        name: { type: SchemaType.STRING, description: 'Name of the product (required for create)' },
        price: { type: SchemaType.NUMBER, description: 'Price in dollars' },
        inventoryCount: { type: SchemaType.INTEGER, description: 'Current stock quantity' },
        trackInventory: { type: SchemaType.BOOLEAN, description: 'Whether to track inventory' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_addon',
    description: 'Create, update, or delete a service add-on.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        action: { type: SchemaType.STRING, description: '"create", "update", or "delete"' },
        addonId: { type: SchemaType.STRING, description: 'Required for update or delete' },
        name: { type: SchemaType.STRING, description: 'Name of the add-on (required for create)' },
        price: { type: SchemaType.NUMBER, description: 'Price in dollars' },
        durationMin: { type: SchemaType.INTEGER, description: 'Extra duration in minutes' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_blackout_date',
    description: 'Add or remove a blackout date (shop closure or holiday).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        action: { type: SchemaType.STRING, description: '"create" or "delete"' },
        blackoutDateId: { type: SchemaType.STRING, description: 'Required for delete' },
        date: { type: SchemaType.STRING, description: 'Date in YYYY-MM-DD format (required for create)' },
        reason: { type: SchemaType.STRING, description: 'Reason for closure' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_shop_settings',
    description: 'Update general shop settings like name, timezone, or deposit requirements.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING, description: 'Shop Name' },
        timezone: { type: SchemaType.STRING, description: 'Shop Timezone (e.g. America/New_York)' },
        depositAmount: { type: SchemaType.NUMBER, description: 'Deposit amount required for bookings' },
        depositRequired: { type: SchemaType.BOOLEAN, description: 'Whether deposits are required' }
      }
    }
  },
  {
    name: 'manage_resource',
    description: 'Create, update, or delete a resource (like a chair, station, or seat) in the shop.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        action: { type: SchemaType.STRING, description: '"create", "update", or "delete"' },
        resourceId: { type: SchemaType.STRING, description: 'Required for update or delete' },
        name: { type: SchemaType.STRING, description: 'Name of the resource (e.g., Chair 1, VIP Station)' },
        type: { type: SchemaType.STRING, description: 'Type of resource (e.g., CHAIR, ROOM, STATION)' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_staff',
    description: 'Create, update, or remove a staff member (user) in the shop.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        action: { type: SchemaType.STRING, description: '"create", "update", or "delete"' },
        userId: { type: SchemaType.STRING, description: 'Required for update or delete' },
        name: { type: SchemaType.STRING, description: 'Name of the staff member' },
        email: { type: SchemaType.STRING, description: 'Email of the staff member (required for create)' },
        role: { type: SchemaType.STRING, description: 'Role (e.g., STAFF, SHOP_ADMIN)' }
      },
      required: ['action']
    }
  },
  {
    name: 'get_staff_schedule',
    description: 'Retrieve staff appointments and schedule for a specific date to check availability.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        date: { type: SchemaType.STRING, description: 'Date in YYYY-MM-DD format (e.g., 2026-05-19)' },
        staffId: { type: SchemaType.STRING, description: 'Optional. Filter by specific staff member ID' }
      },
      required: ['date']
    }
  }
];

export async function executeAdminTool(call: any, shopId: string, user: any) {
  if (user.role !== 'SHOP_ADMIN' && user.role !== 'SITE_ADMIN') {
    return { error: "Permission denied. Only Admins can execute tools." };
  }

  const args = call.args || {};

  try {
    switch (call.name) {
      case 'get_shop_context': {
        const [services, products, addons, blackoutDates, shop, staff, resources] = await Promise.all([
          prisma.service.findMany({ where: { shopId }, select: { id: true, name: true, price: true, duration: true } }),
          prisma.product.findMany({ where: { shopId }, select: { id: true, name: true, price: true, inventoryCount: true } }),
          prisma.serviceAddon.findMany({ where: { shopId }, select: { id: true, name: true, price: true, durationMin: true } }),
          prisma.shopBlackoutDate.findMany({ where: { shopId }, select: { id: true, date: true, reason: true } }),
          prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, timezone: true, depositAmount: true, depositRequired: true } }),
          prisma.user.findMany({ where: { shopId, role: { in: ['STAFF', 'SHOP_ADMIN'] } }, select: { id: true, name: true, role: true } }),
          prisma.resource.findMany({ where: { shopId }, select: { id: true, name: true, type: true } })
        ]);
        return { services, products, addons, blackoutDates, shop, staff, resources };
      }

      case 'manage_service': {
        if (args.action === 'create') {
          if (!args.name || args.price === undefined || args.duration === undefined) {
             return { error: "Missing required fields: name, price, duration" };
          }
          const s = await prisma.service.create({
            data: { shopId, name: args.name, price: args.price, duration: args.duration, type: 'CUSTOMER' }
          });
          return { success: true, message: `Service '${s.name}' created with ID ${s.id}` };
        } else if (args.action === 'update') {
          if (!args.serviceId) return { error: "serviceId required for update" };
          const dataToUpdate: any = {};
          if (args.name !== undefined) dataToUpdate.name = args.name;
          if (args.price !== undefined) dataToUpdate.price = args.price;
          if (args.duration !== undefined) dataToUpdate.duration = args.duration;
          const s = await prisma.service.update({ where: { id: args.serviceId }, data: dataToUpdate });
          return { success: true, message: `Service '${s.name}' updated` };
        } else if (args.action === 'delete') {
          if (!args.serviceId) return { error: "serviceId required for delete" };
          await prisma.service.delete({ where: { id: args.serviceId } });
          return { success: true, message: `Service deleted` };
        }
        return { error: "Unknown action" };
      }

      case 'manage_product': {
        if (args.action === 'create') {
          if (!args.name || args.price === undefined) return { error: "Missing required fields: name, price" };
          const p = await prisma.product.create({
            data: { shopId, name: args.name, price: args.price, inventoryCount: args.inventoryCount || 0, trackInventory: args.trackInventory ?? false, type: 'RETAIL' }
          });
          return { success: true, message: `Product '${p.name}' created` };
        } else if (args.action === 'update') {
          if (!args.productId) return { error: "productId required for update" };
          const dataToUpdate: any = {};
          if (args.name !== undefined) dataToUpdate.name = args.name;
          if (args.price !== undefined) dataToUpdate.price = args.price;
          if (args.inventoryCount !== undefined) dataToUpdate.inventoryCount = args.inventoryCount;
          if (args.trackInventory !== undefined) dataToUpdate.trackInventory = args.trackInventory;
          const p = await prisma.product.update({ where: { id: args.productId }, data: dataToUpdate });
          return { success: true, message: `Product '${p.name}' updated` };
        } else if (args.action === 'delete') {
          if (!args.productId) return { error: "productId required for delete" };
          await prisma.product.delete({ where: { id: args.productId } });
          return { success: true, message: `Product deleted` };
        }
        return { error: "Unknown action" };
      }

      case 'manage_addon': {
        if (args.action === 'create') {
          if (!args.name || args.price === undefined) return { error: "Missing required fields: name, price" };
          const a = await prisma.serviceAddon.create({
            data: { shopId, name: args.name, price: args.price, durationMin: args.durationMin || 0 }
          });
          return { success: true, message: `Add-on '${a.name}' created` };
        } else if (args.action === 'update') {
          if (!args.addonId) return { error: "addonId required for update" };
          const dataToUpdate: any = {};
          if (args.name !== undefined) dataToUpdate.name = args.name;
          if (args.price !== undefined) dataToUpdate.price = args.price;
          if (args.durationMin !== undefined) dataToUpdate.durationMin = args.durationMin;
          const a = await prisma.serviceAddon.update({ where: { id: args.addonId }, data: dataToUpdate });
          return { success: true, message: `Add-on '${a.name}' updated` };
        } else if (args.action === 'delete') {
          if (!args.addonId) return { error: "addonId required for delete" };
          await prisma.serviceAddon.delete({ where: { id: args.addonId } });
          return { success: true, message: `Add-on deleted` };
        }
        return { error: "Unknown action" };
      }

      case 'manage_blackout_date': {
        if (args.action === 'create') {
          if (!args.date) return { error: "Date required for create" };
          const d = await prisma.shopBlackoutDate.create({
            data: { shopId, date: new Date(args.date), reason: args.reason }
          });
          return { success: true, message: `Blackout date created for ${args.date}` };
        } else if (args.action === 'delete') {
          if (!args.blackoutDateId) return { error: "blackoutDateId required for delete" };
          await prisma.shopBlackoutDate.delete({ where: { id: args.blackoutDateId } });
          return { success: true, message: `Blackout date deleted` };
        }
        return { error: "Unknown action" };
      }

      case 'manage_shop_settings': {
        const dataToUpdate: any = {};
        if (args.name !== undefined) dataToUpdate.name = args.name;
        if (args.timezone !== undefined) dataToUpdate.timezone = args.timezone;
        if (args.depositAmount !== undefined) dataToUpdate.depositAmount = args.depositAmount;
        if (args.depositRequired !== undefined) dataToUpdate.depositRequired = args.depositRequired;
        
        if (Object.keys(dataToUpdate).length === 0) return { error: "No fields provided to update" };
        
        await prisma.shop.update({ where: { id: shopId }, data: dataToUpdate });
        return { success: true, message: `Shop settings updated` };
      }

      case 'manage_resource': {
        if (args.action === 'create') {
          if (!args.name || !args.type) return { error: "Missing required fields: name, type" };
          const r = await prisma.resource.create({
            data: { shopId, name: args.name, type: args.type }
          });
          return { success: true, message: `Resource '${r.name}' created` };
        } else if (args.action === 'update') {
          if (!args.resourceId) return { error: "resourceId required for update" };
          const dataToUpdate: any = {};
          if (args.name !== undefined) dataToUpdate.name = args.name;
          if (args.type !== undefined) dataToUpdate.type = args.type;
          const r = await prisma.resource.update({ where: { id: args.resourceId }, data: dataToUpdate });
          return { success: true, message: `Resource '${r.name}' updated` };
        } else if (args.action === 'delete') {
          if (!args.resourceId) return { error: "resourceId required for delete" };
          await prisma.resource.delete({ where: { id: args.resourceId } });
          return { success: true, message: `Resource deleted` };
        }
        return { error: "Unknown action" };
      }

      case 'manage_staff': {
        if (args.action === 'create') {
          if (!args.email || !args.name) return { error: "Missing required fields: email, name" };
          const u = await prisma.user.create({
            data: { shopId, email: args.email, name: args.name, role: args.role || 'STAFF' }
          });
          return { success: true, message: `Staff member '${u.name}' created` };
        } else if (args.action === 'update') {
          if (!args.userId) return { error: "userId required for update" };
          const dataToUpdate: any = {};
          if (args.name !== undefined) dataToUpdate.name = args.name;
          if (args.email !== undefined) dataToUpdate.email = args.email;
          if (args.role !== undefined) dataToUpdate.role = args.role;
          const u = await prisma.user.update({ where: { id: args.userId }, data: dataToUpdate });
          return { success: true, message: `Staff member '${u.name}' updated` };
        } else if (args.action === 'delete') {
          if (!args.userId) return { error: "userId required for delete" };
          await prisma.user.update({ where: { id: args.userId }, data: { shopId: null } });
          return { success: true, message: `Staff member removed from shop` };
        }
        return { error: "Unknown action" };
      }

      case 'get_staff_schedule': {
        if (!args.date) return { error: "Date is required" };
        const targetDate = new Date(args.date);
        if (isNaN(targetDate.getTime())) return { error: "Invalid date format. Use YYYY-MM-DD." };
        
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const whereClause: any = {
          shopId,
          startTime: { gte: startOfDay, lt: endOfDay },
          status: { notIn: ['CANCELLED'] }
        };
        
        if (args.staffId) {
          whereClause.staffId = args.staffId;
        }

        const appointments = await prisma.appointment.findMany({
          where: whereClause,
          include: {
            service: { select: { name: true, duration: true } },
            staff: { select: { name: true } },
            user: { select: { name: true } }
          },
          orderBy: { startTime: 'asc' }
        });

        const schedule = appointments.map((apt: any) => ({
          id: apt.id,
          startTime: apt.startTime.toISOString(),
          endTime: apt.endTime.toISOString(),
          service: apt.service?.name,
          staffName: apt.staff?.name,
          clientName: apt.user?.name,
          status: apt.status
        }));

        return {
          date: args.date,
          appointmentsCount: schedule.length,
          schedule: schedule.length > 0 ? schedule : "No appointments for this date."
        };
      }

      default:
        return { error: `Unknown tool: ${call.name}` };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}
