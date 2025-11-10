export default {
  app: {
    name: 'Email Classification System',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
  },

  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  session: {
    secret: process.env.SESSION_SECRET,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE,
  },

  pythonML: {
    url: process.env.PYTHON_ML_URL,
    apiKey: process.env.PYTHON_ML_API_KEY,
  },

  email: {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
  },

  upload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE),
    path: process.env.UPLOAD_PATH,
  },

  pagination: {
    pageSize: parseInt(process.env.PAGE_SIZE) || 20,
  },
};