const Joi = require('@hapi/joi');
const { predictBatik, getPredictionById } = require('../handlers/prediction');
const { authenticate } = require('../middleware/auth');

module.exports = [
  {
    method: 'POST',
    path: '/api/predict',
    handler: predictBatik,
    options: {
      pre: [{ method: authenticate }],
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        multipart: true,
        maxBytes: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
      },
      validate: {
        payload: Joi.object({
          image: Joi.any().required().description('Gambar batik untuk diprediksi'),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/api/predictions/{id}',
    handler: getPredictionById,
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
