import User from '../models/User.js';
import { structures, quizzes } from '../utils/anatomyData.js';

export function listStructures(_req, res) { res.json({ structures }); }
export function getStructure(req, res) {
  const structure = structures.find((item) => item.id === req.params.id);
  if (!structure) return res.status(404).json({ message: 'Anatomical structure not found.' });
  res.json({ structure });
}
export function listQuizzes(_req, res) {
  res.json({ quizzes: quizzes.map(({ id, title, description, difficulty, questions }) => ({ id, title, description, difficulty, questionCount: questions.length })) });
}
export function getQuiz(req, res) {
  const quiz = quizzes.find((item) => item.id === req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
  res.json({ quiz: { ...quiz, questions: quiz.questions.map(({ id, prompt, options }) => ({ id, prompt, options })) } });
}

export async function toggleBookmark(req, res, next) {
  try {
    const id = String(req.params.id);
    if (!structures.some((item) => item.id === id)) return res.status(404).json({ message: 'Anatomical structure not found.' });
    const exists = req.user.bookmarks.includes(id);
    if (exists) req.user.bookmarks.pull(id); else req.user.bookmarks.addToSet(id);
    await req.user.save();
    res.json({ bookmarked: !exists, bookmarks: req.user.bookmarks });
  } catch (error) { next(error); }
}

export async function submitQuiz(req, res, next) {
  try {
    const quiz = quizzes.find((item) => item.id === req.params.id);
    if (!quiz) return res.status(404).json({ message: 'Quiz not found.' });
    const answers = req.body.answers;
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return res.status(400).json({ message: 'Answers must be an object mapping question IDs to option indexes.' });
    const results = quiz.questions.map((question) => {
      const submitted = Number(answers[question.id]);
      const correct = Number.isInteger(submitted) && submitted === question.answerIndex;
      return { questionId: question.id, correct, correctIndex: question.answerIndex, explanation: question.explanation };
    });
    const score = results.filter((result) => result.correct).length;
    req.user.quizAttempts.push({ quizId: quiz.id, score, total: quiz.questions.length });
    await req.user.save();
    res.json({ score, total: quiz.questions.length, percentage: Math.round((score / quiz.questions.length) * 100), results, attempts: req.user.quizAttempts.length });
  } catch (error) { next(error); }
}

export async function dashboard(req, res, next) {
  try {
    const attempts = req.user.quizAttempts;
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
    const totalCorrect = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    res.json({ stats: { bookmarks: req.user.bookmarks.length, quizAttempts: attempts.length, averageScore: totalQuestions ? Math.round(totalCorrect / totalQuestions * 100) : 0 }, recentAttempts: attempts.slice(-5).reverse(), bookmarkedStructures: structures.filter((item) => req.user.bookmarks.includes(item.id)) });
  } catch (error) { next(error); }
}
