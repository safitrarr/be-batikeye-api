const Joi = require('@hapi/joi');
const { register, login } = require('../handlers/auth');

module.exports = [
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: register,
    options: {
      validate: {
        payload: Joi.object({
          username: Joi.string().alphanum().min(3).max(30).required(),
          email: Joi.string().email().required(),
          password: Joi.string().min(6).required(),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: login,
    options: {
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().required(),
        }),
      },
    },
  },
];
