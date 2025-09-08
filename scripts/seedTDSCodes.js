const mongoose = require('mongoose');
const { seedTDSCodes } = require('../src/seeders/tdsCodeSeeder');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const runSeeder = async () => {
  try {
    await connectDB();
    await seedTDSCodes();
    console.log('TDS codes seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding TDS codes:', error);
    process.exit(1);
  }
};

runSeeder();
