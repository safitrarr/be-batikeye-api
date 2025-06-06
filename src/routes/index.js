const authRoutes = require('./auth');
const predictionRoutes = require('./prediction');
const historyRoutes = require('./history');

module.exports = [
  // Health check
  {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      return {
        status: 'success',
        message: 'Batik Detection API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      };
    },
  },

  // Static files
  {
    method: 'GET',
    path: '/uploads/{param*}',
    handler: {
      directory: {
        path: './uploads',
        redirectToSlash: true,
      },
    },
  },

  ...authRoutes,
  ...predictionRoutes,
  ...historyRoutes,
];
