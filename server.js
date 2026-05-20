const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const openai = require('openai');
const multer = require('multer');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';

// Initialize OpenAI (in production, use environment variable for API key)
const openaiClient = new openai.OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here' // Replace with actual key
});

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database setup
const db = new sqlite3.Database('./database.db');

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    resume_path TEXT,
    role TEXT DEFAULT 'user',
    phone TEXT,
    address TEXT,
    education TEXT,
    experience TEXT,
    skills TEXT,
    linkedin TEXT,
    website TEXT,
    bio TEXT,
    current_position TEXT,
    institution TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    university TEXT,
    location TEXT,
    salary TEXT,
    description TEXT,
    requirements TEXT,
    category TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_id INTEGER,
    resume_path TEXT,
    status TEXT DEFAULT 'pending',
    shortlisted_field TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS favorited_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER,
    status TEXT DEFAULT 'ongoing',
    score REAL DEFAULT 0,
    FOREIGN KEY (application_id) REFERENCES applications(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS custom_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER,
    question TEXT NOT NULL,
    category TEXT,
    difficulty TEXT DEFAULT 'medium',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS interview_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_id INTEGER,
    session_type TEXT DEFAULT 'practice',
    total_questions INTEGER DEFAULT 0,
    completed_questions INTEGER DEFAULT 0,
    total_score REAL DEFAULT 0,
    average_score REAL DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS interview_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER,
    question TEXT,
    answer TEXT,
    score REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS interview_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER,
    question_id INTEGER,
    question_text TEXT,
    user_answer TEXT,
    ai_score REAL,
    feedback TEXT,
    response_time INTEGER,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    token TEXT UNIQUE,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS form_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    form_name TEXT,
    route TEXT,
    form_data TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  // Insert sample jobs
  db.run(`INSERT OR IGNORE INTO jobs (title, university, location, salary, description, requirements, category) VALUES
    ('Professor - AI', 'MIT', 'USA', '$200k', 'Teaching AI courses and conducting research', 'PhD in AI, 5+ years experience', 'Computer Science'),
    ('Assistant Professor - Data Science', 'Stanford', 'USA', '$150k', 'Data Science teaching and research', 'PhD in Data Science', 'Data Science'),
    ('Lecturer - Computer Science', 'Harvard', 'USA', '$120k', 'CS fundamentals teaching', 'Masters in CS', 'Computer Science'),
    ('Research Professor - Machine Learning', 'Berkeley', 'USA', '$180k', 'ML research and publications', 'PhD in ML, publications', 'Machine Learning'),
    ('Associate Professor - Cybersecurity', 'Caltech', 'USA', '$170k', 'Cybersecurity courses and labs', 'PhD in Cybersecurity', 'Cybersecurity'),
    ('Professor - Software Engineering', 'CMU', 'USA', '$190k', 'Software engineering education', 'PhD in SE, industry experience', 'Software Engineering'),
    ('Assistant Professor - Robotics', 'MIT', 'USA', '$160k', 'Robotics research and teaching', 'PhD in Robotics', 'Engineering'),
    ('Lecturer - Mathematics', 'Princeton', 'USA', '$110k', 'Advanced mathematics courses', 'PhD in Mathematics', 'Mathematics')`);

  db.all("PRAGMA table_info(applications)", (err, columns) => {
    if (!err && !columns.some(column => column.name === 'shortlisted_field')) {
      db.run('ALTER TABLE applications ADD COLUMN shortlisted_field TEXT');
    }
  });

  // Ensure users table has a resume_review_status column to track admin review state
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (!err && !columns.some(column => column.name === 'resume_review_status')) {
      db.run("ALTER TABLE users ADD COLUMN resume_review_status TEXT");
    }
  });

  // Create admin user
  bcrypt.hash('admin123', 10, (err, hash) => {
    db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES ('Admin', 'admin@academiapro.com', ?, 'admin')`, [hash]);
  });
});

// Middleware to verify JWT and load full user data
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.redirect('/login');
    db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
      if (err || !user) return res.redirect('/login');
      req.user = user;
      next();
    });
  });
}

function sanitizeForHistory(body) {
  const safe = {};
  const excludedKeys = ['password', 'confirm_password', 'current_password', 'new_password', 'idToken', 'token'];
  Object.keys(body || {}).forEach((key) => {
    if (!excludedKeys.includes(key)) {
      safe[key] = body[key];
    }
  });
  return safe;
}

function saveFormHistory(req, formName) {
  const formData = sanitizeForHistory(req.body);
  const jsonData = JSON.stringify(formData);
  const ip = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '';
  const userId = req.user ? req.user.id : null;
  db.run(
    'INSERT INTO form_history (user_id, form_name, route, form_data, ip_address) VALUES (?, ?, ?, ?, ?)',
    [userId, formName, req.originalUrl, jsonData, ip],
    (err) => {
      if (err) console.error('Failed to save form history:', err);
    }
  );
}

app.use((req, res, next) => {
  if (req.method === 'POST') {
    const formName = req.body && req.body.form_name ? req.body.form_name : req.path;
    saveFormHistory(req, formName);
  }
  next();
});

// Routes
app.get('/', (req, res) => {
  db.all('SELECT * FROM jobs LIMIT 4', [], (err, jobs) => {
    res.render('index', { jobs });
  });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null, info: null });
});

app.post('/login', (req, res) => {
  const { email, password, remember } = req.body;
  if (!email || !password) {
    return res.render('login', { error: 'Please enter both email and password.', info: null });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).send('Server error');
    if (!user) return res.render('login', { error: 'No account found with that email.', info: null });
    if (!user.password) return res.render('login', { error: 'Please sign in with Google or reset your password.', info: null });

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) return res.status(500).send('Server error');
      if (!result) return res.render('login', { error: 'Incorrect password. Please try again.', info: null });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
      const cookieOptions = {};
      if (remember === 'on') {
        cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      }
      res.cookie('token', token, cookieOptions);
      res.redirect('/dashboard');
    });
  });
});

app.get('/auth/google', (req, res) => {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
    '?response_type=code' +
    `&client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
    '&scope=openid%20email%20profile' +
    '&prompt=select_account';
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/login');

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Google token error:', tokenData);
      return res.status(500).send('Google sign-in failed');
    }

    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser = await userInfoResponse.json();
    if (!userInfoResponse.ok) {
      console.error('Google user info error:', googleUser);
      return res.status(500).send('Google sign-in failed');
    }

    const email = googleUser.email;
    if (!email) return res.status(500).send('Google account did not return email');

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).send('Database error');
      const name = googleUser.name || email.split('@')[0];
      if (user) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
        res.cookie('token', token);
        return res.redirect('/dashboard');
      }

      db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, null, 'user'], function (err) {
        if (err) {
          console.error('Google user creation error:', err);
          return res.status(500).send('Error creating user account');
        }
        const userId = this.lastID;
        const token = jwt.sign({ id: userId, email, role: 'user' }, SECRET_KEY);
        res.cookie('token', token);
        res.redirect('/dashboard');
      });
    });
  } catch (error) {
    console.error('Google auth exception:', error);
    res.status(500).send('Google sign-in failed');
  }
});

