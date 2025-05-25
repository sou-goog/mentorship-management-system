// 1. Import necessary modules
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const progressUpdateRoutes = require('./routes/progressUpdateRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware'); // Import error middleware

// 2. Initialize Express app
const app = express();

// 3. Connect to Database
connectDB();

// 4. Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 5. Basic Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is up and running! Hello from the backend!' });
});

// 6. Mount Routers
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes); 
app.use('/api/attendance', attendanceRoutes);
app.use('/api/mentees/:menteeId/progress-updates', progressUpdateRoutes);

// 7. Error Handling Middleware (MUST be after API routes)
app.use(notFound); // Handles 404 - routes not found
app.use(errorHandler); // Handles all other errors

// 8. Define PORT and Start Server (was 7)
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});