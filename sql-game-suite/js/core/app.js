/* app.js — Router, global state, splash screen, sqlHighlight */

const App = (() => {
  // Global state
  const state = {
    currentSection: 'menu',
    difficulty: 'intermediate',
    sessionXP: 0,
  };

  // SQL reserved words for syntax highlighting
  const SQL_KEYWORDS = [
    'SELECT','FROM','WHERE','AND','OR','NOT','IN','EXISTS','LIKE','BETWEEN',
    'GROUP','BY','HAVING','ORDER','INNER','LEFT','RIGHT','FULL','OUTER','JOIN',
    'ON','AS','DISTINCT','TOP','LIMIT','OFFSET','FETCH','NEXT','ROWS','ONLY',
    'INSERT','INTO','VALUES','UPDATE','SET','DELETE','TRUNCATE','MERGE',
    'CREATE','ALTER','DROP','TABLE','INDEX','VIEW','PROCEDURE','FUNCTION',
    'TRIGGER','DATABASE','SCHEMA','CONSTRAINT','PRIMARY','KEY','FOREIGN',
    'REFERENCES','UNIQUE','CHECK','DEFAULT','NULL','NOT','IDENTITY','AUTO_INCREMENT',
    'BEGIN','END','IF','ELSE','WHILE','RETURN','DECLARE','PRINT','EXEC','EXECUTE',
    'TRANSACTION','COMMIT','ROLLBACK','SAVEPOINT','WITH','NOLOCK','RECOMPILE',
    'OVER','PARTITION','ROW_NUMBER','RANK','DENSE_RANK','NTILE',
    'CASE','WHEN','THEN','ELSE','END',
    'UNION','ALL','INTERSECT','EXCEPT',
    'IS','NULL','TRUE','FALSE',
    'RESTORE','BACKUP','KILL','STOPAT','RECOVERY','NORECOVERY',
    'GO',
  ];

  const SQL_FUNCTIONS = [
    'COUNT','SUM','AVG','MIN','MAX','COALESCE','ISNULL','NULLIF','CAST','CONVERT',
    'LEN','DATALENGTH','SUBSTRING','CHARINDEX','REPLACE','TRIM','LTRIM','RTRIM',
    'UPPER','LOWER','LEFT','RIGHT','GETDATE','GETUTCDATE','DATEADD','DATEDIFF',
    'YEAR','MONTH','DAY','FORMAT','CONCAT','STRING_AGG','STUFF','NEWID','ABS',
    'CEILING','FLOOR','ROUND','POWER','SQRT','ROW_NUMBER','RANK','DENSE_RANK',
  ];

  const SQL_TYPES = [
    'INT','BIGINT','SMALLINT','TINYINT','BIT','DECIMAL','NUMERIC','FLOAT','REAL',
    'MONEY','SMALLMONEY','CHAR','VARCHAR','NCHAR','NVARCHAR','TEXT','NTEXT',
    'DATETIME','DATETIME2','DATE','TIME','SMALLDATETIME','TIMESTAMP',
    'UNIQUEIDENTIFIER','VARBINARY','IMAGE','XML','JSON',
  ];

  function sqlHighlight(sql) {
    // Escape HTML entities first
    let out = sql
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments (-- ...)
    out = out.replace(/(--[^\n]*)/g, '<span class="cmt">$1</span>');

    // String literals ('...')
    out = out.replace(/'([^']*)'/g, "<span class=\"str\">'$1'</span>");

    // Numbers
    out = out.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="num">$1</span>');

    // Keywords (whole words, case-insensitive)
    SQL_KEYWORDS.forEach(kw => {
      const re = new RegExp(`\\b(${kw})\\b`, 'gi');
      out = out.replace(re, '<span class="kw">$1</span>');
    });

    // Functions
    SQL_FUNCTIONS.forEach(fn => {
      const re = new RegExp(`\\b(${fn})\\s*(?=\\()`, 'gi');
      out = out.replace(re, '<span class="fn">$1</span>');
    });

    // Types
    SQL_TYPES.forEach(t => {
      const re = new RegExp(`\\b(${t})\\b`, 'gi');
      out = out.replace(re, '<span class="type">$1</span>');
    });

    return out;
  }

  // Navigate to a section
  function navigateTo(sectionId) {
    document.querySelectorAll('.game-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`section-${sectionId}`);
    if (target) target.classList.add('active');

    // Update sidebar active state
    document.querySelectorAll('.tree-game').forEach(el => {
      el.classList.toggle('active', el.dataset.game === sectionId);
    });

    state.currentSection = sectionId;

    // Call each game's init if available
    const inits = {
      quiz:   () => typeof QuizGame   !== 'undefined' && QuizGame.onEnter(),
      puzzle: () => typeof PuzzleGame !== 'undefined' && PuzzleGame.onEnter(),
      word:   () => typeof WordGame   !== 'undefined' && WordGame.onEnter(),
      escape: () => typeof EscapeGame !== 'undefined' && EscapeGame.onEnter(),
    };
    if (inits[sectionId]) inits[sectionId]();
  }

  // Update global XP display
  function refreshXP() {
    const session = Storage.getSession();
    state.sessionXP = session.totalXP || 0;

    const rank = Score.getRank(state.sessionXP);
    const next = Score.getNextRankXP(state.sessionXP);

    // Title bar
    const xpEl = document.getElementById('titlebar-xp');
    if (xpEl) xpEl.textContent = `${state.sessionXP.toLocaleString()} XP`;

    const rankEl = document.getElementById('titlebar-rank');
    if (rankEl) rankEl.textContent = rank.title;

    // Status bar
    const statusXp = document.getElementById('status-xp');
    if (statusXp) statusXp.textContent = `${state.sessionXP.toLocaleString()} XP`;

    // XP bar on menu
    const fillEl = document.getElementById('menu-xp-fill');
    const labelEl = document.getElementById('menu-xp-label');
    if (fillEl) {
      const rankThreshold = rank.threshold;
      const pct = next > rankThreshold
        ? Math.round(((state.sessionXP - rankThreshold) / (next - rankThreshold)) * 100)
        : 100;
      fillEl.style.width = `${Math.min(pct, 100)}%`;
    }
    if (labelEl) {
      labelEl.textContent = `${rank.title} — ${state.sessionXP.toLocaleString()} / ${next.toLocaleString()} XP`;
    }

    // Per-game scores in sidebar
    refreshSidebarScores();
  }

  function refreshSidebarScores() {
    const quiz   = Storage.getGameState('quiz');
    const escape = Storage.getGameState('escape');
    const word   = Storage.getGameState('word');
    const puzzle = Storage.getGameState('puzzle');

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('sidebar-quiz-score',   quiz.highScore ? `${quiz.highScore.toLocaleString()} pts` : '—');
    set('sidebar-escape-score', escape.currentChapter > 1 ? `Ch. ${escape.currentChapter}/5` : '—');
    set('sidebar-word-score',   word.hangmanWins ? `${word.hangmanWins}W / ${word.hangmanLosses || 0}L` : '—');
    set('sidebar-puzzle-score', puzzle.solved ? `${puzzle.solved.length}/5` : '—');
  }

  function setDifficulty(d) {
    state.difficulty = d;
    const prefs = Storage.getPrefs();
    prefs.difficulty = d;
    Storage.savePrefs(prefs);

    // Update UI buttons
    document.querySelectorAll('.difficulty-option').forEach(el => {
      el.className = 'difficulty-option';
      if (el.dataset.diff === d) el.classList.add(`selected-${d}`);
    });

    // Update status bar
    const el = document.getElementById('status-difficulty');
    if (el) el.textContent = d.charAt(0).toUpperCase() + d.slice(1);
  }

  function getDifficulty() { return state.difficulty; }

  // Splash screen animation
  function runSplash(onDone) {
    const splash   = document.getElementById('splash');
    const statusEl = document.getElementById('splash-status');
    const fillEl   = document.getElementById('splash-fill');

    const steps = [
      { text: 'Initializing query executor...', pct: 20,  delay: 0    },
      { text: 'Loading object metadata...',      pct: 50,  delay: 600  },
      { text: 'Establishing connection...',       pct: 80,  delay: 1100 },
      { text: 'Connected to: SQL_GAME_SUITE (v1.0)', pct: 100, delay: 1600 },
    ];

    steps.forEach(({ text, pct, delay }) => {
      setTimeout(() => {
        if (statusEl) statusEl.textContent = text;
        if (fillEl) fillEl.style.width = `${pct}%`;
      }, delay);
    });

    setTimeout(() => {
      splash.classList.add('hidden');
      if (onDone) onDone();
    }, 2200);
  }

  function init() {
    // Load preferences
    const prefs = Storage.getPrefs();
    state.difficulty = prefs.difficulty || 'intermediate';

    // Sidebar nav clicks
    document.querySelectorAll('.tree-game').forEach(el => {
      el.addEventListener('click', () => navigateTo(el.dataset.game));
    });

    // Difficulty buttons
    document.querySelectorAll('.difficulty-option').forEach(btn => {
      btn.addEventListener('click', () => setDifficulty(btn.dataset.diff));
    });

    // Menu game cards
    document.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', () => navigateTo(card.dataset.game));
    });

    // Apply saved difficulty
    setDifficulty(state.difficulty);

    // Refresh XP
    refreshXP();

    // Run splash then show menu
    runSplash(() => {
      navigateTo('menu');
    });
  }

  return { init, navigateTo, refreshXP, setDifficulty, getDifficulty, sqlHighlight };
})();

document.addEventListener('DOMContentLoaded', App.init);
