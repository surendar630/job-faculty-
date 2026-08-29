const assert = require('assert');
const path = require('path');
const { evaluateShortlistDecision, buildRealtimeAIInsights, buildCloudAIActions, buildResumeTrainingCards } = require('../server');

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

  console.log('shortlist rule tests passed');
})();
