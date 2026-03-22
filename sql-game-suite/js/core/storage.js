/* storage.js — localStorage wrapper */

const Storage = (() => {
  const KEYS = {
    session: 'sqlgame_session',
    quiz:    'sqlgame_quiz',
    puzzle:  'sqlgame_puzzle',
    escape:  'sqlgame_escape',
    word:    'sqlgame_word',
    prefs:   'sqlgame_prefs',
  };

  function get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded — silently skip */ }
  }

  function getSession() {
    return get(KEYS.session) || {
      startTime: Date.now(),
      totalXP: 0,
      gamesPlayed: {},
    };
  }

  function saveSession(session) { set(KEYS.session, session); }

  function addXP(amount) {
    const s = getSession();
    s.totalXP = (s.totalXP || 0) + amount;
    saveSession(s);
    return s.totalXP;
  }

  function getGameState(game) {
    const defaults = {
      quiz:   { highScore: 0, questionsAnswered: 0, bestStreak: 0, roundsPlayed: 0 },
      puzzle: { solved: [], attempts: {} },
      escape: { currentChapter: 1, chapterScores: [], completed: false },
      word:   { hangmanWins: 0, hangmanLosses: 0, wordsFound: 0 },
    };
    return get(KEYS[game]) || defaults[game] || {};
  }

  function saveGameState(game, state) { set(KEYS[game], state); }

  function getPrefs() {
    return get(KEYS.prefs) || { difficulty: 'intermediate' };
  }

  function savePrefs(prefs) { set(KEYS.prefs, prefs); }

  function resetSession() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  return { getSession, saveSession, addXP, getGameState, saveGameState, getPrefs, savePrefs, resetSession, KEYS };
})();
