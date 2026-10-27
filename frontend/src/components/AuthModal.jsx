import React, { useState } from 'react';
import { X, Activity, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api.js';

export default function AuthModal({ mode: initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const { data } = await api.post(`/auth/${mode === 'login' ? 'login' : 'register'}`, form);
      onSuccess(data.user);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={19}/></button>
      <div className="brand-mark auth-brand"><Activity size={22}/></div>
      <p className="eyebrow">YOUR PERSONAL ANATOMY LAB</p>
      <h2 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your lab account'}</h2>
      <p className="muted">{mode === 'login' ? 'Pick up where your learning left off.' : 'Save your discoveries and track your progress.'}</p>
      <form onSubmit={submit} className="auth-form">
        {mode === 'register' && <label>Full name<input autoComplete="name" required minLength={2} maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Alex Morgan"/></label>}
        <label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"/></label>
        <label>Password<div className="password-input"><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'register' ? 8 : 1} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button full-button" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in to AnatomyXR' : 'Create account'}</button>
      </form>
      <p className="auth-switch">{mode === 'login' ? "New to AnatomyXR?" : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Log in'}</button></p>
    </section>
  </div>;
}
