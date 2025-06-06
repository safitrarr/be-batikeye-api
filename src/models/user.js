const { supabase } = require('./database');

const createUser = async (userData) => {
  const { username, email, password } = userData;

  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        username,
        email,
        password,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.id;
};

const findUserByEmail = async (email) => {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

const findUserById = async (id) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
};

module.exports = { createUser, findUserByEmail, findUserById };
