import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import methodOverride from 'method-override';
import { connectDB } from './src/config/database.js';


import routes from './src/routes/index.route.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Connect to database with error handling
connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

console.log('✅ Express app initialized');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(methodOverride('_method'));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success;
  res.locals.error = req.session.error;
  delete req.session.success;
  delete req.session.error;
  next();
});

console.log('✅ Middleware configured');

app.use('/', routes);

console.log('✅ Routes loaded');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});