const { supabase } = require('./database');

const savePrediction = async (predictionData) => {
  const {
    userId,
    imagePath,
    processedImagePath,
    predictedClass,
    confidence,
    allPredictions,
    imageSize,
    originalFilename,
  } = predictionData;

  const { data, error } = await supabase
    .from('predictions')
    .insert([
      {
        user_id: userId,
        image_path: imagePath,
        processed_image_path: processedImagePath,
        predicted_class: predictedClass,
        confidence,
        all_predictions: JSON.parse(allPredictions),
        image_size: imageSize,
        original_filename: originalFilename,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.id;
};

const findPredictionById = async (id, userId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

const getUserPredictions = async (userId, options = {}) => {
  const { limit = 10, offset = 0, sort = 'created_at', order = 'desc' } = options;

  // Build query
  let query = supabase
    .from('predictions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order(sort, { ascending: order === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    predictions: data || [],
    total: count || 0,
  };
};

const deletePredictionById = async (id, userId) => {
  const { data, error } = await supabase
    .from('predictions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select();

  if (error) {
    throw error;
  }

  return data.length;
};

module.exports = {
  savePrediction,
  findPredictionById,
  getUserPredictions,
  deletePredictionById,
};
