/* score.js — Unified XP / scoring engine */

const Score = (() => {
  const CONSTANTS = {
    QUIZ_CORRECT_BASE: 100,
    QUIZ_TIME_BONUS_MAX: 50,
    QUIZ_DIFFICULTY: { beginner: 1, intermediate: 1.5, advanced: 2 },
    QUIZ_STREAK_BONUS: 25,
    PUZZLE_SOLVE_BASE: 200,
    PUZZLE_HINT_PENALTY: 50,
    PUZZLE_TIME_BONUS_MAX: 100,
    HANGMAN_WIN_BASE: 150,
    HANGMAN_WRONG_PENALTY: 15,
    WORDSEARCH_WORD_BASE: 50,
    ESCAPE_CHAPTER_BASE: 500,
    ESCAPE_ATTEMPT_PENALTY: 50,
  };

  const RANKS = [
    { threshold: 0,    title: 'Junior DBA (Intern)' },
    { threshold: 500,  title: 'DBA' },
    { threshold: 1500, title: 'Senior DBA' },
    { threshold: 3000, title: 'Principal DBA' },
    { threshold: 5000, title: 'Database Architect' },
  ];

  const NEXT_THRESHOLD = [500, 1500, 3000, 5000, 99999];

  function getRank(xp) {
    let rank = RANKS[0];
    for (const r of RANKS) {
      if (xp >= r.threshold) rank = r;
    }
    return rank;
  }

  function getNextRankXP(xp) {
    for (const t of NEXT_THRESHOLD) {
      if (xp < t) return t;
    }
    return 99999;
  }

  function calcQuizScore({ correct, timeRemaining, timeLimitSecs, difficulty, streak }) {
    if (!correct) return 0;
    const base  = CONSTANTS.QUIZ_CORRECT_BASE;
    const time  = Math.round(CONSTANTS.QUIZ_TIME_BONUS_MAX * (timeRemaining / timeLimitSecs));
    const mult  = CONSTANTS.QUIZ_DIFFICULTY[difficulty] || 1;
    const bonus = streak > 1 ? (streak - 1) * CONSTANTS.QUIZ_STREAK_BONUS : 0;
    return Math.round((base + time + bonus) * mult);
  }

  function calcPuzzleScore({ hintsUsed, timeElapsedSecs, timeLimitSecs }) {
    const base   = CONSTANTS.PUZZLE_SOLVE_BASE;
    const penalty = (hintsUsed || 0) * CONSTANTS.PUZZLE_HINT_PENALTY;
    const timeBonus = timeLimitSecs
      ? Math.round(CONSTANTS.PUZZLE_TIME_BONUS_MAX * Math.max(0, 1 - timeElapsedSecs / timeLimitSecs))
      : 0;
    return Math.max(0, base - penalty + timeBonus);
  }

  function calcHangmanScore({ wrongGuesses }) {
    const base = CONSTANTS.HANGMAN_WIN_BASE;
    const penalty = (wrongGuesses || 0) * CONSTANTS.HANGMAN_WRONG_PENALTY;
    return Math.max(0, base - penalty);
  }

  function calcEscapeChapterScore({ attemptsUsed }) {
    const base = CONSTANTS.ESCAPE_CHAPTER_BASE;
    const penalty = (attemptsUsed || 0) * CONSTANTS.ESCAPE_ATTEMPT_PENALTY;
    return Math.max(100, base - penalty);
  }

  function formatScore(n) {
    return n.toLocaleString();
  }

  function formatXP(xp) {
    return `${xp.toLocaleString()} XP`;
  }

  return { CONSTANTS, getRank, getNextRankXP, calcQuizScore, calcPuzzleScore, calcHangmanScore, calcEscapeChapterScore, formatScore, formatXP };
})();
