/**
 * Optional demo data seeder.
 *   npm run seed           → inserts sample products ONLY if the collection is empty
 *   npm run seed -- --force → inserts sample products even if some already exist
 */
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from './models/product.model.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const sampleProducts = [
  {
    name: 'Mechanical Keyboard',
    description: 'Hot-swappable 75% mechanical keyboard with tactile switches, PBT keycaps and per-key RGB lighting.',
    price: 2999,
    category: 'Electronics',
    image: img('photo-1587829741301-dc798b83add3'),
    stock: 12,
  },
  {
    name: 'Wireless Headphones',
    description: 'Over-ear headphones with active noise cancellation, 40-hour battery life and plush memory-foam cushions.',
    price: 4499,
    category: 'Electronics',
    image: img('photo-1505740420928-5e560c06d30e'),
    stock: 8,
  },
  {
    name: 'Ergonomic Mouse',
    description: 'Silent-click wireless mouse with adjustable DPI and a sculpted, all-day comfortable grip.',
    price: 1499,
    category: 'Electronics',
    image: img('photo-1527864550417-7fd91fc51a46'),
    stock: 20,
  },
  {
    name: 'Minimal Analog Watch',
    description: 'Stainless-steel case, sapphire glass and a genuine leather strap. Water resistant to 50m.',
    price: 5999,
    category: 'Fashion',
    image: img('photo-1523275335684-37898b6baf30'),
    stock: 5,
  },
  {
    name: 'Running Sneakers',
    description: 'Lightweight, breathable knit sneakers with responsive cushioning for everyday runs.',
    price: 3299,
    category: 'Fashion',
    image: img('photo-1542291026-7eec264c27ff'),
    stock: 15,
  },
  {
    name: 'Polarised Sunglasses',
    description: 'UV400 polarised lenses in a featherweight acetate frame.',
    price: 1799,
    category: 'Fashion',
    image: img('photo-1572635196237-14b3f281503f'),
    stock: 3,
  },
  {
    name: 'The Pragmatic Programmer',
    description: 'A timeless guide to software craftsmanship — 20th anniversary edition.',
    price: 899,
    category: 'Books',
    image: img('photo-1544947950-fa07a98d237f'),
    stock: 25,
  },
  {
    name: 'Designing Data-Intensive Apps',
    description: 'The big ideas behind reliable, scalable and maintainable systems.',
    price: 1299,
    category: 'Books',
    image: img('photo-1512820790803-83ca734da794'),
    stock: 10,
  },
];

const run = async () => {
  const force = process.argv.includes('--force');

  await mongoose.connect(process.env.MONGO_URI);
  const existing = await Product.countDocuments();

  if (existing > 0 && !force) {
    console.log(`ℹ️  ${existing} products already exist — skipping. Use "npm run seed -- --force" to add samples anyway.`);
  } else {
    const created = await Product.insertMany(sampleProducts);
    console.log(`✅ Inserted ${created.length} sample products.`);
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seeding failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
