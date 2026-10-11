const express = require('express');
const multer = require('multer');
const { PDFParse } = require('pdf-parse');
const mongoose = require('mongoose');
const ResumeAnalysis = require('../models/ResumeAnalysis');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const SKILLS = [
  { label: 'JavaScript', aliases: ['javascript', 'js'] },
  { label: 'TypeScript', aliases: ['typescript', 'ts'] },
  { label: 'React', aliases: ['react', 'reactjs'] },
  { label: 'Node.js', aliases: ['node.js', 'nodejs', 'node js', 'node'] },
  { label: 'Python', aliases: ['python'] },
  { label: 'SQL', aliases: ['sql', 'postgres', 'mysql', 'database'] },
  { label: 'MongoDB', aliases: ['mongodb', 'mongo db', 'mongo'] },
  { label: 'Git', aliases: ['git', 'github', 'gitlab'] },
  { label: 'Docker', aliases: ['docker'] },
  { label: 'AWS', aliases: ['aws', 'amazon web services'] },
  { label: 'REST API', aliases: ['rest api', 'restful api', 'api design'] },
  { label: 'HTML', aliases: ['html', 'html5'] },
  { label: 'CSS', aliases: ['css', 'tailwind', 'sass', 'styled components'] },
  { label: 'Jest', aliases: ['jest', 'testing library'] },
  { label: 'CI/CD', aliases: ['ci/cd', 'continuous integration', 'continuous deployment', 'pipeline'] },
  { label: 'Communication', aliases: ['communication', 'stakeholder communication', 'written communication'] },
  { label: 'Leadership', aliases: ['leadership', 'mentoring', 'leading teams'] },
  { label: 'Testing', aliases: ['testing', 'unit tests', 'integration tests'] },
  { label: 'Agile', aliases: ['agile', 'scrum', 'kanban'] },
  { label: 'Problem Solving', aliases: ['problem solving', 'debugging', 'root cause analysis'] },
];

function normalizeText(value = '') {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

function getSkillMatches(text = '') {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return [];

  return SKILLS.filter((skill) =>
    skill.aliases.some((alias) => normalized.includes(alias.toLowerCase()))
  ).map((skill) => skill.label);
}

function computeAnalysis({ resumeText = '', jobDescription = '' }) {
  const requiredSkills = getSkillMatches(jobDescription);
  const resumeSkills = getSkillMatches(resumeText);
  const presentSkills = [...new Set(requiredSkills.filter((skill) => resumeSkills.includes(skill)))];
  const missingSkills = requiredSkills.filter((skill) => !presentSkills.includes(skill));
  const totalRequiredSkills = requiredSkills.length || 0;
  const score = totalRequiredSkills ? Math.round((presentSkills.length / totalRequiredSkills) * 100) : 0;

  return {
    requiredSkills,
    presentSkills,
    missingSkills,
    totalRequiredSkills,
    score,
  };
}

async function extractResumeText(file) {
  if (!file) return '';

  if (file.mimetype !== 'application/pdf' && !file.originalname.toLowerCase().endsWith('.pdf')) {
    throw new Error('Resume must be a PDF file.');
  }

  const parser = new PDFParse({ data: file.buffer });
  const pdfData = await parser.getText();
  return pdfData.text || '';
}

router.get('/health', (_, res) => {
  res.json({
    ok: true,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

router.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    const jobDescription = normalizeText(req.body.jobDescription || req.body.jdText || '');
    const resumeText = normalizeText(req.body.resumeText || '');

    const extractedResumeText = req.file ? await extractResumeText(req.file) : resumeText;
    const combinedResumeText = [resumeText, extractedResumeText].filter(Boolean).join(' ');

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'A job description is required for comparison.',
      });
    }

    if (!combinedResumeText) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume PDF or paste resume text to analyze.',
      });
    }

    const analysis = computeAnalysis({
      resumeText: combinedResumeText,
      jobDescription,
    });

    const payload = {
      resumeName: req.file?.originalname || 'resume.pdf',
      jobDescription,
      score: analysis.score,
      presentSkills: analysis.presentSkills,
      missingSkills: analysis.missingSkills,
      totalRequiredSkills: analysis.totalRequiredSkills,
    };

    if (mongoose.connection.readyState === 1) {
      await ResumeAnalysis.create(payload);
    }

    res.json({
      success: true,
      ...payload,
      requiredSkills: analysis.requiredSkills,
    });
  } catch (error) {
    console.error('Analyze route error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze the resume.',
    });
  }
});

module.exports = router;
