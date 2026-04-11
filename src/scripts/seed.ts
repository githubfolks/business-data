import { prisma } from '../db/prisma';
import { connectDatabase } from '../db';

const sampleBusinesses = [
  // Barbershops in New York
  {
    external_id: 'barbar_shop_ny_1',
    provider: 'custom',
    name: 'Tony\'s Barbershop',
    description: 'Classic barbershop with experienced barbers in the heart of Manhattan',
    category: 'Barbershop',
    subcategories: ['Personal Care', 'Hair'],
    street: '123 5th Avenue',
    city: 'New York',
    state: 'NY',
    postal_code: '10001',
    country: 'USA',
    latitude: 40.7128,
    longitude: -74.0060,
    phone_numbers: ['+1-212-555-0101'],
    website: 'https://tonybarbershop.com',
    email: 'tony@barbershop.com',
    rating: 4.7,
    review_count: 250,
    verified: true,
    status: 'active',
    attributes: {
      price_level: 2,
      appointments: true,
      walk_ins: true,
    },
    search_text: 'Tony Barbershop barber haircut New York Manhattan',
  },
  {
    external_id: 'barbar_shop_ny_2',
    provider: 'custom',
    name: 'Brooklyn Barbershop NYC',
    description: 'Modern barbershop with professional stylists',
    category: 'Barbershop',
    subcategories: ['Personal Care', 'Hair'],
    street: '456 Bedford Avenue',
    city: 'New York',
    state: 'NY',
    postal_code: '11211',
    country: 'USA',
    latitude: 40.7155,
    longitude: -73.9567,
    phone_numbers: ['+1-718-555-0102'],
    website: 'https://brooklynbarbershop.com',
    rating: 4.8,
    review_count: 320,
    verified: true,
    status: 'active',
    attributes: {
      price_level: 2,
      appointments: true,
      styling: true,
    },
    search_text: 'Brooklyn Barbershop NYC barber haircut New York',
  },
  {
    external_id: 'barbar_shop_ny_3',
    provider: 'custom',
    name: 'Upper West Barbers',
    description: 'Premium barbershop with classic styling',
    category: 'Barbershop',
    subcategories: ['Personal Care', 'Hair'],
    street: '789 Amsterdam Avenue',
    city: 'New York',
    state: 'NY',
    postal_code: '10025',
    country: 'USA',
    latitude: 40.7865,
    longitude: -73.9766,
    phone_numbers: ['+1-212-555-0103'],
    website: 'https://upperwestbarbers.com',
    rating: 4.6,
    review_count: 180,
    verified: true,
    status: 'active',
    attributes: {
      price_level: 3,
      appointments: true,
      walk_ins: false,
    },
    search_text: 'Upper West Barbers New York Manhattan premium classic',
  },
  // Coffee Shop
  {
    external_id: 'coffee_shop_sf_1',
    provider: 'custom',
    name: 'The Daily Brew',
    description: 'Artisanal coffee shop with specialty blends',
    category: 'Coffee Shop',
    subcategories: ['Food & Beverage', 'Cafe'],
    street: '234 Market Street',
    city: 'San Francisco',
    state: 'CA',
    postal_code: '94102',
    country: 'USA',
    latitude: 37.7849,
    longitude: -122.3995,
    phone_numbers: ['+1-415-555-0201'],
    website: 'https://thedailybrew.com',
    rating: 4.5,
    review_count: 450,
    verified: true,
    status: 'active',
    attributes: {
      price_level: 2,
      wifi: true,
      seating: 'indoor',
    },
    search_text: 'The Daily Brew coffee shop cafe San Francisco',
  },
  // Restaurant
  {
    external_id: 'restaurant_ny_1',
    provider: 'custom',
    name: 'Manhattan Bistro',
    description: 'Fine French dining in the heart of New York',
    category: 'Restaurant',
    subcategories: ['Food & Beverage', 'Dining'],
    street: '567 Park Avenue',
    city: 'New York',
    state: 'NY',
    postal_code: '10022',
    country: 'USA',
    latitude: 40.7614,
    longitude: -73.9776,
    phone_numbers: ['+1-212-555-0301'],
    website: 'https://manhattanbistro.com',
    rating: 4.9,
    review_count: 600,
    verified: true,
    status: 'active',
    attributes: {
      price_level: 4,
      reservations: true,
      cuisine: 'French',
    },
    search_text: 'Manhattan Bistro restaurant dining French New York',
  },
  // Fitness Centers
  {
    external_id: 'fitness_la_1',
    provider: 'custom',
    name: 'FitLife Gym',
    description: 'Modern fitness center with state-of-the-art equipment',
    category: 'Fitness',
    subcategories: ['Gym', 'Health'],
    street: '567 Sunset Boulevard',
    city: 'Los Angeles',
    state: 'CA',
    postal_code: '90028',
    country: 'USA',
    latitude: 34.0928,
    longitude: -118.3287,
    phone_numbers: ['+1-323-555-0401'],
    website: 'https://fitlifegym.com',
    rating: 4.4,
    review_count: 200,
    verified: true,
    status: 'active',
    attributes: {
      price_level: 2,
      membership: true,
      facilities: ['gym', 'yoga', 'pool'],
    },
    search_text: 'FitLife Gym fitness health Los Angeles',
  },
];

async function seedDatabase(): Promise<void> {
  try {
    await connectDatabase();

    console.log('Clearing existing data...');
    await prisma.business.deleteMany({});

    console.log('Seeding database with sample businesses...');

    // Create businesses directly
    const results = await Promise.all(
      sampleBusinesses.map((business: any) =>
        prisma.business.create({
          data: {
            external_id: business.external_id,
            name: business.name,
            description: business.description,
            category: business.category,
            subcategories: business.subcategories,
            street: business.street,
            city: business.city,
            state: business.state,
            postal_code: business.postal_code,
            country: business.country,
            latitude: business.latitude,
            longitude: business.longitude,
            phone_numbers: business.phone_numbers,
            website: business.website,
            email: business.email,
            rating: business.rating,
            review_count: business.review_count,
            verified: business.verified,
            status: business.status,
            attributes: business.attributes,
            search_text: business.search_text,
            provider: business.provider,
            source_data: business,
          },
        })
      )
    );

    console.log(`Successfully seeded ${results.length} businesses`);
    console.log('Sample businesses created');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
