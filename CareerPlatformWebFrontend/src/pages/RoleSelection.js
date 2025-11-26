import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRoles, selectRoles } from '../api/client';
import { useJourney } from '../context/JourneyContext';

/**
 * PUBLIC_INTERFACE
 * RoleSelection lets user pick current and target roles from backend-provided list.
 */
export default function RoleSelection() {
  const navigate = useNavigate();
  const { currentRoleId, setCurrentRoleId, targetRoleId, setTargetRoleId, setAssessment, setGapResult, setDevelopmentPlan } = useJourney();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          <form onSubmit={handleNext} className="form grid-2">
            <div className="form-group">
              <label htmlFor="current-role">Current role</label>
              <select
                id="current-role"
                value={currentRoleId || ''}
                onChange={(e) => setCurrentRoleId(e.target.value)}
                required
              >
                <option value="" disabled>Select current role</option>
                {roles.map((r) => (
                  <option key={r.id || r.name} value={r.id || r.name}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="target-role">Target role</label>
              <select
                id="target-role"
                value={targetRoleId || ''}
                onChange={(e) => setTargetRoleId(e.target.value)}
                required
              >
                <option value="" disabled>Select target role</option>
                {roles.map((r) => (
                  <option key={r.id || r.name} value={r.id || r.name}>{r.name}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={!currentRoleId || !targetRoleId}>
                Continue to Assessment
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