app.post('/auth/google-firebase', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).send('Missing Firebase ID token');

  try {
    const verifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    const tokenInfo = await verifyResponse.json();

    if (!verifyResponse.ok) {
      console.error('Firebase token verification failed:', tokenInfo);
      return res.status(400).send('Invalid Firebase token');
    }

    if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your-google-client-id' && tokenInfo.aud !== GOOGLE_CLIENT_ID) {
      console.error('Firebase token audience mismatch:', tokenInfo.aud, 'expected', GOOGLE_CLIENT_ID);
      return res.status(400).send('Token audience mismatch');
    }
    if (tokenInfo.iss !== 'https://accounts.google.com' && tokenInfo.iss !== 'accounts.google.com') {
      console.error('Invalid token issuer:', tokenInfo.iss);
      return res.status(400).send('Invalid token issuer');
    }

    const email = tokenInfo.email;
    const name = tokenInfo.name || email.split('@')[0];
    if (!email) {
      return res.status(400).send('Firebase token did not return an email');
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).send('Database error');
      if (user) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
        res.cookie('token', token);
        return res.json({ success: true });
      }

      db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, null, 'user'], function (err) {
        if (err) {
          console.error('Google Firebase user creation error:', err);
          return res.status(500).send('Error creating user account');
        }
        const userId = this.lastID;
        const token = jwt.sign({ id: userId, email, role: 'user' }, SECRET_KEY);
        res.cookie('token', token);
        res.json({ success: true });
      });
    });
  } catch (error) {
    console.error('Firebase auth exception:', error);
    res.status(500).send('Firebase sign-in failed');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/reset', (req, res) => {
  res.render('reset', { error: null, info: null });
});

app.post('/reset-request', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.render('reset', { error: 'Please enter your email address.', info: null });
  }

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).send('Server error');
    if (!user) return res.render('reset', { error: 'No account found with that email.', info: null });

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    db.run('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, token, expiresAt], (err) => {
      if (err) return res.status(500).send('Server error');
      const resetLink = `${req.protocol}://${req.get('host')}/reset/${token}`;
      // In production, send resetLink via email.
      return res.render('reset', { error: null, info: `A password reset link has been generated. Use this link to complete your reset: ${resetLink}` });
    });
  });
});

app.post('/reset-manual', (req, res) => {
  const { email, password, confirm_password } = req.body;
  if (!email || !password || !confirm_password) {
    return res.render('reset', { error: 'Please fill in all fields for manual reset.', info: null });
  }
  if (password !== confirm_password) {
    return res.render('reset', { error: 'Passwords do not match.', info: null });
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.render('reset', { error: 'Password must be at least 8 characters long and include a number and uppercase letter.', info: null });
  }

  db.get('SELECT id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).send('Server error');
    if (!user) return res.render('reset', { error: 'No account found with that email.', info: null });

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).send('Server error');
      db.run('UPDATE users SET password = ? WHERE id = ?', [hash, user.id], (err) => {
        if (err) return res.status(500).send('Server error');
        return res.render('reset', { error: null, info: 'Your password has been reset successfully. You can now log in.' });
      });
    });
  });
});

