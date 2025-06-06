const Boom = require('@hapi/boom');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/user');

const register = async (request, h) => {
  try {
    const { username, email, password } = request.payload;

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      throw Boom.conflict('Email sudah terdaftar');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - PERBAIKAN: userId sudah di-generate di dalam createUser
    const userId = await createUser({
      username,
      email,
      password: hashedPassword,
    });

    // PERBAIKAN: Ambil user data yang baru dibuat untuk response
    const newUser = await findUserByEmail(email);

    return h
      .response({
        status: 'success',
        message: 'User berhasil didaftarkan',
        data: {
          userId: newUser.id,
          username: newUser.username,
          email: newUser.email,
        },
      })
      .code(201);
  } catch (error) {
    console.error('Register Error:', error);
    if (error.isBoom) throw error;
    throw Boom.internal('Gagal mendaftarkan user');
  }
};

const login = async (request, h) => {
  try {
    const { email, password } = request.payload;

    // Find user
    const user = await findUserByEmail(email);
    if (!user) {
      throw Boom.unauthorized('Email atau password salah');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw Boom.unauthorized('Email atau password salah');
    }

    // Generate JWT token - PERBAIKAN: gunakan user.id bukan userId
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      },
    );

    return {
      status: 'success',
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    };
  } catch (error) {
    console.error('Login Error:', error);
    if (error.isBoom) throw error;
    throw Boom.internal('Gagal login');
  }
};

module.exports = { register, login };
