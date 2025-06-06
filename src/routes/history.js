const Joi = require('@hapi/joi');
const { getHistory, deleteHistory } = require('../handlers/history');
const { authenticate } = require('../middleware/auth');

module.exports = [
  {
    method: 'GET',
    path: '/api/history',
    handler: getHistory,
    options: {
      pre: [{ method: authenticate }],
      validate: {
        query: Joi.object({
          page: Joi.number().integer().min(1).default(1),
          limit: Joi.number().integer().min(1).max(100).default(10),
          sort: Joi.string().valid('created_at', 'confidence').default('created_at'),
          order: Joi.string().valid('asc', 'desc').default('desc'),
        }),
      },
    },
  },
  {
    method: 'DELETE',
    path: '/api/history/{id}',
    handler: deleteHistory,
    options: {
      pre: [{ method: authenticate }],
      validate: {
        params: Joi.object({
          id: Joi.string().uuid().required(),
        }),
      },
    },
  },
];