app.get('/reset/:token', (req, res) => {
  const { token } = req.params;
  db.get('SELECT * FROM password_resets WHERE token = ?', [token], (err, row) => {
    if (err) return res.status(500).send('Server error');
    if (!row || new Date(row.expires_at) < new Date()) {
      return res.render('reset', { error: 'This reset link is invalid or has expired.', info: null });
    }
    res.render('reset-password', { error: null, info: null, email: row.email, token });
  });
});

app.post('/reset/:token', (req, res) => {
  const { token } = req.params;
  const { password, confirm_password } = req.body;
  if (!password || !confirm_password) {
    return res.render('reset-password', { error: 'Please fill out both password fields.', info: null, email: req.body.email, token });
  }
  if (password !== confirm_password) {
    return res.render('reset-password', { error: 'Passwords do not match.', info: null, email: req.body.email, token });
  }
  if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.render('reset-password', { error: 'Password must be at least 8 characters long and include a number and uppercase letter.', info: null, email: req.body.email, token });
  }

  db.get('SELECT * FROM password_resets WHERE token = ?', [token], (err, row) => {
    if (err) return res.status(500).send('Server error');
    if (!row || new Date(row.expires_at) < new Date()) {
      return res.render('reset', { error: 'This reset link is invalid or has expired.', info: null });
    }

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).send('Server error');
      db.run('UPDATE users SET password = ? WHERE email = ?', [hash, row.email], (err) => {
        if (err) return res.status(500).send('Server error');
        db.run('DELETE FROM password_resets WHERE token = ?', [token], (err) => {
          if (err) console.error('Password reset cleanup failed:', err);
          res.redirect('/login');
        });
      });
    });
  });
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

app.get('/dashboard', verifyToken, (req, res) => {
  // Get user statistics
  db.get('SELECT COUNT(*) as application_count FROM applications WHERE user_id = ?', [req.user.id], (err, appStats) => {
    db.get('SELECT COUNT(*) as interview_count FROM interviews i JOIN applications a ON i.application_id = a.id WHERE a.user_id = ?', [req.user.id], (err, interviewStats) => {
      db.get('SELECT COUNT(*) as completed_interview_count FROM interviews i JOIN applications a ON i.application_id = a.id WHERE a.user_id = ? AND i.status = "completed"', [req.user.id], (err, completedStats) => {
        db.get('SELECT COUNT(*) as favorite_count FROM favorited_jobs WHERE user_id = ?', [req.user.id], (err, favoriteStats) => {
          const stats = {
            applications: appStats ? appStats.application_count : 0,
            interviews: interviewStats ? interviewStats.interview_count : 0,
            offers: completedStats ? completedStats.completed_interview_count : 0, // Using completed interviews as proxy for offers
            favorites: favoriteStats ? favoriteStats.favorite_count : 0
          };
          res.render('dashboard', { user: req.user, stats: stats });
        });
      });
    });
  });
});

app.get('/profile', verifyToken, (req, res) => {
  db.all('SELECT a.*, j.title as job_title, j.university, j.location FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.user_id = ?', [req.user.id], (err, applications) => {
    if (err) return res.status(500).send('Error loading profile applications');
    res.render('profile', { user: req.user, applications });
  });
});

app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash], (err) => {
      if (err) return res.status(500).send('Error registering user');
      res.redirect('/login');
    });
  });
});

app.get('/jobs', verifyToken, (req, res) => {
  const { search, category, location, sort } = req.query;
  let query = 'SELECT * FROM jobs WHERE 1=1';
  let params = [];

  if (search) {
    query += ' AND (title LIKE ? OR university LIKE ? OR description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (location) {
    query += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }
  if (sort === 'salary') {
    query += ' ORDER BY CAST(REPLACE(salary, "$", "") AS INTEGER) DESC';
  } else {
    query += ' ORDER BY id DESC';
  }

  db.all(query, params, (err, jobs) => {
    if (err) return res.status(500).send('Error');
    db.all('SELECT job_id FROM favorited_jobs WHERE user_id = ?', [req.user.id], (err, favorites) => {
      if (err) return res.status(500).send('Error');
      const favoriteIds = favorites.map(f => f.job_id);
      res.render('jobs', { jobs, user: req.user, search, category, location, sort, favoriteIds });
    });
  });
});

app.post('/jobs/:id/favorite', verifyToken, (req, res) => {
  const jobId = req.params.id;
  db.get('SELECT * FROM favorited_jobs WHERE user_id = ? AND job_id = ?', [req.user.id, jobId], (err, favorite) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (favorite) {
      db.run('DELETE FROM favorited_jobs WHERE id = ?', [favorite.id], (err) => {
        if (err) return res.status(500).json({ error: 'Error removing favorite' });
        res.json({ favorited: false });
      });
    } else {
      db.run('INSERT INTO favorited_jobs (user_id, job_id) VALUES (?, ?)', [req.user.id, jobId], (err) => {
        if (err) return res.status(500).json({ error: 'Error saving favorite' });
        res.json({ favorited: true });
      });
    }
  });
});

app.get('/favorites', verifyToken, (req, res) => {
  db.all('SELECT j.* FROM favorited_jobs f JOIN jobs j ON f.job_id = j.id WHERE f.user_id = ?', [req.user.id], (err, jobs) => {
    if (err) return res.status(500).send('Error loading saved jobs');
    res.render('favorites', { jobs, user: req.user });
  });
});

