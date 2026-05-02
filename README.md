# AcademiaPro - Faculty & Professor Job Portal

A full-stack web application for finding academic jobs with advanced AI-powered features.

## Features

- User registration and login
- Job listings with advanced filtering and search
- Job comparison tool (compare multiple jobs side-by-side)
- Job application tracking with resume upload
- Resume shortlisting and management
- Admin panel for managing jobs and applications
- AI-powered candidate interviews with voice assistance
- Direct interview flow after job application
- Progressive question display with real-time scoring
- Responsive and modern UI/UX design
- File upload support for resumes (PDF/Image)

## New Features Added

### Resume Management System
- **Resume Upload**: Candidates can upload PDF or image resumes during application
- **Resume Shortlisting**: Admins can shortlist applications and view/download resumes
- **Resume Dashboard**: Dedicated dashboard for viewing shortlisted candidate resumes
- **File Validation**: Secure file upload with size and type validation

### Enhanced UI/UX
- **Advanced Animations**: Smooth transitions, hover effects, and micro-interactions
- **Glassmorphism Effects**: Modern glass-like design elements
- **Gradient Backgrounds**: Beautiful gradient overlays and backgrounds
- **Responsive Design**: Optimized for all device sizes
- **Loading States**: Visual feedback for user actions

### Candidate Interview Flow
- **Direct Interview After Apply**: Candidates are immediately redirected to interview after applying
- **Progressive Question Display**: Questions appear one by one with progress tracking
- **Voice & Text Input**: Support for both voice recognition and text answers
- **Real-time Scoring**: AI evaluates answers instantly with percentage scores
- **Interview Completion**: Automatic calculation of overall interview score

## Tech Stack

- Backend: Node.js, Express, SQLite, Multer (file uploads)
- Frontend: EJS templates, HTML, CSS, JavaScript
- Authentication: JWT
- AI: OpenAI API for interview evaluation
- File Storage: Local file system with secure upload handling

## Setup

1. Clone the repository
2. Run `npm install`
3. Set up environment variables:
   ```bash
   export OPENAI_API_KEY=your-openai-api-key-here
   export JWT_SECRET=your-jwt-secret-key-here
   ```
4. Run `npm start`
5. Open http://localhost:3000

## Deployment to Render

1. **Connect Repository**: Link your GitHub repository to Render
2. **Environment Variables**: Set the following in Render dashboard:
   - `NODE_ENV`: `production`
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `JWT_SECRET`: A secure random string for JWT
   - `PORT`: `10000` (or Render's assigned port)
3. **Build Settings**: 
   - Build Command: `npm install && mkdir -p uploads`
   - Start Command: `npm start`
4. **Deploy**: Render will automatically build and deploy your application

## Usage

- **For Candidates**:
  - Register a new account or login
  - Browse and filter jobs
  - Upload resume when applying for jobs
  - Take AI-powered interviews
  - Track applications and interview scores in profile

- **For Admins**:
  - Login with admin credentials (admin@academiapro.com / admin123)
  - Add new job postings
  - Review and shortlist applications
  - View/download candidate resumes
  - Conduct interviews and view scores

## File Structure

```
├── server.js              # Main application server
├── views/                 # EJS templates
│   ├── dashboard.ejs      # User dashboard
│   ├── admin.ejs          # Admin panel
│   ├── shortlisted.ejs    # Resume shortlisting
│   └── ...
├── public/                # Static assets
│   └── styles.css         # Main stylesheet
├── uploads/               # Resume file storage
├── render.yaml            # Render deployment config
└── package.json           # Dependencies
```
- Admin login: admin@academiapro.com / admin123 (to add jobs)

## AI Interview Assistant

The application features a trained AI assistant that dynamically generates interview questions and evaluates responses:

### Question Generation
- **AI-Powered**: Uses OpenAI GPT-3.5 to generate context-specific questions
- **Job-Aware**: Questions based on job title, description, and category
- **Dynamic**: Each interview gets unique, relevant questions
- **Fallback**: Robust fallback system if AI is unavailable

### Answer Evaluation
- **Intelligent Scoring**: AI analyzes relevance, depth, clarity, and expertise
- **Percentage Scores**: 0-100% scoring for each answer
- **Comprehensive Feedback**: Considers content quality and completeness
- **Real-time Results**: Instant scoring after each answer

### Voice Integration
- **Speech Recognition**: Web Speech API for voice input
- **Accessibility**: Text input as fallback
- **Natural Interaction**: Hands-free answering capability

### Training Aspects
- **Context Learning**: AI considers job specifics for question generation
- **Adaptive Scoring**: Evaluates answers against question requirements
- **Category Expertise**: Specialized questions for different academic fields

## Admin Features

- Login: admin@academiapro.com / admin123
- Manage job vacancies (CRUD operations)
- Review applications and shortlist candidates
- Conduct AI-powered interviews with voice support
- View interview scores and make hiring decisions
