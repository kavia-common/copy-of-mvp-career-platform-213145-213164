import React, { useEffect, useState } from 'react';
import { createTemplate, getTemplates } from '../api/client';

/**
 * PUBLIC_INTERFACE
 * AdminTemplates lists templates and provides a simple create form.
 */
export default function AdminTemplates() {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await getTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await createTemplate({ name, content });
      setName('');
      setContent('');
      setMsg('Template saved');
      refresh();
    } catch (err) {
      setError(err?.message || 'Failed to save template');
    }
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Templates (Admin)</h1>
        {loading && <div role="status">Loading…</div>}
        {error && <div className="error" role="alert">{error}</div>}
        {!loading && (
          <>
            <ul className="list">
              {templates.map((t) => (
                <li key={t.id || t.name} className="card">
                  <strong>{t.name}</strong>
                  {t.content && <p className="muted">{String(t.content).slice(0, 120)}{String(t.content).length > 120 ? '…' : ''}</p>}
                </li>
              ))}
            </ul>
            <h2>Create template</h2>
            <form onSubmit={handleCreate} className="form">
              <div className="form-group">
                <label htmlFor="tpl-name">Name</label>
                <input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="tpl-content">Content</label>
                <textarea id="tpl-content" value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
              </div>
              <button type="submit" className="btn btn-primary">Save Template</button>
              {msg && <div className="success" role="status">{msg}</div>}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