app.get('/job/:id', verifyToken, (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM jobs WHERE id = ?', [id], (err, job) => {
    if (err) return res.status(500).send('Error');
    db.get('SELECT * FROM applications WHERE user_id = ? AND job_id = ?', [req.user.id, id], (err, application) => {
      db.get('SELECT resume_path FROM users WHERE id = ?', [req.user.id], (err, userResume) => {
        db.get('SELECT * FROM favorited_jobs WHERE user_id = ? AND job_id = ?', [req.user.id, id], (err, favorite) => {
          res.render('job-detail', { job, user: req.user, applied: !!application, hasResume: !!userResume?.resume_path, isFavorite: !!favorite });
        });
      });
    });
  });
});

app.post('/apply/:id', upload.single('resume'), verifyToken, (req, res) => {
  const jobId = req.params.id;
  let resumePath = req.file ? req.file.path : null;
  
  // If no file uploaded, check if user has a resume in their profile
  if (!resumePath) {
    db.get('SELECT resume_path FROM users WHERE id = ?', [req.user.id], (err, user) => {
      if (err) return res.status(500).send('Error checking user resume');
      
      resumePath = user?.resume_path;
      if (!resumePath) {
        return res.status(400).send('Resume upload is required. Please upload a resume first or select one from your dashboard.');
      }
      
      // Proceed with application using user's resume
      db.run('INSERT INTO applications (user_id, job_id, resume_path) VALUES (?, ?, ?)', [req.user.id, jobId, resumePath], (err) => {
        if (err) {
          console.error('Apply error:', err);
          return res.status(500).send('Error applying');
        }
        res.redirect('/candidate-interview/' + jobId);
      });
    });
  } else {
    // User uploaded a new resume for this application
    db.run('INSERT INTO applications (user_id, job_id, resume_path) VALUES (?, ?, ?)', [req.user.id, jobId, resumePath], (err) => {
      if (err) {
        console.error('Apply error:', err);
        return res.status(500).send('Error applying');
      }
      res.redirect('/candidate-interview/' + jobId);
    });
  }
});

app.post('/compare', verifyToken, (req, res) => {
  const jobIds = req.body.jobIds;
  if (!jobIds || jobIds.length < 2) return res.redirect('/jobs');
  const placeholders = jobIds.map(() => '?').join(',');
  db.all(`SELECT * FROM jobs WHERE id IN (${placeholders})`, jobIds, (err, jobs) => {
    if (err) return res.status(500).send('Error');
    res.render('compare', { jobs, user: req.user });
  });
});

app.get('/shortlisted', verifyToken, (req, res) => {
  db.all('SELECT a.*, j.title as job_title, j.university, j.location FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.status = "shortlisted"', [], (err, applications) => {
    if (err) return res.status(500).send('Error');
    res.render('shortlisted', { applications, user: req.user });
  });
});

app.post('/profile/update', verifyToken, (req, res) => {
  const { 
    name, 
    email, 
    phone, 
    address, 
    education, 
    experience, 
    skills, 
    linkedin, 
    website, 
    bio, 
    current_position, 
    institution 
  } = req.body;
  
  // Check if email is already taken by another user
  db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id], (err, existingUser) => {
    if (err) return res.status(500).send('Database error');
    if (existingUser) return res.status(400).send('Email already in use by another account');
    
    // Update user profile with all fields
    db.run(`UPDATE users SET 
      name = ?, 
      email = ?, 
      phone = ?, 
      address = ?, 
      education = ?, 
      experience = ?, 
      skills = ?, 
      linkedin = ?, 
      website = ?, 
      bio = ?, 
      current_position = ?, 
      institution = ? 
      WHERE id = ?`, [
      name, 
      email, 
      phone || null, 
      address || null, 
      education || null, 
      experience || null, 
      skills || null, 
      linkedin || null, 
      website || null, 
      bio || null, 
      current_position || null, 
      institution || null, 
      req.user.id
    ], (err) => {
      if (err) {
        console.error('Profile update error:', err);
        return res.status(500).send('Error updating profile');
      }
      
      // Update JWT token with new email
      const token = jwt.sign({ id: req.user.id, email: email, role: req.user.role }, SECRET_KEY);
      res.cookie('token', token);
      res.redirect('/profile');
    });
  });
});

app.get('/profile/resume', verifyToken, (req, res) => {
  return res.redirect('/profile');
});

app.post('/profile/resume', upload.single('resume'), verifyToken, (req, res) => {
  const resumePath = req.file ? req.file.path : null;
  
  if (!resumePath) {
    return res.status(400).send('Please select a resume file to upload');
  }
  
  // Mark resume upload and set review status to pending so admins can review
  db.run('UPDATE users SET resume_path = ?, resume_review_status = ? WHERE id = ?', [resumePath, 'pending', req.user.id], (err) => {
    if (err) {
      console.error('Resume upload error:', err);
      return res.status(500).send('Error uploading resume');
    }
    res.redirect('/practice');
  });
});

app.get('/practice', verifyToken, (req, res) => {
  res.render('practice', { user: req.user });
});

