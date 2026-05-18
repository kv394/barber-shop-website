import { Type } from '@google/genai';
import { prisma } from '@/lib/prisma';

export const adminToolDeclarations = [
  {
    name: 'get_shop_context',
    description: 'Retrieve current services, products, addons, blackout dates, staff, and general settings for the shop to understand its current state before making changes.',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  },
  {
    name: 'manage_service',
    description: 'Create, update, or delete a service for the shop.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: '"create", "update", or "delete"' },
        serviceId: { type: Type.STRING, description: 'Required for update or delete' },
        name: { type: Type.STRING, description: 'Name of the service (required for create)' },
        price: { type: Type.NUMBER, description: 'Price in dollars (e.g. 30)' },
        duration: { type: Type.INTEGER, description: 'Duration in minutes (e.g. 45)' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_product',
    description: 'Create, update, or delete a product/inventory item.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: '"create", "update", or "delete"' },
        productId: { type: Type.STRING, description: 'Required for update or delete' },
        name: { type: Type.STRING, description: 'Name of the product (required for create)' },
        price: { type: Type.NUMBER, description: 'Price in dollars' },
        inventoryCount: { type: Type.INTEGER, description: 'Current stock quantity' },
        trackInventory: { type: Type.BOOLEAN, description: 'Whether to track inventory' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_addon',
    description: 'Create, update, or delete a service add-on.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: '"create", "update", or "delete"' },
        addonId: { type: Type.STRING, description: 'Required for update or delete' },
        name: { type: Type.STRING, description: 'Name of the add-on (required for create)' },
        price: { type: Type.NUMBER, description: 'Price in dollars' },
        durationMin: { type: Type.INTEGER, description: 'Extra duration in minutes' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_blackout_date',
    description: 'Add or remove a blackout date (shop closure or holiday).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: { type: Type.STRING, description: '"create" or "delete"' },
        blackoutDateId: { type: Type.STRING, description: 'Required for delete' },
        date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format (required for create)' },
        reason: { type: Type.STRING, description: 'Reason for closure' }
      },
      required: ['action']
    }
  },
  {
    name: 'manage_shop_settings',
    description: 'Update general shop settings like name, timezone, or deposit requirements.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Shop Name' },
        timezone: { type: Type.STRING, description: 'Shop Timezone (e.g. America/New_York)' },
        depositAmount: { type: Type.NUMBER, description: 'Deposit amount required for bookings' },
        depositRequired: { type: Type.BOOLEAN, description: 'Whether deposits are required' }
      }
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
        const [services, products, addons, blackoutDates, shop, staff] = await Promise.all([
          prisma.service.findMany({ where: { shopId }, select: { id: true, name: true, price: true, duration: true } }),
          prisma.product.findMany({ where: { shopId }, select: { id: true, name: true, price: true, inventoryCount: true } }),
          prisma.serviceAddon.findMany({ where: { shopId }, select: { id: true, name: true, price: true, durationMin: true } }),
          prisma.shopBlackoutDate.findMany({ where: { shopId }, select: { id: true, date: true, reason: true } }),
          prisma.shop.findUnique({ where: { id: shopId }, select: { name: true, timezone: true, depositAmount: true, depositRequired: true } }),
          prisma.user.findMany({ where: { shopId, role: { in: ['STAFF', 'SHOP_ADMIN'] } }, select: { id: true, name: true, role: true } })
        ]);
        return { services, products, addons, blackoutDates, shop, staff };
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

      default:
        return { error: `Unknown tool: ${call.name}` };
    }
  } catch (err: any) {
    return { error: err.message };
  }
}
