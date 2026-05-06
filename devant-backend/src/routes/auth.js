const router = require('express').Router();
const axios = require('axios');
const pool = require('../db/pool');
const { createGitHubServices } = require('../integrations/github/services');

const decodeAppToken = (token) => {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
};

const getSupabaseUserFromToken = async (token) => {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey || !token) return null;

  try {
    const userRes = await axios.get(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
    });
    return userRes.data || null;
  } catch {
    return null;
  }
};

const resolveLocalUserFromToken = async (token) => {
  if (!token) return null;

  const decoded = decodeAppToken(token);
  if (decoded?.sub) {
    const result = await pool.query(
      'SELECT id, provider, email, name, avatar_url, github_login, github_connected, created_at FROM users WHERE id = $1',
      [decoded.sub]
    );
    if (result.rows[0]) return result.rows[0];
  }

  const supabaseUser = await getSupabaseUserFromToken(token);
  if (!supabaseUser?.id || !supabaseUser?.email) return null;

  const userResult = await pool.query(
    `INSERT INTO users (provider, provider_id, email, name, avatar_url, google_id, oauth_token)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (provider, provider_id)
     DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       avatar_url = EXCLUDED.avatar_url,
       google_id = EXCLUDED.google_id,
       oauth_token = EXCLUDED.oauth_token,
       updated_at = NOW()
     RETURNING id, provider, email, name, avatar_url, github_login, github_connected, created_at`,
    [
      'google',
      supabaseUser.id,
      supabaseUser.email,
      supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email,
      supabaseUser.user_metadata?.avatar_url || null,
      supabaseUser.id,
      JSON.stringify({ access_token: token, provider: 'google', source: 'supabase' }),
    ]
  );

  return userResult.rows[0] || null;
};

// ── Diagnostic endpoint (remove in production) ──────────────
router.get('/debug', (req, res) => {
  res.json({
    github_client_id: process.env.GITHUB_CLIENT_ID ? '✅ SET' : '❌ MISSING',
    github_client_secret: process.env.GITHUB_CLIENT_SECRET ? '✅ SET' : '❌ MISSING',
    google_client_id: process.env.GOOGLE_CLIENT_ID ? '✅ SET' : '❌ MISSING',
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET ? '✅ SET' : '❌ MISSING',
    supabase_url: process.env.SUPABASE_URL ? '✅ SET' : '❌ MISSING',
    supabase_anon_key: process.env.SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING',
    backend_url: process.env.BACKEND_URL || 'Not set (will use http://localhost:3001)',
    frontend_url: process.env.FRONTEND_URL || 'Not set',
    database_url: process.env.DATABASE_URL ? '✅ SET' : '❌ MISSING',
  });
});

