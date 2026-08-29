const assert = require('assert');
const path = require('path');
const { evaluateShortlistDecision, buildRealtimeAIInsights, buildCloudAIActions, buildCloudAIRecommendations, buildResumeTrainingCards, buildAdvancedAICoach, calculateJobFitScore, buildUniversityForwardLink, buildPracticePerformanceSummary } = require('../server');

(function run() {
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

  console.log('shortlist rule tests passed');
})();
