const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    resumeName: { type: String, default: 'unknown.pdf' },
    jobDescription: { type: String, required: true },
    score: { type: Number, required: true },
    presentSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    totalRequiredSkills: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'resume_analyses' }
);

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
