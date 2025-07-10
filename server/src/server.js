const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  // TODO: Add database connection logic here in the future
  // e.g., connectToDB().then(() => console.log('Database connected successfully'));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  // Perform cleanup tasks here (e.g., close database connections)
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  // Perform cleanup tasks here
  process.exit(0);
});
