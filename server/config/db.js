// server/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => { // This is the function
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 6+ options are default
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; // <<< THIS IS THE CRUCIAL LINE
                           // Make sure you are exporting the function itself,
                           // NOT an object like { connectDB } unless you intend to destructure it on import.