const assert = require('assert');
const path = require('path');
const { evaluateShortlistDecision, buildRealtimeAIInsights } = require('../server');

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

  console.log('shortlist rule tests passed');
})();
