const Groq = require('groq-sdk');
const pool = require('../db/pool');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Free & fast Groq model — perfect for commit analysis
const GROQ_MODEL = 'llama3-8b-8192';

const RISK_FILES = ['auth', 'payment', 'schema', 'migration', 'config', 'secret', 'env', 'password', 'token'];

async function analyzeCommit(sha, message, filesChanged = []) {
  try {
    // Check if already analyzed
    const { rows } = await pool.query('SELECT ai_analyzed FROM commits WHERE sha=$1', [sha]);
    if (!rows.length || rows[0].ai_analyzed) return;

    // Detect risk flag locally (fast, no API call needed)
    const riskFlag = filesChanged.some(f =>
      RISK_FILES.some(keyword => f.toLowerCase().includes(keyword))
    );

    // Call Groq to analyze commit
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content: 'You are a code analysis assistant. Respond only with valid JSON. No markdown, no backticks, no extra text.',
        },
        {
          role: 'user',
          content: `Analyze this Git commit and return JSON only:
{
  "type_tag": one of [Feature, Bug Fix, Refactor, Chore, Breaking Change],
  "summary": "1-2 sentence plain-English summary for a non-technical manager"
}

Commit message: "${message}"
Files changed: ${filesChanged.slice(0, 10).join(', ') || 'unknown'}`,
        },
      ],
    });

    const text = response.choices[0].message.content.trim();
    let result = { type_tag: 'Chore', summary: message };

    try {
      result = JSON.parse(text);
    } catch {
      // Groq occasionally adds extra text — try extracting JSON block
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { result = JSON.parse(match[0]); } catch { /* use fallback */ }
      }
    }

    await pool.query(
      `UPDATE commits SET
        ai_type_tag=$1, ai_summary=$2, ai_risk_flag=$3, ai_analyzed=true
       WHERE sha=$4`,
      [result.type_tag, result.summary, riskFlag, sha]
    );

    console.log(`✅ Groq analyzed commit ${sha.slice(0, 7)}: ${result.type_tag}`);
  } catch (err) {
    console.error(`❌ Groq analysis failed for ${sha}:`, err.message);
  }
}

// Analyze all unanalyzed commits for a project
async function analyzeProjectCommits(project_id) {
  const { rows } = await pool.query(
    'SELECT sha, message, files_changed FROM commits WHERE project_id=$1 AND ai_analyzed=false LIMIT 20',
    [project_id]
  );
  for (const row of rows) {
    await analyzeCommit(row.sha, row.message, row.files_changed || []);
  }
}

module.exports = { analyzeCommit, analyzeProjectCommits };
