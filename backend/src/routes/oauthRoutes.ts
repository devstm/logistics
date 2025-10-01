import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateUserLogin } from '../middleware/validation';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();
const userController = new UserController();

// OAuth 2.0 Authorization endpoint - for Supabase to redirect users to
router.get('/authorize', (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    scope,
    state,
    response_type = 'code'
  } = req.query;

  // Validate required OAuth parameters
  if (!client_id || !redirect_uri || !state) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing required parameters: client_id, redirect_uri, state'
    });
  }

  // Store OAuth state in session/cookie for security
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: config.environment === 'production',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  // Render login page with OAuth context
  const loginUrl = `/oauth/login?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri as string)}&scope=${scope}&state=${state}`;

  res.redirect(loginUrl);
});

// OAuth login page endpoint
router.get('/login', (req: Request, res: Response) => {
  const { client_id, redirect_uri, scope, state } = req.query;

  // Return a simple HTML login form
  const loginForm = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Gaza Logistics - Login</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
            input, button { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #007bff; color: white; border: none; cursor: pointer; }
            button:hover { background: #0056b3; }
            .error { color: red; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h2>Gaza Logistics Login</h2>
        <form id="loginForm">
            <input type="email" id="email" placeholder="Email" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Login</button>
            <div id="error" class="error"></div>
        </form>

        <script>
            document.getElementById('loginForm').onsubmit = async function(e) {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const errorDiv = document.getElementById('error');

                try {
                    const response = await fetch('/api/oauth/authenticate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email,
                            password,
                            client_id: '${client_id}',
                            redirect_uri: '${redirect_uri}',
                            scope: '${scope}',
                            state: '${state}'
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        window.location.href = data.redirect_url;
                    } else {
                        errorDiv.textContent = data.error_description || 'Login failed';
                    }
                } catch (error) {
                    errorDiv.textContent = 'Network error occurred';
                }
            };
        </script>
    </body>
    </html>
  `;

  res.send(loginForm);
});

// OAuth authentication endpoint - processes login and returns authorization code
router.post('/authenticate', validateUserLogin, async (req: Request, res: Response) => {
  try {
    const { email, password, client_id, redirect_uri, scope, state } = req.body;

    // Validate OAuth state
    const storedState = req.cookies.oauth_state;
    if (!storedState || storedState !== state) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Invalid or missing state parameter'
      });
    }

    // Authenticate user using existing login logic
    const loginResult = await userController.authenticateUser(email, password);

    if (!loginResult.success) {
      return res.status(401).json({
        error: 'invalid_grant',
        error_description: 'Invalid email or password'
      });
    }

    // Generate authorization code (short-lived, single-use)
    const authCode = jwt.sign(
      {
        userId: loginResult.user.id,
        email: loginResult.user.email,
        client_id,
        scope,
        type: 'authorization_code'
      },
      config.jwt.secret,
      { expiresIn: '10m' } // Short-lived auth code
    );

    // Clear OAuth state cookie
    res.clearCookie('oauth_state');

    // Build redirect URL with authorization code
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.append('code', authCode);
    redirectUrl.searchParams.append('state', state as string);

    res.json({
      success: true,
      redirect_url: redirectUrl.toString()
    });

  } catch (error) {
    console.error('OAuth authentication error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    });
  }
});

// OAuth token endpoint - exchanges authorization code for access token
router.post('/token', async (req: Request, res: Response) => {
  try {
    const {
      grant_type,
      code,
      client_id,
      client_secret,
      redirect_uri
    } = req.body;

    // Validate grant type
    if (grant_type !== 'authorization_code') {
      return res.status(400).json({
        error: 'unsupported_grant_type',
        error_description: 'Only authorization_code grant type is supported'
      });
    }

    // Validate required parameters
    if (!code || !client_id) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required parameters'
      });
    }

    // Verify authorization code
    let decoded;
    try {
      decoded = jwt.verify(code, config.jwt.secret) as any;
    } catch (error) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code'
      });
    }

    // Validate code type and client_id
    if (decoded.type !== 'authorization_code' || decoded.client_id !== client_id) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Invalid authorization code'
      });
    }

    // Generate access token (longer-lived)
    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        type: 'access_token',
        scope: decoded.scope
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        type: 'refresh_token'
      },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: decoded.scope || 'openid profile email'
    });

  } catch (error) {
    console.error('OAuth token error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    });
  }
});

// OAuth user info endpoint - returns user profile
router.get('/userinfo', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Get user profile using existing controller
    const userProfile = await userController.getUserProfile(req.userId!);

    if (!userProfile) {
      return res.status(404).json({
        error: 'user_not_found',
        error_description: 'User profile not found'
      });
    }

    // Return user info in OpenID Connect format
    res.json({
      sub: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      preferred_username: userProfile.email,
      email_verified: true,
      roles: [userProfile.role],
      tenant_id: userProfile.tenantId
    });

  } catch (error) {
    console.error('OAuth userinfo error:', error);
    res.status(500).json({
      error: 'server_error',
      error_description: 'Internal server error'
    });
  }
});

// OAuth discovery endpoint (OIDC well-known configuration)
router.get('/.well-known/openid_configuration', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/api/oauth`;

  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/authorize`,
    token_endpoint: `${baseUrl}/token`,
    userinfo_endpoint: `${baseUrl}/userinfo`,
    jwks_uri: `${baseUrl}/jwks`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    scopes_supported: ['openid', 'profile', 'email'],
    claims_supported: ['sub', 'email', 'name', 'preferred_username', 'email_verified', 'roles', 'tenant_id']
  });
});

// JWKS endpoint for token verification
router.get('/jwks', (req: Request, res: Response) => {
  // This is a simplified JWKS endpoint
  // In production, you should use proper key management
  res.json({
    keys: [
      {
        kty: 'oct',
        use: 'sig',
        kid: 'gaza-logistics-key',
        alg: 'HS256',
        k: Buffer.from(config.jwt.secret).toString('base64url')
      }
    ]
  });
});

export default router;