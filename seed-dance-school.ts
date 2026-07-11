import { prisma } from './lib/prisma';

async function main() {
  console.log('Seeding Rhythm & Motion Dance Studio (Bollywood Theme)...');

  const shopName = 'Rhythm & Motion Dance Studio';
  const email = 'admin@rhythmdance.com';

  // 1. Create or Update the Shop
  let shop = await prisma.shop.findFirst({
    where: { name: shopName }
  });

  const shopData = {
    name: shopName,
    companyName: shopName,
    description: 'Experience the vibrant energy, rich colors, and infectious beats of Bollywood. Join our community to learn from industry professionals.',
    timezone: 'America/New_York',
    currency: 'USD',
    shopType: 'PHYSICAL',
    industryType: 'DANCE_STUDIO',
    customization: {
      heroTitle: 'Dance With Passion.',
      address: { street: '404 Bollywood Blvd', city: 'Mumbai West', state: 'CA', zip: '90210' },
      phone: '(555) 867-5309',
      email: 'hello@rhythmdance.com',
      logoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80',
      heroImageUrl: 'https://images.unsplash.com/photo-1537365587684-f490102e1225?auto=format&fit=crop&w=1920&q=80',
      primaryColor: '#ff007f', // Magenta
      secondaryColor: '#ff6b00' // Orange
    }
  };

  if (!shop) {
    shop = await prisma.shop.create({ data: shopData });
    console.log(`Created shop: ${shop.name}`);
  } else {
    // Preserve customHtml if it exists in customization
    const existingCustomization = typeof shop.customization === 'object' ? shop.customization : {};
    shop = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        ...shopData,
        customization: {
          ...(existingCustomization as any),
          ...shopData.customization
        }
      }
    });
    console.log(`Updated shop: ${shop.name}`);
  }

  // 2. Create Admin
  let admin = await prisma.user.findFirst({ where: { email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: 'Priya Sharma',
        email,
        role: 'SHOP_ADMIN',
        shopId: shop.id,
      }
    });
    console.log(`Created admin user: ${admin.email}`);
  }

  const access = await prisma.shopAccess.findFirst({
    where: { userId: admin.id, shopId: shop.id }
  });
  if (!access) {
    await prisma.shopAccess.create({
      data: { userId: admin.id, shopId: shop.id, role: 'SHOP_ADMIN' }
    });
  }

  // 3. Create Instructors (Staff)
  const staffMembers = [
    {
      name: 'Aisha Patel',
      email: 'aisha@rhythmdance.com',
      role: 'STAFF',
      bio: 'Former lead dancer in major Bollywood productions. Specializes in contemporary fusion and expressive storytelling.',
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      jobTitle: 'Lead Choreographer'
    },
    {
      name: 'Rahul Singh',
      email: 'rahul@rhythmdance.com',
      role: 'STAFF',
      bio: 'Master of Bhangra and high-energy folk styles. His classes are a guaranteed intense cardio workout.',
      imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      jobTitle: 'Senior Instructor'
    },
    {
      name: 'Maya Verma',
      email: 'maya@rhythmdance.com',
      role: 'STAFF',
      bio: 'Classically trained in Kathak, Maya brings traditional elegance and intricate footwork to modern routines.',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      jobTitle: 'Classical Expert'
    },
    {
      name: 'Vikram Das',
      email: 'vikram@rhythmdance.com',
      role: 'STAFF',
      bio: 'Street style meets Bollywood. Vikram brings urban grooves and hip-hop influences to the studio.',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      jobTitle: 'Urban Fusion Lead'
    }
  ];

  for (const staff of staffMembers) {
    let existingStaff = await prisma.user.findFirst({
      where: { shopId: shop.id, email: staff.email }
    });
    
    const staffData = {
      name: staff.name,
      imageUrl: staff.imageUrl,
      role: staff.role as any,
      shopId: shop.id,
      isBookable: true,
      employmentType: 'W2' as any
    };

    if (!existingStaff) {
      await prisma.user.create({
        data: { ...staffData, email: staff.email }
      });
      console.log(`Created staff: ${staff.name}`);
    } else {
      await prisma.user.update({
        where: { id: existingStaff.id },
        data: staffData
      });
    }
  }

  // 4. Create Classes (Services)
  const services = [
    { 
      name: 'Bollywood Basics', 
      description: 'Perfect for beginners! Learn the foundational grooves, hand gestures (mudras), and facial expressions that define the Bollywood style.',
      dropInPrice: 25, 
      semesterPrice: 350, 
      duration: 60, 
      maxCapacity: 25, 
      isGroupClass: true 
    },
    { 
      name: 'Bhangra Fitness', 
      description: 'A high-intensity cardio workout set to energetic Punjabi beats. Prepare to sweat and smile through this vigorous folk dance.',
      dropInPrice: 20, 
      semesterPrice: 300, 
      duration: 45, 
      maxCapacity: 30, 
      isGroupClass: true 
    },
    { 
      name: 'Advanced Choreography', 
      description: 'Fast-paced routines from hit movies. Designed for experienced dancers ready to master complex formations and sharp musicality.',
      dropInPrice: 35, 
      semesterPrice: 450, 
      duration: 90, 
      maxCapacity: 15, 
      isGroupClass: true 
    },
    { 
      name: 'Kathak Fusion', 
      description: 'Blend the intricate footwork and spins of classical Kathak with modern contemporary flows. Focus on rhythm and grace.',
      dropInPrice: 30, 
      semesterPrice: 400, 
      duration: 60, 
      maxCapacity: 12, 
      isGroupClass: true 
    }
  ];

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { shopId: shop.id, name: service.name }
    });
    
    const serviceData = {
      name: service.name,
      description: service.description,
      price: service.dropInPrice,
      dropInPrice: service.dropInPrice,
      semesterPrice: service.semesterPrice,
      duration: service.duration,
      maxCapacity: service.maxCapacity,
      isGroupClass: service.isGroupClass,
      isBookable: true,
      type: 'CUSTOMER'
    };

    if (!existing) {
      await prisma.service.create({
        data: { ...serviceData, shopId: shop.id }
      });
      console.log(`Created service: ${service.name}`);
    } else {
      await prisma.service.update({
        where: { id: existing.id },
        data: serviceData
      });
    }
  }

  // 5. Create Reviews
  const reviews = [
    { authorName: 'Neha K.', email: 'neha.k@example.com', rating: 5, comment: "Aisha is an incredible instructor! The energy in her class is unmatched. I've learned so much and look forward to it every week." },
    { authorName: 'Samir J.', email: 'samir.j@example.com', rating: 5, comment: "Bhangra Fitness with Rahul is the best cardio workout I've ever had. You don't even realize you're working out because it's so much fun." },
    { authorName: 'Anjali D.', email: 'anjali.d@example.com', rating: 5, comment: "The studio has such a welcoming vibe. Whether you're a total beginner or a pro, you feel right at home. Highly recommend the Kathak Fusion class." }
  ];

  for (const review of reviews) {
    let client = await prisma.user.findFirst({
      where: { email: review.email }
    });

    if (!client) {
      client = await prisma.user.create({
        data: {
          name: review.authorName,
          email: review.email,
          role: 'CLIENT' as any,
          shopId: shop.id
        }
      });
    }

    const existingReview = await prisma.review.findFirst({
      where: { shopId: shop.id, userId: client.id }
    });

    if (!existingReview) {
      await prisma.review.create({
        data: {
          shopId: shop.id,
          userId: client.id,
          rating: review.rating,
          comment: review.comment
        }
      });
      console.log(`Created review by: ${review.authorName}`);
    }
  }

  console.log('Seed completed successfully!');
  console.log('Login Email: ' + email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
