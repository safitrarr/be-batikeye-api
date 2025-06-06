const Boom = require('@hapi/boom');
const jwt = require('jsonwebtoken');
const { findUserById } = require('../models/user');

const authenticate = async (request, h) => {
  try {
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw Boom.unauthorized('Token tidak ditemukan');
    }

    const token = authorization.split(' ')[1];
    if (!token) {
      throw Boom.unauthorized('Format token tidak valid');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // PERBAIKAN: Verifikasi apakah user masih ada di database
    const user = await findUserById(decoded.userId);
    if (!user) {
      throw Boom.unauthorized('User tidak ditemukan');
    }

    // PERBAIKAN: Return user data lengkap untuk digunakan di handler
    return {
      userId: user.id,
      email: user.email,
      username: user.username,
    };
  } catch (error) {
    console.error('Auth Middleware Error:', error);

    if (error.name === 'JsonWebTokenError') {
      throw Boom.unauthorized('Token tidak valid');
    }
    if (error.name === 'TokenExpiredError') {
      throw Boom.unauthorized('Token sudah expired');
    }
    if (error.isBoom) {
      throw error;
    }

    throw Boom.unauthorized('Unauthorized');
  }
};

module.exports = { authenticate };
