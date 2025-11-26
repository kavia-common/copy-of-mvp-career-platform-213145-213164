import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoles, selectRoles, getRoleAdjacency } from '../api/client';
import { useJourney } from '../context/JourneyContext';

/**
 * PUBLIC_INTERFACE
 * RoleSelection lets user pick current and target roles from backend-provided list,
 * and shows suggested adjacent target roles based on the selected current role.
 * 
 * Notes:
 * - We now always store role selections as numeric IDs to align with backend
 *   endpoints that require integers (e.g., /api/v1/competencies/by-role?role_id=...).
 * - For role adjacency lookups we prefer sending the role name to the backend,
 *   with an ID fallback. This improves hit-rate when the mapping service is
 *   tuned on names but still supports IDs.
 */
export default function RoleSelection() {
  const navigate = useNavigate();
  const {
    currentRoleId,
    setCurrentRoleId,
    targetRoleId,
    setTargetRoleId,
    setAssessment,
    setGapResult,
    setDevelopmentPlan
  } = useJourney();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [adjLoading, setAdjLoading] = useState(false);
  const [adjError, setAdjError] = useState('');
  const [adjSuggestions, setAdjSuggestions] = useState([]); // [{role, score, ...}]

  // Index roles for fast lookup by id and by name
  const rolesById = useMemo(() => {
    const map = new Map();
    roles.forEach((r) => map.set(String(r.id), r));
    return map;
  }, [roles]);

  const rolesByName = useMemo(() => {
    const map = new Map();
    roles.forEach((r) => map.set(String(r.name), r));
    return map;
  }, [roles]);

  useEffect(() => {
    (async () => {
      setError('');
      setLoading(true);
      try {
        const data = await getRoles();
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || 'Failed to load roles');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load adjacency suggestions whenever current role changes (prefer role name)
  useEffect(() => {
    let cancelled = false;
    async function loadAdjacency() {
      if (!currentRoleId) {
        setAdjSuggestions([]);
        return;
      }
      setAdjLoading(true);
      setAdjError('');
      try {
        // Prefer name for better mapping; fallback to ID
        const key = String(currentRoleId);
        const roleObj = rolesById.get(key);
        const roleParam = roleObj?.name ?? currentRoleId;
        const resp = await getRoleAdjacency(roleParam, { limit: 6, min_score: 0.0 });
        const items = Array.isArray(resp?.items) ? resp.items : [];
        if (!cancelled) setAdjSuggestions(items);
      } catch (err) {
        if (!cancelled) {
          setAdjError(err?.message || 'Failed to load role adjacency suggestions');
          setAdjSuggestions([]);
        }
      } finally {
        if (!cancelled) setAdjLoading(false);
      }
    }
    loadAdjacency();
    return () => {
      cancelled = true;
    };
  }, [currentRoleId, rolesById]);

  function onPickSuggestion(roleName) {
    const match = rolesByName.get(String(roleName));
    if (match?.id != null) {
      setTargetRoleId(Number(match.id));
    }
  }

  async function handleNext(e) {
    e.preventDefault();
    if (!currentRoleId || !targetRoleId) return;
    // Clear previous journey state when roles change
    setAssessment([]);
    setGapResult(null);
    setDevelopmentPlan(null);
    try {
      await selectRoles(currentRoleId, targetRoleId);
    } catch {
      // Some backends may not support this endpoint; continue silently.
    }
    navigate('/assessment');
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Select your roles</h1>
        <p className="muted">Choose your current and target role to personalize the journey.</p>

        {loading && <div role="status" aria-live="polite">Loading roles…</div>}
        {error && <div className="error" role="alert">{error}</div>}

        {!loading && !error && (
          <>
            <form onSubmit={handleNext} className="form grid-2">
              <div className="form-group">
                <label htmlFor="current-role">Current role</label>
                <select
                  id="current-role"
                  value={currentRoleId ?? ''}
                  onChange={(e) => setCurrentRoleId(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>Select current role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="target-role">Target role</label>
                <select
                  id="target-role"
                  value={targetRoleId ?? ''}
                  onChange={(e) => setTargetRoleId(Number(e.target.value))}
                  required
                >
                  <option value="" disabled>Select target role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={!currentRoleId || !targetRoleId}>
                  Continue to Assessment
                </button>
              </div>
            </form>

            <div className="card" style={{ marginTop: '1rem' }}>
              <h2 className="card-title">Suggested target roles</h2>
              <p className="card-subtitle">Based on your current role selection</p>
              {adjLoading && <div role="status" aria-live="polite">Loading suggestions…</div>}
              {adjError && <div className="error" role="alert">{adjError}</div>}
              {!adjLoading && !adjError && adjSuggestions.length === 0 && (
                <p className="muted">No suggestions available.</p>
              )}
              {!adjLoading && !adjError && adjSuggestions.length > 0 && (
                <ul className="list" aria-label="Suggested roles">
                  {adjSuggestions.map((s, idx) => (
                    <li
                      key={`${s.role}-${idx}`}
                      className="card"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div>
                        <strong>{s.role}</strong>
                        {typeof s.score === 'number' && (
                          <span className="muted" style={{ marginLeft: '.5rem' }}>
                            Score: {(s.score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="form-actions">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => onPickSuggestion(s.role)}
                          disabled={!rolesByName.has(String(s.role))}
                          aria-disabled={!rolesByName.has(String(s.role))}
                        >
                          Set as target
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!rolesByName.size && (
                <div className="muted">Load roles to enable one-click selection.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
