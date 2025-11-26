import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

// Create a pre-configured axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header if JWT exists
api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401s to surface a clearer error
api.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error?.response?.status === 401) {
      // Bubble up a consistent unauthorized error
      return Promise.reject(new Error('Unauthorized'));
    }
    return Promise.reject(error);
  }
);

// INTERNAL: Try multiple endpoints to handle spec differences gracefully
async function tryEndpoints(endpoints, method = 'get', data = undefined, config = {}) {
  let lastError = null;
  for (const ep of endpoints) {
    try {
      const res = await api.request({ url: ep, method, data, ...config });
      return res;
    } catch (err) {
      lastError = err;
      // Try next
    }
  }
  throw lastError;
}

// PUBLIC_INTERFACE
export async function login(email, password) {
  /** Authenticate user and return JWT token string. Tries /auth/login then /login. Normalizes to { token }. */
  const res = await tryEndpoints(['/auth/login', '/login'], 'post', { email, password });
  const data = res?.data || {};
  // FastAPI backend returns { access_token, token_type }
  if (data.access_token) {
    return { token: data.access_token, token_type: data.token_type || 'bearer' };
  }
  // Fallbacks for other shapes
  if (data.token) return data;
  if (data.accessToken) return { token: data.accessToken };
  return data;
}

// PUBLIC_INTERFACE
export async function register(user) {
  /** Register user; expects {email, password, name?}. Tries /auth/register then /register. */
  const res = await tryEndpoints(['/auth/register', '/register'], 'post', user);
  return res.data;
}

// PUBLIC_INTERFACE
export async function logout() {
  /** Logout user (best-effort). Tries /auth/logout then /logout. */
  try {
    await tryEndpoints(['/auth/logout', '/logout'], 'post');
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export async function getProfile() {
  /** Fetch current user profile. Prefer /auth/profile under API v1. */
  const res = await tryEndpoints(['/auth/profile', '/profile'], 'get');
  return res.data;
}

// PUBLIC_INTERFACE
export async function updateProfile(payload) {
  /** Update current user profile. Prefer /auth/profile under API v1. */
  const res = await tryEndpoints(['/auth/profile', '/profile'], 'put', payload);
  return res.data;
}

// PUBLIC_INTERFACE
export async function getRoles() {
  /** Retrieve list of roles. */
  const res = await tryEndpoints(['/roles', '/api/v1/roles'], 'get');
  return res.data;
}

// PUBLIC_INTERFACE
export async function selectRoles(currentRoleId, targetRoleId) {
  /** Submit selected current/target roles (optional, if backend supports). */
  const body = { currentRoleId, targetRoleId };
  const res = await tryEndpoints(['/roles/select'], 'post', body);
  return res.data;
}

// PUBLIC_INTERFACE
export async function getCompetencies() {
  /** Retrieve competencies for selected roles. */
  const res = await tryEndpoints(['/competencies'], 'get');
  return res.data;
}

// PUBLIC_INTERFACE
export async function submitAssessment(competencies) {
  /** Submit competency assessment. Tries /competencies/assess then /competency-assessment. */
  const res = await tryEndpoints(
    ['/competencies/assess', '/competency-assessment'],
    'post',
    competencies
  );
  return res.data;
}

// PUBLIC_INTERFACE
export async function performGapAnalysis(currentCompetencies, targetRoleId) {
  /** Perform gap analysis for current competencies vs target role. */
  const body = { currentCompetencies, targetRoleId };
  const res = await tryEndpoints(['/gap-analysis'], 'post', body);
  return res.data;
}

// PUBLIC_INTERFACE
export async function generateDevelopmentPlan(gapAnalysisResult) {
  /** Generate a development plan based on gap analysis result. */
  const res = await tryEndpoints(['/development-plan'], 'post', gapAnalysisResult);
  return res.data;
}

// PUBLIC_INTERFACE
export async function exportDevelopmentPlan(format = 'link') {
  /** Export the development plan as link or pdf. Tries POST then fallback GET. */
  try {
    const res = await tryEndpoints(['/development-plan/export'], 'post', { format });
    return res.data; // { url } or { exportLink }
  } catch {
    const res = await tryEndpoints(['/development-plan/export'], 'get');
    return res.data;
  }
}

// PUBLIC_INTERFACE
export async function getTemplates() {
  /** Admin: list templates. */
  const res = await tryEndpoints(['/templates'], 'get');
  return res.data;
}

// PUBLIC_INTERFACE
export async function createTemplate(template) {
  /** Admin: create/edit template. */
  const res = await tryEndpoints(['/templates'], 'post', template);
  return res.data;
}

// PUBLIC_INTERFACE
export async function getAuditLogs() {
  /** Admin: retrieve audit logs. Prefer /admin/audit-logs (FastAPI). */
  const res = await tryEndpoints(['/admin/audit-logs', '/admin/audit-log', '/audit-logs'], 'get');
  return res.data;
}

export default api;