// Provide expected OAuth callback (helpful for diagnosing redirect_uri mismatches)
router.get('/debug-callback', (req, res) => {
  const configured = process.env.BACKEND_URL;
  const backendBase = configured ? configured.replace(/\/$/, '') : `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
  const expected = `${backendBase}/api/auth/callback`;
  res.json({ expected_oauth_callback: expected });
});

const getFrontendCallbackUrl = () => {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  // Frontend uses BrowserRouter, so OAuth callbacks must target a path route.
  return `${frontendUrl}/auth/callback`;
};

const getBackendBaseUrl = (req) => {
  const configured = process.env.BACKEND_URL;
  if (configured) return configured.replace(/\/$/, '');

  const forwardedProto = (req.get('x-forwarded-proto') || req.protocol || 'https').split(',')[0].trim();
  const forwardedHost = (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim();
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '');
  }

  return 'http://localhost:3001';
};

// ── OAuth Flow ──────────────────────────────────────────────
// Step 1: Redirect user to GitHub/Google OAuth
router.get('/github', (req, res) => {
  const { mode = 'login', redirect, token } = req.query;
  // Fast-fail if GitHub env not configured to give clear frontend error
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    const frontendCallbackUrl = getFrontendCallbackUrl();
    const message = 'GitHub OAuth not configured on backend (missing GITHUB_CLIENT_ID/SECRET)';
    return res.redirect(`${frontendCallbackUrl}?error=${encodeURIComponent(message)}`);
  }
  const backendBaseUrl = getBackendBaseUrl(req);
  const redirectUri = `${backendBaseUrl}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    scope: 'repo read:org user:email',
    state: JSON.stringify({ mode, redirect, token }),
    allow_signup: true,
    redirect_uri: redirectUri,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/google', (req, res) => {
  const { mode = 'login', redirect } = req.query;
  // Fast-fail if Google env not configured to avoid invalid_client pages
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const frontendCallbackUrl = getFrontendCallbackUrl();
    const message = 'Google OAuth not configured on backend (missing GOOGLE_CLIENT_ID/SECRET)';
    return res.redirect(`${frontendCallbackUrl}?error=${encodeURIComponent(message)}`);
  }
  const backendBaseUrl = getBackendBaseUrl(req);
  const redirectUri = `${backendBaseUrl}/api/auth/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: JSON.stringify({ mode, redirect, provider: 'google' }),
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Step 2: OAuth providers redirect back with code
router.get('/callback', async (req, res, next) => {
  try {
    const { code, state, error, error_description } = req.query;
    const backendBaseUrl = getBackendBaseUrl(req);
    const redirectUri = `${backendBaseUrl}/api/auth/callback`;

    // Handle OAuth errors
    if (error) {
      return res.redirect(`${getFrontendCallbackUrl()}?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    let stateData;
    try {
      stateData = JSON.parse(state);
    } catch {
      stateData = { mode: 'login', redirect: '/' };
    }

    const { mode, redirect, token: appToken, provider = 'github' } = stateData;
    let userData;
    let tokenData;

    if (provider === 'google') {
      // Exchange Google code for tokens
      const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      });

      const accessToken = tokenRes.data.access_token;
      if (!accessToken) throw new Error('Failed to get Google access token');

      // Get Google user info
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      userData = {
        provider: 'google',
        id: userRes.data.id,
        email: userRes.data.email,
        name: userRes.data.name,
        avatar_url: userRes.data.picture,
      };
      tokenData = { access_token: accessToken, provider: 'google' };
    } else {
      // Exchange GitHub code for access token
      const tokenRes = await axios.post(
        'https://github.com/login/oauth/access_token',
        new URLSearchParams({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }).toString(),
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const accessToken = tokenRes.data.access_token;
      
      // Better error handling for GitHub response
      if (tokenRes.data.error) {
        console.error('[AUTH] GitHub OAuth error:', {
          error: tokenRes.data.error,
          error_description: tokenRes.data.error_description,
          error_uri: tokenRes.data.error_uri,
          client_id: process.env.GITHUB_CLIENT_ID,
        });
        throw new Error(`GitHub OAuth failed: ${tokenRes.data.error_description || tokenRes.data.error}`);
      }
      
      if (!accessToken) {
        console.error('[AUTH] No access token in GitHub response:', tokenRes.data);
        throw new Error('Failed to get GitHub access token');
      }

      // Get GitHub user and email info via centralized OpenAPI-driven client.
      const github = createGitHubServices(accessToken);
      const userRes = await github.client.request('users/get-authenticated', {});

      // Primary email can be null for some accounts; fetch verified primary as fallback.
      let githubEmail = userRes.data.email || null;
      if (!githubEmail) {
        try {
          const emailRes = await github.client.request('users/list-emails-for-authenticated-user', {
            query: { per_page: 100, page: 1 },
          });
          if (Array.isArray(emailRes.data)) {
            const primary = emailRes.data.find((e) => e?.primary && e?.verified) || emailRes.data.find((e) => e?.verified) || emailRes.data[0];
            githubEmail = primary?.email || null;
          }
        } catch (emailErr) {
          console.warn('[AUTH] Unable to fetch GitHub email fallback:', emailErr.message);
        }
      }

      userData = {
        provider: 'github',
        id: userRes.data.id,
        email: githubEmail,
        name: userRes.data.name || userRes.data.login,
        github_login: userRes.data.login,
        avatar_url: userRes.data.avatar_url,
      };
      tokenData = { access_token: accessToken, provider: 'github' };
    }

    let user;

    if (provider === 'google' && mode === 'connect' && appToken) {
      const currentUser = await resolveLocalUserFromToken(appToken);
      if (currentUser) {
        const updated = await pool.query(
          `UPDATE users SET
             provider = $1,
             provider_id = $2,
             email = $3,
             name = $4,
             avatar_url = $5,
             google_id = $6,
             oauth_token = $7,
             updated_at = NOW()
           WHERE id = $8
           RETURNING id, provider, email, name, avatar_url, github_login, github_connected, created_at`,
          [
            'google',
            userData.id,
            userData.email,
            userData.name,
            userData.avatar_url,
            userData.id,
            JSON.stringify(tokenData),
            currentUser.id,
          ]
        );
        user = updated.rows[0];
      }
    }

    if (!user) {
      const isGithubProvider = provider === 'github';
      const query = `
        INSERT INTO users (provider, provider_id, email, name, avatar_url, ${isGithubProvider ? 'github_login, github_connected' : 'google_id'}, oauth_token)
        VALUES ($1, $2, $3, $4, $5, ${isGithubProvider ? '$6, TRUE, $7' : '$6, $7'})
        ON CONFLICT (provider, provider_id) 
        DO UPDATE SET 
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          avatar_url = EXCLUDED.avatar_url,
          ${isGithubProvider ? 'github_login = EXCLUDED.github_login, github_connected = TRUE,' : 'google_id = EXCLUDED.google_id,'}
          oauth_token = EXCLUDED.oauth_token,
          updated_at = NOW()
        RETURNING id, provider, email, name, avatar_url, github_login, github_connected, created_at;
      `;

      const result = await pool.query(query, [
        userData.provider,
        userData.id,
        userData.email,
        userData.name,
        userData.avatar_url,
        isGithubProvider ? userData.github_login : userData.id,
        JSON.stringify(tokenData),
      ]);

      user = result.rows[0];
    }

    // Create JWT token
    const jwtToken = Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        name: user.name,
        provider: userData.provider,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days
      })
    ).toString('base64');

    // Redirect to frontend with token
    const frontendCallbackUrl = getFrontendCallbackUrl();
    const userParam = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        github_login: user.github_login,
        github_connected: user.github_connected,
        provider: userData.provider,
      })
    );
    const next_url = redirect || '/';
    res.redirect(`${frontendCallbackUrl}?token=${jwtToken}&user=${userParam}&next=${encodeURIComponent(next_url)}`);
  } catch (err) {
    // Log richer axios error info for diagnostics (do not expose to frontend)
    try {
      console.error('[AUTH CALLBACK ERROR]', {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
        stack: err.stack,
      });
    } catch (logErr) {
      console.error('[AUTH CALLBACK ERROR] (failed to serialize error)', err);
    }

    // Keep frontend-facing message succinct to avoid leaking internals
    const safeMessage = err.response?.data?.error || err.message || 'Authentication failed';
    return res.redirect(`${getFrontendCallbackUrl()}?error=${encodeURIComponent(safeMessage)}`);
  }
});

// ── Get current user ─────────────────────────────────────────
router.get('/me', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token provided' });

    let decoded;
    try {
      const decoded_str = Buffer.from(token, 'base64').toString('utf-8');
      decoded = JSON.parse(decoded_str);
    } catch {
      decoded = null;
    }

    // Verify token expiration
    if (decoded?.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (decoded?.sub) {
      const result = await pool.query(
        'SELECT id, email, name, avatar_url, github_login, github_connected, provider FROM users WHERE id = $1',
        [decoded.sub]
      );

      if (result.rows[0]) {
        return res.json(result.rows[0]);
      }
    }

    const localUser = await resolveLocalUserFromToken(token);
    if (!localUser) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json(localUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
