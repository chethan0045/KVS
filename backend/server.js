const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('./db/database');

const authRoutes = require('./routes/auth');
const { authMiddleware } = require('./middleware/auth');
const productionRoutes = require('./routes/production');
const kilnLoadingRoutes = require('./routes/kiln-loading');
const kilnManufactureRoutes = require('./routes/kiln-manufacture');
const brickSaleRoutes = require('./routes/brick-sale');
const dashboardRoutes = require('./routes/dashboard');
const employeeRoutes = require('./routes/employee');
const wagesReportRoutes = require('./routes/wages-report');
const customerRoutes = require('./routes/customer');
const huskLoadRoutes = require('./routes/husk-load');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Auth routes (public - no middleware)
app.use('/api/auth', authRoutes);

// Protected routes (require JWT)
app.use('/api/productions', authMiddleware, productionRoutes);
app.use('/api/kiln-loadings', authMiddleware, kilnLoadingRoutes);
app.use('/api/kiln-manufactures', authMiddleware, kilnManufactureRoutes);
app.use('/api/brick-sales', authMiddleware, brickSaleRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/employees', authMiddleware, employeeRoutes);
app.use('/api/wages-report', authMiddleware, wagesReportRoutes);
app.use('/api/customers', authMiddleware, customerRoutes);
app.use('/api/husk-loads', authMiddleware, huskLoadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve Angular frontend (production build)
const fs = require('fs');
const distBase = path.join(__dirname, '..', 'frontend', 'dist', 'bricks-management-system');
const frontendPath = fs.existsSync(path.join(distBase, 'browser'))
  ? path.join(distBase, 'browser')
  : distBase;

console.log('Frontend path:', frontendPath);
console.log('Frontend exists:', fs.existsSync(frontendPath));

app.use(express.static(frontendPath));
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Frontend not built. index.html not found at: ' + indexPath);
  }
});

// Log MongoDB connection status
mongoose.connection.once('open', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Start server immediately (don't wait for MongoDB)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
