const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const openai = require('openai');
const multer = require('multer');

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
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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

  db.run(`CREATE TABLE IF NOT EXISTS interview_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interview_id INTEGER,
    question TEXT,
    answer TEXT,
    score REAL,
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
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

  // Create admin user
  bcrypt.hash('admin123', 10, (err, hash) => {
    db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES ('Admin', 'admin@academiapro.com', ?, 'admin')`, [hash]);
  });
});

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.redirect('/login');
    req.user = user;
    next();
  });
}

// Routes
app.get('/', (req, res) => {
  db.all('SELECT * FROM jobs LIMIT 4', [], (err, jobs) => {
    res.render('index', { jobs });
  });
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).send('Error');
    if (!user) return res.status(400).send('User not found');
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET_KEY);
        res.cookie('token', token);
        res.redirect('/dashboard');
      } else {
        res.status(400).send('Invalid password');
      }
    });
  });
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/dashboard', verifyToken, (req, res) => {
  // Get user statistics
  db.get('SELECT COUNT(*) as application_count FROM applications WHERE user_id = ?', [req.user.id], (err, appStats) => {
    db.get('SELECT COUNT(*) as interview_count FROM interviews i JOIN applications a ON i.application_id = a.id WHERE a.user_id = ?', [req.user.id], (err, interviewStats) => {
      db.get('SELECT COUNT(*) as completed_interview_count FROM interviews i JOIN applications a ON i.application_id = a.id WHERE a.user_id = ? AND i.status = "completed"', [req.user.id], (err, completedStats) => {
        const stats = {
          applications: appStats ? appStats.application_count : 0,
          interviews: interviewStats ? interviewStats.interview_count : 0,
          offers: completedStats ? completedStats.completed_interview_count : 0, // Using completed interviews as proxy for offers
          favorites: 0 // Could be implemented later with a favorites table
        };
        res.render('dashboard', { user: req.user, stats: stats });
      });
    });
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
    res.render('jobs', { jobs, user: req.user, search, category, location, sort });
  });
});

app.get('/job/:id', verifyToken, (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM jobs WHERE id = ?', [id], (err, job) => {
    if (err) return res.status(500).send('Error');
    db.get('SELECT * FROM applications WHERE user_id = ? AND job_id = ?', [req.user.id, id], (err, application) => {
      db.get('SELECT resume_path FROM users WHERE id = ?', [req.user.id], (err, userResume) => {
        res.render('job-detail', { job, user: req.user, applied: !!application, hasResume: !!userResume?.resume_path });
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

app.post('/profile/resume', upload.single('resume'), verifyToken, (req, res) => {
  const resumePath = req.file ? req.file.path : null;
  
  if (!resumePath) {
    return res.status(400).send('Please select a resume file to upload');
  }
  
  db.run('UPDATE users SET resume_path = ? WHERE id = ?', [resumePath, req.user.id], (err) => {
    if (err) {
      console.error('Resume upload error:', err);
      return res.status(500).send('Error uploading resume');
    }
    res.redirect('/dashboard');
  });
});

app.get('/admin', verifyToken, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).send('Access denied');
  db.all('SELECT * FROM jobs', [], (err, jobs) => {
    db.all('SELECT a.*, j.title as job_title, u.name as candidate_name, i.score as interview_score FROM applications a JOIN jobs j ON a.job_id = j.id JOIN users u ON a.user_id = u.id LEFT JOIN interviews i ON a.id = i.application_id', [], (err, applications) => {
      res.render('admin', { jobs, applications });
    });
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
  db.run('UPDATE applications SET status = ? WHERE id = ?', ['shortlisted', req.params.id], (err) => {
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
                      res.render('candidate-interview', { interviewId, questions, job_title: job.title });
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
            res.render('candidate-interview', { interviewId: interview.id, questions, job_title: job.title });
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
      let followUpQuestion = null;
      if (score < 70) {
        // Get job details for context
        db.get('SELECT j.* FROM applications a JOIN jobs j ON a.job_id = j.id WHERE a.id = ?', [qData.application_id], async (err, job) => {
          if (!err && job) {
            followUpQuestion = await generateFollowUpQuestion(qData.question, answer, job.category);
            if (followUpQuestion) {
              // Insert follow-up question
              db.run('INSERT INTO interview_questions (interview_id, question) VALUES (?, ?)', [req.params.interviewId, followUpQuestion], function(err) {
                if (!err) {
                  followUpQuestion = { id: this.lastID, question: followUpQuestion };
                }
              });
            }
          }
          res.json({ score, followUp: followUpQuestion });
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

async function generateQuestions(category, jobTitle, jobDescription) {
  try {
    // In production, use OpenAI to generate questions
    const prompt = `Generate 4 interview questions for a ${category} professor position titled "${jobTitle}". 
    Job description: ${jobDescription}
    Questions should assess teaching experience, research background, and subject expertise.
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
    ]
  };
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