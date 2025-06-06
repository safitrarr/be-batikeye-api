// src/handlers/prediction.js
const Boom = require('@hapi/boom');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const FormData = require('form-data');
const axios = require('axios');
const { savePrediction, findPredictionById } = require('../models/prediction');

const predictBatik = async (request, h) => {
  try {
    const { image } = request.payload;
    const userId = request.pre.user.userId;

    if (!image) {
      throw Boom.badRequest('Gambar harus diupload');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(image.hapi.headers['content-type'])) {
      throw Boom.badRequest('Format file tidak didukung. Hanya JPG, JPEG, dan PNG yang diizinkan');
    }

    // Generate unique filename
    const fileId = uuidv4();
    const fileExtension = path.extname(image.hapi.filename);
    const filename = `${fileId}${fileExtension}`;
    const filepath = path.join(__dirname, '../../uploads', filename);

    // Ensure uploads directory exists
    await fs.ensureDir(path.dirname(filepath));

    // Save uploaded file
    const fileStream = fs.createWriteStream(filepath);
    image.pipe(fileStream);

    await new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    // Process image with Sharp (resize, optimize)
    const processedImagePath = path.join(__dirname, '../../uploads', `processed_${filename}`);
    await sharp(filepath)
      .resize(224, 224) // Resize untuk model ML
      .jpeg({ quality: 90 })
      .toFile(processedImagePath);

    // Send to ML model
    const formData = new FormData();
    formData.append('image', fs.createReadStream(processedImagePath));

    let mlResponse;
    try {
      mlResponse = await axios.post(process.env.ML_MODEL_URL, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000,
      });
    } catch (mlError) {
      console.error('ML Model Error:', mlError.message);
      throw Boom.serviceUnavailable('Model ML tidak dapat diakses');
    }

    const prediction = mlResponse.data;

    // Save prediction to database
    const predictionData = {
      userId,
      imagePath: filename,
      processedImagePath: `processed_${filename}`,
      predictedClass: prediction.predicted_class,
      confidence: prediction.confidence,
      allPredictions: JSON.stringify(prediction.all_predictions || []),
      imageSize: fs.statSync(filepath).size,
      originalFilename: image.hapi.filename,
    };

    const predictionId = await savePrediction(predictionData);

    // Clean up processed image
    await fs.remove(processedImagePath);

    const response = {
      status: 'success',
      message: 'Prediksi berhasil dilakukan',
      data: {
        id: predictionId,
        predictedClass: prediction.predicted_class,
        confidence: prediction.confidence,
        allPredictions: prediction.all_predictions || [],
        imageUrl: `${request.server.info.uri}/uploads/${filename}`,
        createdAt: new Date().toISOString(),
        metadata: {
          originalFilename: image.hapi.filename,
          imageSize: predictionData.imageSize,
          processingTime: prediction.processing_time || null,
        },
      },
    };

    return h.response(response).code(201);
  } catch (error) {
    console.error('Prediction Error:', error);
    if (error.isBoom) throw error;
    throw Boom.internal('Gagal melakukan prediksi');
  }
};

const getPredictionById = async (request, h) => {
  try {
    const { id } = request.params;
    const userId = request.pre.user.userId;

    const prediction = await findPredictionById(id, userId);

    if (!prediction) {
      throw Boom.notFound('Prediksi tidak ditemukan');
    }

    return {
      status: 'success',
      data: {
        id: prediction.id,
        predictedClass: prediction.predicted_class,
        confidence: prediction.confidence,
        allPredictions: prediction.all_predictions || [],
        imageUrl: `${request.server.info.uri}/uploads/${prediction.image_path}`,
        createdAt: prediction.created_at,
        metadata: {
          originalFilename: prediction.original_filename,
          imageSize: prediction.image_size,
        },
      },
    };
  } catch (error) {
    console.error('Get Prediction Error:', error);
    if (error.isBoom) throw error;
    throw Boom.internal('Gagal mengambil data prediksi');
  }
};

module.exports = { predictBatik, getPredictionById };
