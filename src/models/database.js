require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const initDatabase = async () => {
  try {
    // Test connection
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (error && error.code === 'PGRST116') {
      console.log('Tables need to be created in Supabase dashboard');
      console.log('Please run the SQL migrations in your Supabase SQL editor');
    } else if (error) {
      throw error;
    }

    console.log('Supabase connection established');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error.message);
    throw error;
  }
};

module.exports = { supabase, initDatabase };