app.post('/practice/submit', verifyToken, express.json(), (req, res) => {
  const { totalScore, averageScore, totalQuestions, completedQuestions, mcqAnswers, codingAnswer, sessionType } = req.body;
  if (typeof totalScore !== 'number' || typeof averageScore !== 'number') {
    return res.status(400).json({ error: 'Invalid score data' });
  }

  const questions = Number.isInteger(totalQuestions) ? totalQuestions : 1;
  const completed = Number.isInteger(completedQuestions) ? completedQuestions : 1;

  db.run(
    'INSERT INTO interview_sessions (user_id, job_id, session_type, total_questions, completed_questions, total_score, average_score) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, null, 'practice', questions, completed, totalScore, averageScore],
    function(err) {
      if (err) {
        console.error('Practice session save error:', err);
        return res.status(500).json({ error: 'Failed to save practice score' });
      }
      const sessionId = this.lastID;

      // Save detailed responses if provided
      try {
        if (Array.isArray(mcqAnswers) && mcqAnswers.length > 0) {
          const stmt = db.prepare('INSERT INTO interview_responses (session_id, question_text, user_answer, ai_score, response_time) VALUES (?, ?, ?, ?, ?)');
          mcqAnswers.forEach(a => {
            const questionText = a.question_text || a.question || `MCQ Q${a.index + 1}`;
            const userAnswer = typeof a.user_answer === 'string' ? a.user_answer : String(a.user_answer);
            const aiScore = typeof a.ai_score === 'number' ? a.ai_score : null;
            const responseTime = typeof a.response_time === 'number' ? a.response_time : null;
            stmt.run(sessionId, questionText, userAnswer, aiScore, responseTime);
          });
          stmt.finalize();
        }

        if (codingAnswer && typeof codingAnswer === 'string' && codingAnswer.trim()) {
          db.run('INSERT INTO interview_responses (session_id, question_text, user_answer, ai_score, response_time) VALUES (?, ?, ?, ?, ?)',
            [sessionId, 'coding_answer', codingAnswer, null, null]);
        }
      } catch (e) {
        console.error('Error saving detailed responses:', e);
      }

      res.json({ success: true, sessionId });
    }
  );
});

app.get('/admin', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  db.all('SELECT * FROM jobs', [], (err, jobs) => {
    if (err) return res.status(500).send('Error fetching jobs');
    db.all('SELECT a.*, j.title as job_title, u.name as candidate_name, u.skills as candidate_skills, i.score as interview_score FROM applications a JOIN jobs j ON a.job_id = j.id JOIN users u ON a.user_id = u.id LEFT JOIN interviews i ON a.id = i.application_id', [], (err, applications) => {
      if (err) return res.status(500).send('Error fetching applications');

      // Compute average interview scores per user (from interviews)
      db.all('SELECT a.user_id as user_id, AVG(i.score) as avg_interview_score FROM interviews i JOIN applications a ON i.application_id = a.id GROUP BY a.user_id', [], (err, avgInterviews) => {
        const avgInterviewMap = {};
        if (!err && avgInterviews) avgInterviews.forEach(r => { avgInterviewMap[r.user_id] = r.avg_interview_score; });

        // Compute average session scores per user (from interview_sessions)
        db.all('SELECT user_id, AVG(average_score) as avg_session_score FROM interview_sessions GROUP BY user_id', [], (err, avgSessions) => {
          const avgSessionMap = {};
          if (!err && avgSessions) avgSessions.forEach(r => { avgSessionMap[r.user_id] = r.avg_session_score; });

          // Attach a consolidated candidate_score to each application for admin view
          applications.forEach(app => {
            const directInterview = app.interview_score;
            const avgInt = avgInterviewMap[app.user_id];
            const avgSess = avgSessionMap[app.user_id];
            let score = null;
            if (directInterview != null) score = Math.round(directInterview);
            else if (avgInt != null) score = Math.round(avgInt);
            else if (avgSess != null) score = Math.round(avgSess);
            app.candidate_score = score;
          });

          // Also fetch resume submissions and raw sessions/interviews for the resume section
          db.all('SELECT * FROM users WHERE resume_path IS NOT NULL', [], (err, resumeUsers) => {
            db.all('SELECT * FROM interview_sessions', [], (err, sessions) => {
                db.all('SELECT i.*, a.user_id FROM interviews i JOIN applications a ON i.application_id = a.id', [], (err, interviews) => {
                  // Fetch all responses and pass to view for detailed session display
                  db.all('SELECT * FROM interview_responses', [], (err, responses) => {
                    res.render('admin', { jobs, applications, resumeUsers, sessions, interviews, responses });
                  });
                });
            });
          });
        });
      });
    });
  });
});

// Admin review endpoint for standalone resume submissions
app.post('/admin/resume/:userId/review', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  const action = req.body.action || 'pending';
  let status = action;
  if (action === 'shortlist') status = 'shortlisted';
  if (action === 'reject') status = 'rejected';
  db.run('UPDATE users SET resume_review_status = ? WHERE id = ?', [status, req.params.userId], (err) => {
    if (err) return res.status(500).send('Error updating review status');
    res.redirect('/admin');
  });
});

app.post('/admin/job', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  const { title, university, location, salary, description, requirements, category } = req.body;
  db.run('INSERT INTO jobs (title, university, location, salary, description, requirements, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, university, location, salary, description, requirements, category], (err) => {
    if (err) return res.status(500).send('Error');
    res.redirect('/admin');
  });
});

