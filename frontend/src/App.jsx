import { useMemo, useState } from 'react';

const defaultJobDescription = `We are hiring a Frontend Engineer with experience in React, TypeScript, JavaScript, Node.js, REST APIs, SQL, and MongoDB. Candidates should be comfortable with testing, CI/CD, Git, Docker, communication, and problem solving. Experience with AWS, HTML, CSS, and agile delivery is a plus.`;

const skillCatalog = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'SQL',
  'MongoDB',
  'Git',
  'Docker',
  'AWS',
  'REST API',
  'HTML',
  'CSS',
  'Jest',
  'CI/CD',
  'Communication',
  'Leadership',
  'Testing',
  'Agile',
  'Problem Solving',
];

function scoreVerdict(score) {
  if (score >= 80) return 'Strong fit';
  if (score >= 60) return 'Promising match';
  if (score >= 40) return 'Needs more depth';
  return 'Low match';
}

function getFallbackAnalysis({ resumeText = '', jobDescription = '' }) {
  const normalizedResume = resumeText.toLowerCase();
  const normalizedJD = jobDescription.toLowerCase();

  const requiredSkills = skillCatalog.filter((skill) => normalizedJD.includes(skill.toLowerCase()));
  const presentSkills = requiredSkills.filter((skill) => normalizedResume.includes(skill.toLowerCase()));
  const missingSkills = requiredSkills.filter((skill) => !presentSkills.includes(skill));
  const score = requiredSkills.length ? Math.round((presentSkills.length / requiredSkills.length) * 100) : 0;

  return {
    score,
    presentSkills,
    missingSkills,
  };
}

export default function App() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState(defaultJobDescription);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const summaryText = useMemo(() => {
    if (!result) return 'Upload your resume and compare it against the hiring criteria.';
    return `${result.presentSkills.length} skills matched, ${result.missingSkills.length} still missing.`;
  }, [result]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF resume.');
      return;
    }

    setError('');
    setResumeFile(file);
  };

  const handleAnalyze = async () => {
    if (!resumeFile) {
      setError('Select a resume PDF first.');
      return;
    }

    if (!jobDescription.trim()) {
      setError('Add a job description to compare against.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Unable to analyze resume.');
      }

      setResult({
        score: data.score,
        presentSkills: data.presentSkills || [],
        missingSkills: data.missingSkills || [],
      });
    } catch (fetchError) {
      const fallbackText = `Experienced in ${resumeFile.name} with React, TypeScript, JavaScript, Node.js, SQL, communication, testing, and agile workflows.`;
      const fallback = getFallbackAnalysis({
        resumeText: fallbackText,
        jobDescription,
      });
      setResult(fallback);
      setError('Live backend not available, so the app is showing a local fallback demo.');
    } finally {
      setLoading(false);
    }
  };

  const sampleResume = () => {
    const sample = new File(['Sample resume text with JavaScript, React, Node.js, SQL, Git, testing, and communication.'], 'sample-resume.pdf', {
      type: 'application/pdf',
    });
    setResumeFile(sample);
    setJobDescription(defaultJobDescription);
    setError('');
  };

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">🚀</div>
          <div>
            <p className="eyebrow">0 to shipped</p>
            <h1>Resume Parser</h1>
          </div>
        </div>
        <button className="ghost-btn" type="button" onClick={sampleResume}>Try sample</button>
      </header>

      <main className="content-grid">
        <section className="panel upload-panel">
          <div className="panel-header">
            <span className="kicker">Upload</span>
            <h2>Resume + job description</h2>
          </div>

          <label className="upload-box">
            <input type="file" accept="application/pdf" onChange={handleFileChange} />
            <div className="upload-content">
              <span className="upload-icon">📄</span>
              <div>
                <strong>{resumeFile ? resumeFile.name : 'Choose resume PDF'}</strong>
                <p>Upload a single PDF file for analysis.</p>
              </div>
            </div>
          </label>

          <label className="field-label" htmlFor="jd-input">Job description</label>
          <textarea
            id="jd-input"
            className="jd-input"
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            placeholder="Paste the job description here..."
          />

          <button type="button" className="primary-btn" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze resume'}
          </button>

          {error ? <p className="error-text">{error}</p> : null}
        </section>

        <section className="panel results-panel">
          <div className="panel-header">
            <span className="kicker">Results</span>
            <h2>Job fit overview</h2>
          </div>

          {result ? (
            <>
              <div className="score-card">
                <div className="score-ring">
                  <span>{result.score}</span>
                </div>
                <div>
                  <p className="score-label">Ship-readiness score</p>
                  <h3>{scoreVerdict(result.score)}</h3>
                </div>
              </div>

              <div className="status-row">
                <div className="status-box success-box">
                  <span>✅ Present</span>
                  <strong>{result.presentSkills.length}</strong>
                </div>
                <div className="status-box warning-box">
                  <span>⚠️ Missing</span>
                  <strong>{result.missingSkills.length}</strong>
                </div>
              </div>

              <p className="summary-text">{summaryText}</p>

              <div className="skill-columns">
                <div>
                  <h4>Skills present</h4>
                  <div className="badge-list">
                    {result.presentSkills.length ? (
                      result.presentSkills.map((skill) => (
                        <span key={skill} className="badge success-badge">{skill}</span>
                      ))
                    ) : (
                      <p className="empty-copy">No matching skills detected yet.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4>Skills missing</h4>
                  <div className="badge-list">
                    {result.missingSkills.length ? (
                      result.missingSkills.map((skill) => (
                        <span key={skill} className="badge warn-badge">{skill}</span>
                      ))
                    ) : (
                      <p className="empty-copy">Everything looks covered.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Your analysis will appear here.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
