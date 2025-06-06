// src/handlers/history.js
const Boom = require('@hapi/boom');
const {
  getUserPredictions,
  deletePredictionById,
  findPredictionById,
} = require('../models/prediction');
const fs = require('fs-extra');
const path = require('path');

const getHistory = async (request, h) => {
  try {
    const userId = request.pre.user.userId;
    const { page, limit, sort, order } = request.query;

    const offset = (page - 1) * limit;
    const { predictions, total } = await getUserPredictions(userId, {
      limit,
      offset,
      sort,
      order,
    });

    const formattedPredictions = predictions.map((prediction) => ({
      id: prediction.id,
      predictedClass: prediction.predicted_class,
      confidence: prediction.confidence,
      imageUrl: `${request.server.info.uri}/uploads/${prediction.image_path}`,
      createdAt: prediction.created_at,
      metadata: {
        originalFilename: prediction.original_filename,
        imageSize: prediction.image_size,
      },
    }));

    return {
      status: 'success',
      data: {
        predictions: formattedPredictions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    console.error('Get History Error:', error);
    if (error.isBoom) throw error;
    throw Boom.internal('Gagal mengambil riwayat prediksi');
  }
};

const deleteHistory = async (request, h) => {
  try {
    const { id } = request.params;
    const userId = request.pre.user.userId;

    const prediction = await findPredictionById(id, userId);
    if (!prediction) {
      throw Boom.notFound('Prediksi tidak ditemukan');
    }

    // Delete image file
    const imagePath = path.join(__dirname, '../../uploads', prediction.image_path);
    await fs.remove(imagePath).catch(() => {}); // Ignore if file doesn't exist

    // Delete from database
    const deletedCount = await deletePredictionById(id, userId);

    if (deletedCount === 0) {
      throw Boom.notFound('Prediksi tidak ditemukan');
    }

    return h
      .response({
        status: 'success',
        message: 'Riwayat prediksi berhasil dihapus',
      })
      .code(200);
  } catch (error) {
    console.error('Delete History Error:', error);
    if (error.isBoom) throw error;
    throw Boom.internal('Gagal menghapus riwayat prediksi');
  }
};

module.exports = { getHistory, deleteHistory };