app.post('/admin/job/:id/delete', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  db.run('DELETE FROM jobs WHERE id = ?', [req.params.id], (err) => {
    res.redirect('/admin');
  });
});

app.get('/admin/job/:id/edit', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  db.get('SELECT * FROM jobs WHERE id = ?', [req.params.id], (err, job) => {
    res.render('edit-job', { job });
  });
});

app.post('/admin/job/:id/edit', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  const { title, university, location, salary, description, requirements, category } = req.body;
  db.run('UPDATE jobs SET title = ?, university = ?, location = ?, salary = ?, description = ?, requirements = ?, category = ? WHERE id = ?',
    [title, university, location, salary, description, requirements, category, req.params.id], (err) => {
    res.redirect('/admin');
  });
});

app.post('/admin/application/:id/shortlist', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  const field = req.body.field || null;
  db.run('UPDATE applications SET status = ?, shortlisted_field = ? WHERE id = ?', ['shortlisted', field, req.params.id], (err) => {
    if (err) return res.status(500).send('Error shortlisting application');
    res.redirect('/admin');
  });
});

app.get('/interview/:applicationId', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  const appId = req.params.applicationId;
  db.get('SELECT i.*, a.user_id, j.title as job_title FROM interviews i JOIN applications a ON i.application_id = a.id JOIN jobs j ON a.job_id = j.id WHERE i.application_id = ?', [appId], async (err, interview) => {
    if (!interview) {
      // Create new interview
      db.run('INSERT INTO interviews (application_id) VALUES (?)', [appId], function(err) {
        const interviewId = this.lastID;
        // Generate questions based on job
        db.get('SELECT j.* FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = ?', [appId], async (err, job) => {
          const questions = await generateQuestions(job.category, job.title, job.description);
          questions.forEach(q => {
            db.run('INSERT INTO interview_questions (interview_id, question) VALUES (?, ?)', [interviewId, q]);
          });
          db.all('SELECT * FROM interview_questions WHERE interview_id = ?', [interviewId], (err, questions) => {
            res.render('interview', { interviewId, questions, job_title: job.title });
          });
        });
      });
    } else {
      db.all('SELECT * FROM interview_questions WHERE interview_id = ?', [interview.id], (err, questions) => {
        res.render('interview', { interviewId: interview.id, questions, job_title: interview.job_title });
      });
    }
  });
});

app.post('/interview/:interviewId/answer', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  const { questionId, answer } = req.body;
  // Get the question text
  db.get('SELECT question FROM interview_questions WHERE id = ?', [questionId], async (err, q) => {
    const score = await evaluateAnswer(q.question, answer);
    db.run('UPDATE interview_questions SET answer = ?, score = ? WHERE id = ?', [answer, score, questionId], (err) => {
      res.json({ score });
    });
  });
});

app.post('/interview/:interviewId/complete', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  db.all('SELECT score FROM interview_questions WHERE interview_id = ?', [req.params.interviewId], (err, questions) => {
    const totalScore = questions.reduce((sum, q) => sum + q.score, 0) / questions.length;
    db.run('UPDATE interviews SET status = ?, score = ? WHERE id = ?', ['completed', totalScore, req.params.interviewId], (err) => {
      res.redirect('/admin');
    });
  });
});

app.get('/candidate-interview/:jobId', verifyToken, async (req, res) => {
  const jobId = req.params.jobId;
  db.get('SELECT * FROM applications WHERE user_id = ? AND job_id = ?', [req.user.id, jobId], async (err, application) => {
    if (err) {
      console.error('Candidate interview lookup error:', err);
      return res.status(500).send('Server error while checking application');
    }
    if (!application) return res.redirect('/job/' + jobId);

    db.get('SELECT * FROM jobs WHERE id = ?', [jobId], async (err, job) => {
      if (err) {
        console.error('Job lookup error:', err);
        return res.status(500).send('Server error while loading job');
      }
      if (!job) return res.status(404).send('Job not found');

      db.get('SELECT * FROM interviews WHERE application_id = ?', [application.id], async (err, interview) => {
        if (err) {
          console.error('Interview lookup error:', err);
          return res.status(500).send('Server error while loading interview');
        }

        if (!interview) {
          db.run('INSERT INTO interviews (application_id) VALUES (?)', [application.id], function(err) {
            if (err) {
              console.error('Interview creation error:', err);
              return res.status(500).send('Server error creating interview');
            }
            const interviewId = this.lastID;
            generateQuestions(job.category, job.title, job.description)
              .then(questions => {
                const inserts = questions.map(q => new Promise((resolve, reject) => {
                  db.run('INSERT INTO interview_questions (interview_id, question) VALUES (?, ?)', [interviewId, q], err => {
                    if (err) reject(err);
                    else resolve();
                  });
                }));

                Promise.all(inserts)
                  .then(() => {
                    db.all('SELECT * FROM interview_questions WHERE interview_id = ?', [interviewId], (err, questions) => {
                      if (err) {
                        console.error('Question fetch error:', err);
                        return res.status(500).send('Server error loading questions');
                      }
                      res.render('candidate-interview', { interviewId, questions, job_title: job.title, job_category: job.category, user: req.user });
                    });
                  })
                  .catch(e => {
                    console.error('Question insert error:', e);
                    res.status(500).send('Server error creating interview questions');
                  });
              })
              .catch(e => {
                console.error('Question generation error:', e);
                res.status(500).send('Server error generating interview questions');
              });
          });
        } else {
          db.all('SELECT * FROM interview_questions WHERE interview_id = ?', [interview.id], (err, questions) => {
            if (err) {
              console.error('Question fetch error:', err);
              return res.status(500).send('Server error loading questions');
            }
            res.render('candidate-interview', { interviewId: interview.id, questions, job_title: job.title, job_category: job.category, user: req.user });
          });
        }
      });
    });
  });
});

