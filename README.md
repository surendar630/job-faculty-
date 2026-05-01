# AcademiaPro - Faculty & Professor Job Portal

A full-stack web application for finding academic jobs with advanced features.

## Features

- User registration and login
- Job listings with advanced filtering and search
- Job comparison tool (compare multiple jobs side by side)
- Job application tracking
- Admin panel for adding jobs
- AI-powered candidate interviews with voice assistance
- Direct interview flow after job application
- Responsive design

## New Features Added

### Candidate Interview Flow
- **Direct Interview After Apply**: Candidates are immediately redirected to interview after applying
- **Progressive Question Display**: Questions appear one by one with progress tracking
- **Voice & Text Input**: Support for both voice recognition and text answers
- **Real-time Scoring**: AI evaluates answers instantly with percentage scores
- **Interview Completion**: Automatic calculation of overall interview score

### Enhanced User Experience
- **More Vacancies Button**: Easy access to browse additional job opportunities
- **Interview Progress Bar**: Visual indicator of interview completion
- **Profile Integration**: View interview scores and application status
- **Seamless Navigation**: Smooth flow from application to interview to results

## Tech Stack

- Backend: Node.js, Express, SQLite
- Frontend: EJS templates, HTML, CSS, JavaScript
- Authentication: JWT

## Setup

1. Clone the repository
2. Run `npm install`
3. Set up OpenAI API key: `export OPENAI_API_KEY=your-key-here`
4. Run `npm start`
5. Open http://localhost:3000

## Usage

- Register a new account or login
- Browse and filter jobs
- Select multiple jobs to compare them
- Apply for jobs and track applications in profile
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
