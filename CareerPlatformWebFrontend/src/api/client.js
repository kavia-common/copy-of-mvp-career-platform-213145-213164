import axios from 'axios';

// Ensure the base URL always points at the FastAPI versioned routes (/api/v1)
// Supports REACT_APP_API_URL, REACT_APP_API_BASE, or REACT_APP_BACKEND_URL.
// If not provided, fall back to relative '/api/v1' which will use CRA proxy in dev.
function computeBaseURL() {
  const raw =
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_API_BASE ||
    process.env.REACT_APP_BACKEND_URL ||
    '';

  if (!raw) return '/api/v1';
  try {
    const url = new URL(raw, window.location.origin);
    const endsWithV1 = url.pathname.endsWith('/api/v1') || url.pathname.endsWith('/api/v1/');
    url.pathname = endsWithV1 ? url.pathname.replace(/\/$/, '') : `${url.pathname.replace(/\/$/, '')}/api/v1`;
    return url.toString().replace(/\/$/, '');
  } catch {
    const path = raw.replace(/\/$/, '');
    return path.endsWith('/api/v1') ? path : `${path}/api/v1`;
  }
}

const BASE_URL = computeBaseURL();

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
  /** Authenticate user and return JWT token string. Uses /auth/login (FastAPI). Normalizes to { token }. */
  const res = await tryEndpoints(['/auth/login'], 'post', { email, password });
  const data = res?.data || {};
  // FastAPI backend returns { access_token, token_type }
  if (data.access_token) {
    return { token: data.access_token, token_type: data.token_type || 'bearer' };
  }
  // Fallbacks for other shapes (if backend changes)
  if (data.token) return data;
  if (data.accessToken) return { token: data.accessToken };
  return data;
}

// PUBLIC_INTERFACE
export async function register(user) {
  /** Register user; expects {email, password, full_name?}. Uses /auth/register (FastAPI). */
  const res = await tryEndpoints(['/auth/register'], 'post', user);
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
  const res = await tryEndpoints(['/roles'], 'get');
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
export async function getCompetencies(roleId = null) {
  /** Retrieve competencies. If roleId provided, uses by-role with required levels from backend. */
  if (roleId != null) {
    const params = new URLSearchParams();
    params.set('role_id', String(roleId));
    const res = await tryEndpoints(
      [`/competencies/by-role?${params.toString()}`, '/competencies'],
      'get'
    );
    return res.data;
  }
  const res = await tryEndpoints(['/competencies'], 'get');
  return res.data;
}

 // PUBLIC_INTERFACE
export async function submitAssessment(competencies, { targetRoleId = null } = {}) {
  /** Submit competency assessment.
   * Primary: POST /competency-assessment with shape { target_role_id?, competencies: [{competency_id, level}] }
   * Fallback: POST /competencies/assess with a looser array shape for broader compatibility.
   */
  // Normalize to API v1 expected shape
  const normalized = Array.isArray(competencies)
    ? competencies.map((c) => {
        const idNum =
          typeof c.id === 'number'
            ? c.id
            : Number.isFinite(Number(c.id))
            ? Number(c.id)
            : c.competency_id;
        const levelNum =
          typeof c.proficiencyLevel === 'number'
            ? c.proficiencyLevel
            : Number.isFinite(Number(c.level))
            ? Number(c.level)
            : 0;
        return { competency_id: idNum, level: levelNum };
      }).filter((x) => Number.isFinite(x?.competency_id))
    : [];

  const payloadV1 = {
    ...(targetRoleId != null ? { target_role_id: Number(targetRoleId) } : {}),
    competencies: normalized
  };

  try {
    const res = await tryEndpoints(['/competency-assessment'], 'post', payloadV1);
    return res.data;
  } catch {
    // Broad fallback to older/alternate endpoint shapes
    const fallbackArray = Array.isArray(competencies)
      ? competencies.map((c) => ({
          id: c.id ?? c.competency_id,
          competency_id: c.competency_id ?? c.id,
          level: c.proficiencyLevel ?? c.level ?? 0,
          name: c.name
        }))
      : competencies;
    const res = await tryEndpoints(['/competencies/assess'], 'post', fallbackArray);
    return res.data;
  }
}

 // PUBLIC_INTERFACE
export async function performGapAnalysis(currentCompetencies, targetRoleId) {
  /** Perform gap analysis for current competencies vs target role.
   * Primary: snake_case keys per /api/v1/gap-analysis (GapAnalysisRequest).
   * Fallback: camelCase keys for broader compatibility.
   */
  const normalized = Array.isArray(currentCompetencies)
    ? currentCompetencies.map((c) => {
        const idNum =
          typeof c.id === 'number'
            ? c.id
            : Number.isFinite(Number(c.id))
            ? Number(c.id)
            : c.competency_id;
        const levelNum =
          typeof c.proficiencyLevel === 'number'
            ? c.proficiencyLevel
            : Number.isFinite(Number(c.level))
            ? Number(c.level)
            : 0;
        return { competency_id: idNum, level: levelNum };
      }).filter((x) => Number.isFinite(x?.competency_id))
    : [];

  const snake = {
    target_role_id: Number(targetRoleId),
    current_competencies: normalized
  };

  try {
    const res = await tryEndpoints(['/gap-analysis'], 'post', snake);
    return res.data;
  } catch {
    const camel = {
      currentCompetencies,
      targetRoleId
    };
    const res = await tryEndpoints(['/gap-analysis'], 'post', camel);
    return res.data;
  }
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
  const res = await tryEndpoints(['/admin/templates'], 'get');
  return res.data;
}

// PUBLIC_INTERFACE
export async function createTemplate(template) {
  /** Admin: create/edit template. */
  const res = await tryEndpoints(['/admin/templates'], 'post', template);
  return res.data;
}

// PUBLIC_INTERFACE
export async function getAuditLogs() {
  /** Admin: retrieve audit logs. Prefer /admin/audit-logs (FastAPI). */
  const res = await tryEndpoints(['/admin/audit-logs', '/admin/audit-log', '/audit-logs'], 'get');
  return res.data;
}

// PUBLIC_INTERFACE
export async function getRoleAdjacency(role, { limit = 10, min_score = 0.0 } = {}) {
  /** Get adjacent role suggestions for a given role (name or ID). */
  const params = new URLSearchParams();
  params.set('role', String(role));
  if (limit != null) params.set('limit', String(limit));
  if (min_score != null) params.set('min_score', String(min_score));
  const res = await tryEndpoints([`/role-adjacency?${params.toString()}`], 'get');
  return res.data; // { role, total, items: [{ role, score, ...}] }
}

// PUBLIC_INTERFACE
export async function getRoleAdjacencyDetails(currentRole, targetRole) {
  /** Get detailed adjacency comparison for two roles. */
  const params = new URLSearchParams();
  params.set('current_role', String(currentRole));
  params.set('target_role', String(targetRole));
  const res = await tryEndpoints([`/role-adjacency/details?${params.toString()}`], 'get');
  return res.data;
}

export { BASE_URL };
export default api;
