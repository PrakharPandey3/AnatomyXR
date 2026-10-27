import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { cookieOptions } from '../middleware/auth.js';

function issueSession(user, res) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('anatomyxr_token', token, cookieOptions());
  return res.json({ user: { id: user._id, name: user.name, email: user.email, bookmarks: user.bookmarks, quizAttempts: user.quizAttempts } });
}

export async function register(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 60) return res.status(400).json({ message: 'Name must be between 2 and 60 characters.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return issueSession(user, res);
  } catch (error) { next(error); }
}

export async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    return issueSession(user, res);
  } catch (error) { next(error); }
}

export function logout(_req, res) {
  res.clearCookie('anatomyxr_token', { ...cookieOptions(), maxAge: undefined });
  res.json({ message: 'You have been logged out.' });
}

export function me(req, res) {
  const { _id, name, email, bookmarks, quizAttempts } = req.user;
  res.json({ user: { id: _id, name, email, bookmarks, quizAttempts } });
}
