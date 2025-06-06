const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const routes = require('./src/routes');
const { initDatabase } = require('./src/models/database');

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    routes: {
      cors: {
        origin: ['*'],
        headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'],
        additionalHeaders: ['X-Requested-With'],
      },
      files: {
        relativeTo: __dirname,
      },
    },
  });

  // Register plugins
  await server.register([Inert]);

  // Initialize database
  await initDatabase();

  // Register routes
  server.route(routes);

  // Error handling
  server.ext('onPreResponse', (request, h) => {
    const response = request.response;

    if (response.isBoom) {
      const error = response;
      const statusCode = error.output.statusCode;

      const newResponse = h
        .response({
          status: 'fail',
          message: error.message,
          ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
        })
        .code(statusCode);

      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
