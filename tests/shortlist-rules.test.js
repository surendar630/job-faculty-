const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { evaluateShortlistDecision, buildRealtimeAIInsights, buildCloudAIActions, buildCloudAIRecommendations, buildResumeTrainingCards, buildAdvancedAICoach, calculateJobFitScore, buildUniversityForwardLink, buildPracticePerformanceSummary, generateProfessionalPracticeSet, analyzeResumeForAICTE, buildCloudAIOverview, buildCandidateMatchDashboard, buildAIJobRecommendations, buildHRExportReport, buildRecruiterAnalyticsDashboard, buildCandidateAIPlan, buildAdminAIOperations, getProAccessStatus } = require('../server');

(async function run() {
  const insights = buildRealtimeAIInsights({
    user: { name: 'Dr. Priya', role: 'user' },
    jobs: [
      { title: 'Professor - Computer Science', category: 'Computer Science', university: 'IISc Bangalore', location: 'Bangalore' },
      { title: 'Associate Professor - Data Science', category: 'Data Science', university: 'IIIT Bangalore', location: 'Bangalore' }
    ],
    stats: { applications: 2, interviews: 1, favorites: 3 },
    profileCompletion: 82
  });

  assert.ok(Array.isArray(insights), 'AI insights should return an array');
  assert.ok(insights.length >= 3, 'AI insights should include multiple cards');
  assert.ok(insights.every(item => item.title && item.description), 'Each insight should have title and description');

  const cloudActions = buildCloudAIActions({ user: { role: 'hr' }, stats: { applications: 18, interviews: 7 } });
  assert.ok(Array.isArray(cloudActions), 'Cloud AI actions should return an array');
  assert.strictEqual(cloudActions.length >= 3, true, 'Cloud AI actions should provide the core capability cards');
  assert.ok(cloudActions.every(item => item.title && item.description), 'Each cloud AI action should include a clear title and description');

  const cloudRecommendations = buildCloudAIRecommendations({
    user: { name: 'Dr. Priya', role: 'user' },
    jobs: [{ title: 'Professor - AI', category: 'Computer Science' }, { title: 'Assistant Professor - Data Science', category: 'Data Science' }],
    stats: { applications: 3, interviews: 2, favorites: 4 },
    profileCompletion: 87
  });
  assert.ok(Array.isArray(cloudRecommendations), 'Cloud AI recommendations should return an array');
  assert.ok(cloudRecommendations.length >= 3, 'Cloud AI recommendations should provide multiple guidance cards');
  assert.ok(cloudRecommendations.every(item => item.title && item.description), 'Each recommendation should include a clear title and description');

  const cloudOverview = buildCloudAIOverview({ user: { name: 'Dr. Priya', role: 'user' }, jobs: [{ title: 'Professor - AI', category: 'Computer Science' }], stats: { applications: 5, interviews: 2, favorites: 4 }, profileCompletion: 88 });
  assert.ok(Array.isArray(cloudOverview), 'Cloud AI overview should return an array');
  assert.ok(cloudOverview.length >= 3, 'Cloud AI overview should provide multiple capability cards');
  assert.ok(cloudOverview.every(item => item.title && item.description), 'Each cloud AI overview card should include a clear title and description');

  const matchDashboard = buildCandidateMatchDashboard({
    user: { name: 'Dr. Priya', role: 'user', skills: 'AI, research, teaching, machine learning', bio: 'Research and teaching in AI and data science', experience: 7 },
    jobs: [
      { id: 1, title: 'Professor - AI', category: 'Computer Science', university: 'IISc Bangalore', location: 'Bangalore' },
      { id: 2, title: 'Assistant Professor - Data Science', category: 'Data Science', university: 'IIIT Delhi', location: 'Delhi' },
      { id: 3, title: 'Lecturer - Mathematics', category: 'Mathematics', university: 'BITS Pilani', location: 'Pilani' }
    ]
  });
  assert.ok(Array.isArray(matchDashboard), 'Candidate match dashboard should return an array');
  assert.ok(matchDashboard.length >= 3, 'Candidate match dashboard should include multiple ranked matches');
  assert.ok(matchDashboard[0].score >= matchDashboard[1].score, 'Dashboard ranking should sort matches by strongest match score');

  const rankedJobs = buildAIJobRecommendations({
    user: { skills: 'AI, research, teaching, machine learning', bio: 'Research and teaching in AI and machine learning', experience: 6 },
    jobs: [
      { id: 1, title: 'Professor - AI', category: 'Computer Science', university: 'IISc Bangalore', location: 'Bangalore', salary: '₹18L' },
      { id: 2, title: 'Assistant Professor - Mathematics', category: 'Mathematics', university: 'BITS', location: 'Pilani', salary: '₹12L' },
      { id: 3, title: 'Associate Professor - Cybersecurity', category: 'Cybersecurity', university: 'IIIT', location: 'Hyderabad', salary: '₹15L' }
    ]
  });
  assert.ok(Array.isArray(rankedJobs), 'AI job recommendations should return an array');
  assert.ok(rankedJobs.length >= 3, 'AI job recommendations should include ranked jobs');
  assert.ok(rankedJobs[0].score >= rankedJobs[1].score, 'Ranking should place the strongest role first');

  const exportReport = buildHRExportReport({
    applications: [
      { candidate_name: 'Dr. Meera', candidate_email: 'meera@example.com', job_title: 'Professor - AI', university: 'IISc Bangalore', status: 'shortlisted', score: 92 },
      { candidate_name: 'Arun', candidate_email: 'arun@example.com', job_title: 'Assistant Professor - Data Science', university: 'IIIT Delhi', status: 'pending', score: 74 }
    ]
  });
  assert.ok(exportReport && typeof exportReport === 'object', 'HR export report should be returned');
  assert.ok(typeof exportReport.csv === 'string' && exportReport.csv.includes('candidate_name'), 'Export CSV should include a header row');
  assert.ok(exportReport.summary && exportReport.summary.toLowerCase().includes('shortlisted') || exportReport.summary.toLowerCase().includes('candidate'), 'Export summary should describe the candidate shortlist');

  const recruiterDashboard = buildRecruiterAnalyticsDashboard({
    jobs: [{ title: 'Professor - AI', category: 'Computer Science' }, { title: 'Assistant Professor - Data Science', category: 'Data Science' }, { title: 'Professor - Mathematics', category: 'Mathematics' }],
    applications: [
      { status: 'shortlisted', job_title: 'Professor - AI' },
      { status: 'pending', job_title: 'Assistant Professor - Data Science' },
      { status: 'rejected', job_title: 'Professor - AI' },
      { status: 'shortlisted', job_title: 'Professor - Mathematics' },
      { status: 'pending', job_title: 'Professor - AI' }
    ],
    meetings: [{ platform: 'Zoom' }, { platform: 'Google Meet' }, { platform: 'Microsoft Teams' }]
  });
  assert.ok(recruiterDashboard && typeof recruiterDashboard === 'object', 'Recruiter analytics dashboard should be returned');
  assert.ok(typeof recruiterDashboard.conversionRate === 'number', 'Conversion rate should be numeric');
  assert.ok(Array.isArray(recruiterDashboard.pipelineTrend) && recruiterDashboard.pipelineTrend.length >= 3, 'Pipeline trend should include time buckets');
  assert.ok(Array.isArray(recruiterDashboard.topDepartments) && recruiterDashboard.topDepartments.length >= 1, 'Top departments should be included');

  const candidatePlan = buildCandidateAIPlan({
    user: { name: 'Dr. Priya', role: 'user', skills: 'AI, data science, teaching', bio: 'Research and teaching in machine learning', experience: 6 },
    jobs: [{ title: 'Professor - AI', category: 'Computer Science' }, { title: 'Assistant Professor - Data Science', category: 'Data Science' }],
    stats: { applications: 3, interviews: 2, favorites: 5 },
    profileCompletion: 87
  });
  assert.ok(candidatePlan && typeof candidatePlan === 'object', 'Candidate AI plan should be returned');
  assert.ok(Array.isArray(candidatePlan.plan) && candidatePlan.plan.length >= 3, 'Candidate AI plan should include multiple action steps');
  assert.ok(candidatePlan.forecast && typeof candidatePlan.forecast === 'string', 'Candidate AI plan should include a forecast summary');
  assert.ok(candidatePlan.priority && typeof candidatePlan.priority === 'string', 'Candidate AI plan should identify a top priority');
  assert.ok(Array.isArray(candidatePlan.roadmap) && candidatePlan.roadmap.length >= 3, 'Candidate roadmap should have at least three role-based stages');
  assert.ok(Array.isArray(candidatePlan.fitScoreCards) && candidatePlan.fitScoreCards.length >= 2, 'Fit score cards should provide multiple role predictions');
  assert.ok(candidatePlan.resumeScore >= 0 && candidatePlan.resumeScore <= 100, 'Resume score should be within the valid range');
  assert.ok(Array.isArray(candidatePlan.sevenDayPlan) && candidatePlan.sevenDayPlan.length >= 3, 'Seven-day plan should include multiple daily actions');

  const adminAiOps = buildAdminAIOperations({
    jobs: [{ title: 'Professor - AI', category: 'Computer Science' }, { title: 'Associate Professor - Data Science', category: 'Data Science' }],
    applications: [
      { status: 'shortlisted', job_title: 'Professor - AI', candidate_name: 'Priya', candidate_email: 'priya@example.com' },
      { status: 'pending', job_title: 'Professor - AI', candidate_name: 'Aditi', candidate_email: 'aditi@example.com' },
      { status: 'rejected', job_title: 'Associate Professor - Data Science', candidate_name: 'Karan', candidate_email: 'karan@example.com' }
    ],
    interviews: [{ score: 88 }, { score: 72 }],
    recentLogins: [{ user_name: 'Priya', role: 'admin' }, { user_name: 'Aditi', role: 'hr' }],
    stats: { applications: 12, interviews: 6, favorites: 9 }
  });
  assert.ok(adminAiOps && typeof adminAiOps === 'object', 'Admin AI operations dashboard should be returned');
  assert.ok(Array.isArray(adminAiOps.overview) && adminAiOps.overview.length >= 3, 'Admin overview cards should include multiple AI insights');
  assert.ok(Array.isArray(adminAiOps.riskAlerts) && adminAiOps.riskAlerts.length >= 2, 'Admin risk alerts should identify key review items');
  assert.ok(Array.isArray(adminAiOps.actions) && adminAiOps.actions.length >= 3, 'Admin AI actions should include a complete set of operational steps');
  assert.ok(adminAiOps.priority && typeof adminAiOps.priority === 'string', 'Admin AI operations should identify a priority focus');

  const proAccess = getProAccessStatus({ is_pro: 1, pro_plan: 'pro', pro_paid_at: '2026-09-01', pro_expires_at: '2026-10-01' });
  assert.ok(proAccess && proAccess.isPro === true, 'Pro access should be recognized for paid users');
  assert.ok(proAccess.plan === 'pro', 'Pro plan should be exposed in the access object');
  assert.ok(Array.isArray(proAccess.features) && proAccess.features.length >= 3, 'Pro features should include premium capabilities');

  const cases = [
    {
      name: 'shortlists high-scoring AICTE-compliant candidates',
      interviewScore: 85,
      resumeScore: 80,
      aicteStatus: 'AICTE-compliant',
      expected: { shouldShortlist: true, reason: 'strong' }
    },
    {
      name: 'keeps borderline resumes pending',
      interviewScore: 72,
      resumeScore: 55,
      aicteStatus: 'AICTE-review-needed',
      expected: { shouldShortlist: false, reason: 'review' }
    },
    {
      name: 'shortlists when interview is strong but resume review is pending',
      interviewScore: 84,
      resumeScore: 58,
      aicteStatus: 'AICTE-review-needed',
      expected: { shouldShortlist: true, reason: 'interview' }
    }
  ];

  cases.forEach(({ name, interviewScore, resumeScore, aicteStatus, expected }) => {
    const result = evaluateShortlistDecision({ interviewScore, resumeScore, aicteStatus });
    assert.strictEqual(result.shouldShortlist, expected.shouldShortlist, `${name}: shortlist flag mismatch`);
    assert.strictEqual(result.reason, expected.reason, `${name}: reason mismatch`);
  });

  const trainingCards = buildResumeTrainingCards({
    applications: [{
      candidate_name: 'Dr. Meera',
      job_title: 'Professor - Data Science',
      resume_scan_score: 62,
      resume_aicte_status: 'AICTE-review-needed'
    }]
  });

  assert.ok(Array.isArray(trainingCards), 'Resume training cards should be returned');
  assert.ok(trainingCards.length >= 1, 'Training cards should include at least one action');
  assert.ok(trainingCards[0].title && trainingCards[0].description, 'Each card should include title and description');
  assert.ok(trainingCards[0].description.toLowerCase().includes('strengthen') || trainingCards[0].description.toLowerCase().includes('improve'), 'Training guidance should include practical improvement steps');

  const advancedCoach = buildAdvancedAICoach({
    user: { role: 'user', name: 'Dr. Maya', skills: 'AI, research, teaching, data science', bio: 'Teaching and research in AI and faculty development' },
    jobs: [{ title: 'Professor - AI', category: 'Computer Science' }],
    stats: { applications: 4, interviews: 2, favorites: 3 },
    profileCompletion: 82
  });
  assert.ok(Array.isArray(advancedCoach), 'Advanced AI coach cards should be returned');
  assert.ok(advancedCoach.length >= 3, 'Advanced AI coach should include multiple coaching cards');
  assert.ok(calculateJobFitScore({ title: 'Professor - AI', category: 'Computer Science' }, { skills: 'AI, research, teaching, machine learning', bio: 'Research and teaching in AI', experience: 6 }) >= 70, 'AI job fit score should reflect strong subject alignment');

  const forwardLink = buildUniversityForwardLink({ university: 'IISc Bangalore', title: 'Professor - AI' }, { name: 'Dr. Priya', email: 'priya@example.com' });
  assert.ok(typeof forwardLink === 'string' && forwardLink.startsWith('http'), 'University forward link should be an external URL');
  assert.ok(forwardLink.toLowerCase().includes('google') || forwardLink.toLowerCase().includes('career') || forwardLink.toLowerCase().includes('mailto:'), 'University forward link should target the university or careers search');

  const practiceSummary = buildPracticePerformanceSummary({ user: { role: 'admin' }, totalScore: 84, averageScore: 84, totalQuestions: 20, completedQuestions: 20, sessionType: 'practice' });
  assert.ok(practiceSummary && typeof practiceSummary === 'object', 'Practice summary should be returned');
  assert.ok(practiceSummary.score >= 80, 'Practice score should reflect the candidate band');
  assert.ok(practiceSummary.band && practiceSummary.summary, 'Practice summary should include a band and human-readable summary');
  assert.ok(practiceSummary.summary.toLowerCase().includes('interview') || practiceSummary.summary.toLowerCase().includes('readiness'), 'Practice summary should explain readiness for HR/admin review');

  const aiPracticeSet = await generateProfessionalPracticeSet({
    user: { role: 'admin', name: 'HR Team' },
    category: 'Computer Science',
    jobTitle: 'Assistant Professor - AI and Data Science',
    prompt: 'Faculty hiring mock test for AI and machine learning interview readiness'
  });
  assert.ok(aiPracticeSet && Array.isArray(aiPracticeSet.mcqs), 'Generated practice set should include MCQ questions');
  assert.ok(aiPracticeSet.mcqs.length >= 4, 'Generated practice set should include multiple MCQ questions');
  assert.ok(Array.isArray(aiPracticeSet.coding), 'Generated practice set should include coding challenges');

  const weakResume = analyzeResumeForAICTE(
    { title: 'Assistant Professor', category: 'Computer Science' },
    'B.Tech in Computer Science, 2019, 2 years software engineer at an IT company. No teaching, no research publications, no PhD, no grant work, no patents.'
  );
  assert.strictEqual(weakResume.aicteStatus, 'AICTE-review-needed', 'Weak resumes should be flagged for AICTE review');
  assert.ok(weakResume.report.toLowerCase().includes('aicte') && weakResume.report.toLowerCase().includes('teaching'), 'AICTE reports should include teaching and compliance review details');

  const homeTemplate = fs.readFileSync(path.join(__dirname, '../views/index.ejs'), 'utf8');
  const uploadTemplate = fs.readFileSync(path.join(__dirname, '../views/upload-portal.ejs'), 'utf8');
  assert.ok(!homeTemplate.includes('AcademiaPro'), 'Public pages should not display the product name AcademiaPro');
  assert.ok(!uploadTemplate.includes('AICTE Faculty'), 'Upload portal should not display the product name AICTE Faculty');

  console.log('shortlist rule tests passed');
})();
