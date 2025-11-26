import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { performGapAnalysis } from '../api/client';
import { useJourney } from '../context/JourneyContext';

/**
 * PUBLIC_INTERFACE
 * GapAnalysis computes and displays gaps; provides a way to continue to a plan.
 */
export default function GapAnalysis() {
  const navigate = useNavigate();
  const { targetRoleId, assessment, gapResult, setGapResult } = useJourney();

  const [loading, setLoading] = useState(!gapResult);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!targetRoleId || !assessment?.length) {
      navigate('/assessment');
      return;
    }

    if (gapResult) return; // already computed

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await performGapAnalysis(assessment, targetRoleId);
        setGapResult(data);
      } catch (err) {
        setError(err?.message || 'Failed to perform gap analysis');
      } finally {
        setLoading(false);
      }
    })();
  }, [assessment, targetRoleId, gapResult, setGapResult, navigate]);

  const gaps = gapResult?.gaps || [];

  return (
    <div className="page">
      <div className="container">
        <h1>Gap analysis</h1>
        {loading && <div role="status" aria-live="polite">Analyzing gaps…</div>}
        {error && <div className="error" role="alert">{error}</div>}

        {!loading && !error && (
          <>
            {gaps.length === 0 ? (
              <div className="success" role="status">No significant gaps found 🎉</div>
            ) : (
              <div className="gap-list">
                {gaps.map((g, idx) => (
                  <div key={g.id || idx} className="card">
                    <h3 className="card-title">{g.name || g.competencyId || 'Competency'}</h3>
                    <p className="card-subtitle">
                      Current: {g.currentLevel ?? g.proficiencyLevel ?? 'N/A'} • Required: {g.requiredLevel ?? 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={() => navigate('/plan')}>Generate Development Plan</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
