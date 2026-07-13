const assert = require('assert');
const path = require('path');
const { evaluateShortlistDecision } = require('../server');

(function run() {
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
