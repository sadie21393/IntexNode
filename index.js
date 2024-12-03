// Import required modules
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');
require('dotenv').config(); // Load environment variables from .env file

// Create an Express app
const app = express();
const port = 3000;

// Set up PostgreSQL database connection using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: process.env.SECRET_KEY || 'default_secret', // Fallback if SECRET_KEY is not provided
    resave: false,
    saveUninitialized: false,
  })
);

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
// Landing page (anonymous users)
app.get('/', (req, res) => {
  res.render('index', { title: 'Turtle Shelter Project' });
});

// Event request form
app.get('/event-request', (req, res) => {
  res.render('event-request');
});

app.post('/event-request', async (req, res) => {
  const { attendees, eventType, date, address, time, contactName, contactPhone } = req.body;
  try {
    await pool.query(
      'INSERT INTO event_requests (attendees, event_type, date, address, time, contact_name, contact_phone) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [attendees, eventType, date, address, time, contactName, contactPhone]
    );
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error submitting event request.');
  }
});

// Volunteer form
app.get('/volunteer', (req, res) => {
  res.render('volunteer');
});

app.post('/volunteer', async (req, res) => {
  const { contactInfo, heardAbout, sewingLevel, hours } = req.body;
  try {
    await pool.query(
      'INSERT INTO volunteers (contact_info, heard_about, sewing_level, hours) VALUES ($1, $2, $3, $4)',
      [contactInfo, heardAbout, sewingLevel, hours]
    );
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error submitting volunteer form.');
  }
});

// Admin dashboard (requires login)
app.get('/admin', (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/login');
  }
  res.render('admin');
});

// Login route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Replace this with your authentication logic
  if (username === 'admin' && password === 'password') {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.status(401).send('Unauthorized');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