app.post('/candidate-interview/:interviewId/answer', verifyToken, async (req, res) => {
  const { questionId, answer } = req.body;
  // Get the question text and interview details
  db.get('SELECT iq.question, i.application_id FROM interview_questions iq JOIN interviews i ON iq.interview_id = i.id WHERE iq.id = ?', [questionId], async (err, qData) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    const score = await evaluateAnswer(qData.question, answer);
    db.run('UPDATE interview_questions SET answer = ?, score = ? WHERE id = ?', [answer, score, questionId], async (err) => {
      if (err) return res.status(500).json({ error: 'Update error' });
      
      // If score is low (< 70), generate a follow-up question
      if (score < 70) {
        db.get('SELECT j.* FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = ?', [qData.application_id], async (err, job) => {
          let followUp = null;
          if (!err && job) {
            const questionText = await generateFollowUpQuestion(qData.question, answer, job.category);
            if (questionText) {
              followUp = await new Promise((resolve) => {
                db.run('INSERT INTO interview_questions (interview_id, question) VALUES (?, ?)', [req.params.interviewId, questionText], function(err) {
                  if (err) {
                    console.error('Follow-up insert error:', err);
                    return resolve(null);
                  }
                  resolve({ id: this.lastID, question: questionText });
                });
              });
            }
          }
          res.json({ score, followUp });
        });
      } else {
        res.json({ score });
      }
    });
  });
});

app.post('/candidate-interview/:interviewId/complete', verifyToken, (req, res) => {
  db.all('SELECT score FROM interview_questions WHERE interview_id = ?', [req.params.interviewId], (err, questions) => {
    const totalScore = questions.reduce((sum, q) => sum + q.score, 0) / questions.length;
    db.run('UPDATE interviews SET status = ?, score = ? WHERE id = ?', ['completed', totalScore, req.params.interviewId], (err) => {
      res.redirect('/profile');
    });
  });
});

