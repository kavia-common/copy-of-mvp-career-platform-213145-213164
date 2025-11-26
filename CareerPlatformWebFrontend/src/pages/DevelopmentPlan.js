import React, { useEffect, useState } from 'react';
import { generateDevelopmentPlan, exportDevelopmentPlan } from '../api/client';
import { useJourney } from '../context/JourneyContext';
import { useNavigate } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * DevelopmentPlan generates plan from gap analysis and enables export.
 */
export default function DevelopmentPlan() {
  const navigate = useNavigate();
  const { gapResult, developmentPlan, setDevelopmentPlan } = useJourney();
  const [loading, setLoading] = useState(!developmentPlan);
  const [error, setError] = useState('');
  const [exportUrl, setExportUrl] = useState('');

  useEffect(() => {
    if (!gapResult) {
      navigate('/gap');
      return;
    }
    if (developmentPlan) return;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await generateDevelopmentPlan(gapResult);
        setDevelopmentPlan(data);
      } catch (err) {
        setError(err?.message || 'Failed to generate development plan');
      } finally {
        setLoading(false);
      }
    })();
  }, [gapResult, developmentPlan, setDevelopmentPlan, navigate]);

  async function handleExport(format = 'link') {
    try {
      const data = await exportDevelopmentPlan(format);
      const url = data?.url || data?.exportLink || '';
      setExportUrl(url);
      if (format === 'pdf' && url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setError(err?.message || 'Export failed');
    }
  }

  const plan = developmentPlan || {};
  const steps = plan.steps || plan.actions || [];

  return (
    <div className="page">
      <div className="container">
        <h1>Development plan</h1>
        {loading && <div role="status" aria-live="polite">Generating plan…</div>}
        {error && <div className="error" role="alert">{error}</div>}
        {!loading && !error && (
          <>
            <ol className="plan-list">
              {steps.map((s, idx) => (
                <li key={idx} className="card">{typeof s === 'string' ? s : s?.description}</li>
              ))}
            </ol>
            <div className="form-actions">
              <button className="btn" onClick={() => handleExport('link')}>Get Shareable Link</button>
              <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>Export as PDF</button>
            </div>
            {exportUrl && (
              <div className="info" role="status" aria-live="polite">
                Shareable URL: <a href={exportUrl} target="_blank" rel="noreferrer">{exportUrl}</a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
