import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/yunax';

console.log(`Connecting to MongoDB at: ${mongoUri}...`);

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully to MongoDB!\n');

    // Dynamically retrieve collections list
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('--- Collections in Database ---');
    if (collections.length === 0) {
      console.log('No collections found. Database might be empty.');
    } else {
      collections.forEach(col => console.log(` - ${col.name}`));
    }
    console.log('\n---------------------------------\n');

    // 1. Users Summary
    const User = mongoose.connection.model('User', new mongoose.Schema({}, { strict: false }), 'users');
    const userCount = await User.countDocuments();
    const users = await User.find({}, 'email name role').lean();
    console.log(`👤 USERS (${userCount} total):`);
    if (users.length > 0) {
      users.forEach(u => {
        console.log(`   - Name: "${u.name || 'N/A'}" | Email: ${u.email} | Role: ${u.role}`);
      });
    } else {
      console.log('   (No users found)');
    }
    console.log('');

    // 2. Products Summary
    const Product = mongoose.connection.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
    const productCount = await Product.countDocuments();
    const products = await Product.find({}, 'name priceCents category stock').limit(5).lean();
    console.log(`📦 PRODUCTS (${productCount} total):`);
    if (products.length > 0) {
      console.log('   Sample products:');
      products.forEach(p => {
        const price = (p.priceCents / 100).toFixed(2);
        console.log(`   - ${p.name} (Category: ${p.category || 'N/A'}, Price: ₹${price}, Stock: ${p.stock})`);
      });
      if (productCount > 5) {
        console.log(`   - ... and ${productCount - 5} more products.`);
      }
    } else {
      console.log('   (No products found)');
    }
    console.log('');

    // 3. Orders Summary
    const Order = mongoose.connection.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');
    const orderCount = await Order.countDocuments();
    const orders = await Order.find({}, 'customerName totalCents status paymentMethod').limit(5).lean();
    console.log(`🛒 ORDERS (${orderCount} total):`);
    if (orders.length > 0) {
      console.log('   Recent orders:');
      orders.forEach(o => {
        const total = (o.totalCents / 100).toFixed(2);
        console.log(`   - Customer: ${o.customerName || 'N/A'} | Total: ₹${total} | Status: ${o.status} | Payment: ${o.paymentMethod}`);
      });
      if (orderCount > 5) {
        console.log(`   - ... and ${orderCount - 5} more orders.`);
      }
    } else {
      console.log('   (No orders placed yet)');
    }
    console.log('');

    // 4. Contact Messages Summary
    const ContactMessage = mongoose.connection.model('ContactMessage', new mongoose.Schema({}, { strict: false }), 'contactmessages');
    const messageCount = await ContactMessage.countDocuments();
    const messages = await ContactMessage.find({}, 'name email subject status').limit(5).lean();
    console.log(`💬 CONTACT MESSAGES (${messageCount} total):`);
    if (messages.length > 0) {
      console.log('   Recent contact requests:');
      messages.forEach(m => {
        console.log(`   - From: ${m.name} (${m.email}) | Subject: "${m.subject}" | Status: ${m.status}`);
      });
      if (messageCount > 5) {
        console.log(`   - ... and ${messageCount - 5} more messages.`);
      }
    } else {
      console.log('   (No messages received yet)');
    }

  } catch (error) {
    console.error('❌ Error reading MongoDB:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

run();
