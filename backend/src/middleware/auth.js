import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.anatomyxr_token;
    if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Account not found. Please log in again.' });
    req.user = user;
    next();
  } catch {
    res.clearCookie('anatomyxr_token', cookieOptions());
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }
}

export function cookieOptions() {
  const production = process.env.NODE_ENV === 'production';
  return { httpOnly: true, secure: production, sameSite: production ? 'none' : 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 };
}
