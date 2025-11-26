import React, { useEffect, useState } from 'react';
import { getAuditLogs } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * AdminAuditLogs displays a simple table of audit log entries.
 */
export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAuditLogs();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="page">
      <div className="container">
        <h1>Audit logs (Admin)</h1>
        {loading && <div role="status">Loading…</div>}
        {error && <div className="error" role="alert">{error}</div>}
        {!loading && (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l, idx) => (
                  <tr key={l.id || idx}>
                    <td>{l.created_at || l.timestamp || ''}</td>
                    <td>{l.user || l.user_id || l.userId || ''}</td>
                    <td>{l.action || ''}</td>
                    <td>{[(l.entity_type || l.entityType), (l.entity_id || l.entityId)].filter(Boolean).join(':')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