app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err && err.name === 'MulterError') {
    return res.status(400).send('File upload error: ' + err.message);
  }
  if (err && err.message && err.message.includes('Only PDF and image files are allowed')) {
    return res.status(400).send(err.message);
  }
  res.status(500).send('Internal server error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

async function generateQuestions(category, jobTitle, jobDescription) {
  try {
    // In production, use OpenAI to generate questions
    const prompt = `Generate 4 interview questions for a ${category} professor position titled "${jobTitle}".
    Job description: ${jobDescription}
    Use W3Schools reference material and common training topics for programming and web languages like HTML, CSS, JavaScript, Python, Java, SQL, C, C++, PHP, and data structures.
    Questions should assess teaching experience, research background, and subject expertise in the selected language or category.
    Format: Return only the questions, one per line.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300
    });

    const questions = response.choices[0].message.content.trim().split('\n').filter(q => q.trim());
    return questions.slice(0, 4);
  } catch (error) {
    console.log('OpenAI error, using fallback:', error.message);
    // Fallback to predefined questions
    return getFallbackQuestions(category);
  }
}

function getFallbackQuestions(category) {
  const questionSets = {
    'Computer Science': [
      'Can you describe your experience teaching algorithms and data structures to undergraduate students?',
      'What research projects have you led in the field of computer science, and what were the key outcomes?',
      'How do you incorporate current industry trends, such as AI and machine learning, into your curriculum?',
      'How do you assess student learning and provide feedback in programming courses?'
    ],
    'Data Science': [
      'What statistical methods do you emphasize when teaching data science, and why?',
      'Can you discuss a data science project where you applied machine learning techniques?',
      'How do you teach students to handle real-world data challenges like missing values or outliers?',
      'What tools and programming languages do you require students to learn in your data science courses?'
    ],
    'Machine Learning': [
      'How do you explain complex concepts like neural networks to students without a strong math background?',
      'What are your thoughts on the ethical implications of machine learning in society?',
      'Can you describe your experience with deep learning frameworks and their applications?',
      'How do you design projects that allow students to apply machine learning to real problems?'
    ],
    'Engineering': [
      'What engineering principles do you believe are most important for students to master?',
      'Can you share an example of how you have integrated industry partnerships into your teaching?',
      'How do you approach teaching design thinking and problem-solving skills?',
      'What challenges have you faced in keeping engineering curricula current with technological advances?'
    ],
    'Mathematics': [
      'How do you make abstract mathematical concepts accessible to students?',
      'What is your approach to teaching proof-based mathematics versus applied mathematics?',
      'Can you discuss your research interests and how they influence your teaching?',
      'How do you use technology, such as mathematical software, in your courses?'
    ],
    'Cybersecurity': [
      'What are the most critical cybersecurity concepts you teach, and why?',
      'How do you simulate real-world cyber attacks in a classroom setting?',
      'Can you describe your experience with cybersecurity research or consulting?',
      'How do you address the rapidly evolving nature of cybersecurity threats in your curriculum?'
    ],
    'Software Engineering': [
      'What software development methodologies do you teach, and how do you compare their effectiveness?',
      'How do you incorporate agile practices into your software engineering courses?',
      'Can you discuss a challenging software project you have overseen as an educator?',
      'What strategies do you use to teach students about software testing and quality assurance?'
    ],
    'HTML': [
      'What are the core structural elements of an HTML document and why do they matter?',
      'How do you create an accessible form in HTML and what attributes help screen readers?',
      'What is the difference between <div> and <span> elements?',
      'How do you embed images and multimedia in HTML pages?'
    ],
    'CSS': [
      'How do you apply responsive design using CSS media queries?',
      'What is the difference between class selectors and ID selectors?',
      'Explain the CSS box model and how padding, border, and margin interact.',
      'How do you use Flexbox to align content in a layout?'
    ],
    'JavaScript': [
      'What is the difference between var, let, and const in JavaScript?',
      'How do you handle asynchronous code using promises or async/await?',
      'What are JavaScript closures and why are they useful?',
      'How do you manipulate the DOM using JavaScript?'
    ],
    'Python': [
      'What are Python decorators and when would you use them?',
      'How do you handle errors and exceptions in Python programs?',
      'What is the difference between a list and a tuple in Python?',
      'Explain Python’s memory management for objects and data structures.'
    ],
    'Java': [
      'Describe how Java achieves platform independence.',
      'What are the differences between interfaces and abstract classes in Java?',
      'How does Java garbage collection work?',
      'Explain the role of the Java Virtual Machine in running a Java application.'
    ],
    'SQL': [
      'What is the difference between INNER JOIN and LEFT JOIN?',
      'How do you filter query results using WHERE and HAVING?',
      'What is normalization and why is it important in SQL databases?',
      'How do you create an index and when should you use one?'
    ],
    'C': [
      'What are pointers and how are they used in C?',
      'How do you allocate and free memory in C?',
      'What is the difference between a stack and a heap?',
      'How do you define and use a struct in C?'
    ],
    'C++': [
      'What is object-oriented programming and how does C++ support it?',
      'What are constructors and destructors in C++?',
      'How do templates enable generic programming in C++?',
      'What is the difference between public, private, and protected access specifiers?'
    ],
    'PHP': [
      'How do you handle form data submitted via POST in PHP?',
      'What is the difference between include and require in PHP?',
      'How do you connect to a MySQL database using PHP?',
      'What are sessions and cookies used for in PHP?'
    ],
    'DSA': [
      'What is the average-case time complexity of quicksort? Please explain in one sentence.',
      'Which data structure is best for implementing a priority queue, and why?',
      'What is the main difference between a stack and a queue?',
      'Explain how a hash table resolves collisions.'
    ]
  };
  const normalized = (category || '').toLowerCase();
  if (normalized.includes('dsa') || normalized.includes('data structures') || normalized.includes('algorithms')) {
    return questionSets['DSA'];
  }
  if (normalized.includes('python')) {
    return questionSets['Python'];
  }
  if (normalized.includes('java')) {
    return questionSets['Java'];
  }
  if (normalized.includes('javascript')) {
    return questionSets['JavaScript'];
  }
  if (normalized.includes('html')) {
    return questionSets['HTML'];
  }
  if (normalized.includes('css')) {
    return questionSets['CSS'];
  }
  if (normalized.includes('sql')) {
    return questionSets['SQL'];
  }
  if (normalized.includes('c++') || normalized.includes('cpp')) {
    return questionSets['C++'];
  }
  if (normalized === 'c') {
    return questionSets['C'];
  }
  if (normalized.includes('php')) {
    return questionSets['PHP'];
  }
  return questionSets[category] || questionSets['Computer Science'];
}

async function evaluateAnswer(question, answer) {
  try {
    // Use AI to evaluate the answer
    const prompt = `Evaluate this interview answer on a scale of 0-100. 
    Question: ${question}
    Answer: ${answer}
    Consider relevance, depth, clarity, and expertise. Return only a number between 0 and 100.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10
    });

    const score = parseInt(response.choices[0].message.content.trim());
    return Math.max(0, Math.min(100, score));
  } catch (error) {
    console.log('AI scoring error, using fallback:', error.message);
    // Fallback scoring
    return fallbackScoring(answer);
  }
}

function fallbackScoring(answer) {
  let score = 0;
  const keywords = ['experience', 'teaching', 'research', 'approach', 'methodology', 'challenges', 'best practices', 'examples', 'projects'];
  keywords.forEach(keyword => {
    if (answer.toLowerCase().includes(keyword)) score += 8;
  });
  if (answer.length > 100) score += 20;
  if (answer.length > 200) score += 10;
  return Math.min(score, 100);
}

async function generateFollowUpQuestion(originalQuestion, answer, category) {
  try {
    const prompt = `Based on this interview question and answer, generate one follow-up question to probe deeper.
    
Original Question: ${originalQuestion}
Candidate's Answer: ${answer}
Job Category: ${category}

The follow-up should be relevant, specific, and help assess the candidate's expertise. Return only the follow-up question.`;

    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.log('Follow-up generation error:', error.message);
    return null;
  }
}