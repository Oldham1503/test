/* wordgame.js — Hangman + Word Search */

const WordGame = (() => {
  // ── SHARED STATE ──────────────────────────────────────────
  let activeTab = 'hangman';

  // ── HANGMAN STATE ──────────────────────────────────────────
  let hWord = '', hGuessed = new Set(), hWrong = 0, hGameOver = false;

  // ── WORD SEARCH STATE ──────────────────────────────────────
  let wsGrid = [], wsFound = new Set(), wsSelStart = null;

  function onEnter() {
    _showTab('hangman');
    _initHangman();
  }

  // ── TAB SWITCHING ─────────────────────────────────────────
  function _showTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.wordgame-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    const hPanel = document.getElementById('hangman-panel');
    const wsPanel = document.getElementById('wordsearch-panel');
    if (hPanel)  hPanel.style.display  = tab === 'hangman'    ? '' : 'none';
    if (wsPanel) wsPanel.style.display = tab === 'wordsearch' ? '' : 'none';
  }

  // ─────────────────────────────────────────────────────────
  // HANGMAN
  // ─────────────────────────────────────────────────────────

  function _initHangman() {
    hGuessed  = new Set();
    hWrong    = 0;
    hGameOver = false;

    // Pick word based on difficulty
    const diff = App.getDifficulty();
    const pool = HANGMAN_WORDS.filter(w => w.difficulty === diff);
    const pick = pool.length > 0
      ? pool[Math.floor(Math.random() * pool.length)]
      : HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];

    hWord = pick.word;

    _renderHangman(pick);
  }

  function _renderHangman(pick) {
    const panel = document.getElementById('hangman-panel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="hangman-layout">
        <div class="hangman-main">
          <div class="flex flex-between mb-12">
            <span class="text-mono text-dim">-- Guess the SQL term</span>
            <span class="badge badge-${pick.difficulty}">${pick.difficulty}</span>
          </div>

          <div class="hangman-word" id="hm-word"></div>

          <div class="hangman-keyboard" id="hm-keyboard"></div>

          <div id="hm-definition" style="display:none" class="hangman-definition"></div>

          <div class="flex gap-8 mt-16">
            <button class="btn btn-execute" onclick="WordGame.newHangmanGame()">
              <span class="play-icon"></span> New Game
            </button>
            <button class="btn btn-ghost btn-sm" onclick="WordGame.switchTab('wordsearch')">
              Switch to Word Search
            </button>
          </div>
        </div>

        <div class="hangman-errors">
          <div class="text-mono text-dim mb-8">-- Error Log (${6 - hWrong} attempts remaining)</div>
          <div class="error-log" id="hm-errors">
            <span class="error-log-empty">-- No errors yet. You are doing great.</span>
          </div>
        </div>
      </div>`;

    _updateWordDisplay();
    _buildKeyboard();
  }

  function _updateWordDisplay() {
    const el = document.getElementById('hm-word');
    if (!el) return;
    el.innerHTML = hWord.split('').map(ch => {
      const revealed = hGuessed.has(ch);
      return `<span class="hangman-letter${revealed ? ' revealed' : ''}">${revealed ? ch : ''}</span>`;
    }).join('');
  }

  function _buildKeyboard() {
    const el = document.getElementById('hm-keyboard');
    if (!el) return;
    el.innerHTML = '';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'key-btn';
      btn.textContent = ch;
      btn.dataset.letter = ch;
      if (hGuessed.has(ch)) {
        btn.disabled = true;
        btn.classList.add(hWord.includes(ch) ? 'correct' : 'wrong');
      }
      btn.addEventListener('click', () => _guessLetter(ch));
      el.appendChild(btn);
    });
  }

  function _guessLetter(ch) {
    if (hGameOver || hGuessed.has(ch)) return;
    hGuessed.add(ch);

    const btn = document.querySelector(`[data-letter="${ch}"]`);

    if (hWord.includes(ch)) {
      if (btn) btn.classList.add('correct');
      _updateWordDisplay();

      // Check win
      if (hWord.split('').every(c => hGuessed.has(c))) {
        _hangmanWin();
        return;
      }
    } else {
      hWrong++;
      if (btn) btn.classList.add('wrong');
      _addError(HANGMAN_ERRORS[hWrong - 1]);

      if (hWrong >= 6) {
        _hangmanLose();
        return;
      }
    }

    // Update remaining count
    const errPanel = document.querySelector('#hangman-panel .text-mono.text-dim');
    if (errPanel) errPanel.textContent = `-- Error Log (${6 - hWrong} attempts remaining)`;

    if (btn) btn.disabled = true;
  }

  function _addError(msg) {
    const el = document.getElementById('hm-errors');
    if (!el) return;
    const empty = el.querySelector('.error-log-empty');
    if (empty) empty.remove();
    const line = document.createElement('div');
    line.className = 'error-log-entry animate-slide';
    line.textContent = msg;
    el.appendChild(line);
  }

  function _hangmanWin() {
    hGameOver = true;
    _updateWordDisplay();
    _showDefinition();

    const pts = Score.calcHangmanScore({ wrongGuesses: hWrong });
    Storage.addXP(pts);

    const gs = Storage.getGameState('word');
    gs.hangmanWins = (gs.hangmanWins || 0) + 1;
    Storage.saveGameState('word', gs);
    App.refreshXP();

    Modal.success(
      'Query Completed Successfully',
      `<div class="text-center">
        <div class="score-big">+${Score.formatScore(pts)}</div>
        <div class="text-dim mt-8">You solved: <strong>${hWord}</strong></div>
        <div class="text-dim">Wrong guesses: ${hWrong} / 6</div>
      </div>`,
      [{ label: 'New Game', primary: true, onClick: () => _initHangman() }]
    );
  }

  function _hangmanLose() {
    hGameOver = true;
    // Reveal all letters
    hWord.split('').forEach(c => hGuessed.add(c));
    _updateWordDisplay();
    _showDefinition();

    const gs = Storage.getGameState('word');
    gs.hangmanLosses = (gs.hangmanLosses || 0) + 1;
    Storage.saveGameState('word', gs);

    _addError('Msg 3314, Level 21, State 3 — DATABASE RECOVERY FAILED. The word was: ' + hWord);

    Modal.error(
      'Msg 3314 — Fatal Error',
      `<div class="text-center">
        <div style="font-family:var(--font-mono);font-size:14px;color:var(--color-error);margin-bottom:12px">TRANSACTION ROLLED BACK</div>
        <div class="text-dim">The word was: <strong style="color:var(--color-kw)">${hWord}</strong></div>
        <div class="text-dim mt-8">Wrong guesses: 6 / 6</div>
      </div>`,
      [{ label: 'Try Again', primary: true, onClick: () => _initHangman() }]
    );
  }

  function _showDefinition() {
    const pick = HANGMAN_WORDS.find(w => w.word === hWord);
    const el   = document.getElementById('hm-definition');
    if (!el || !pick) return;
    el.style.display = 'block';
    el.textContent   = `-- ${pick.word}: ${pick.definition}`;
  }

  function newHangmanGame() { _initHangman(); }

  // ─────────────────────────────────────────────────────────
  // WORD SEARCH
  // ─────────────────────────────────────────────────────────

  function _initWordSearch() {
    wsGrid  = buildWordSearchGrid();
    wsFound = new Set();
    wsSelStart = null;
    _renderWordSearch();
  }

  function _renderWordSearch() {
    const panel = document.getElementById('wordsearch-panel');
    if (!panel) return;

    const COLS = wsGrid[0].length;
    panel.innerHTML = `
      <div class="wordsearch-layout">
        <div class="wordsearch-grid-container">
          <div class="text-mono text-dim mb-8">-- Click start then end of a word to select</div>
          <div class="ws-grid" id="ws-grid" style="grid-template-columns:repeat(${COLS},28px)"></div>
          <div class="flex gap-8 mt-12">
            <button class="btn btn-execute" onclick="WordGame.newWordSearch()">
              <span class="play-icon"></span> New Grid
            </button>
            <button class="btn btn-ghost btn-sm" onclick="WordGame.switchTab('hangman')">
              Switch to Hangman
            </button>
          </div>
        </div>
        <div class="wordsearch-words">
          <div class="text-mono text-dim mb-8">-- Find these words:</div>
          <div id="ws-word-list"></div>
          <div class="mt-12 text-mono text-dim" id="ws-found-count">Found: 0 / ${WS_WORDS.length}</div>
        </div>
      </div>`;

    _renderGrid();
    _renderWordList();
  }

  function _renderGrid() {
    const el = document.getElementById('ws-grid');
    if (!el) return;
    el.innerHTML = '';
    wsGrid.forEach((row, r) => {
      row.forEach((ch, c) => {
        const cell = document.createElement('div');
        cell.className = 'ws-cell';
        cell.textContent = ch;
        cell.dataset.r = r;
        cell.dataset.c = c;
        // Check if already found
        const key = `${r},${c}`;
        if (_isCellFound(r, c)) cell.classList.add('found');
        cell.addEventListener('click', () => _wsClick(r, c, cell));
        el.appendChild(cell);
      });
    });
  }

  function _isCellFound(r, c) {
    return WS_WORDS
      .filter(w => wsFound.has(w.word))
      .some(w => getWordCells(w).some(([wr, wc]) => wr === r && wc === c));
  }

  function _renderWordList() {
    const el = document.getElementById('ws-word-list');
    if (!el) return;
    el.innerHTML = WS_WORDS.map(w =>
      `<div class="ws-word-item${wsFound.has(w.word) ? ' found' : ''}" id="ws-word-${w.word}">${w.word}</div>`
    ).join('');
  }

  function _wsClick(r, c, cell) {
    // If cell already found, ignore
    if (cell.classList.contains('found')) return;

    if (!wsSelStart) {
      // First click — select start
      wsSelStart = { r, c };
      _clearHighlight();
      cell.classList.add('selected');
    } else {
      // Second click — check if it's the end of a word
      const { r: r0, c: c0 } = wsSelStart;
      wsSelStart = null;
      _clearHighlight();

      // Find a word that spans from (r0,c0) to (r,c)
      const match = WS_WORDS.find(w => {
        if (wsFound.has(w.word)) return false;
        const cells = getWordCells(w);
        const first = cells[0];
        const last  = cells[cells.length - 1];
        return (first[0] === r0 && first[1] === c0 && last[0] === r && last[1] === c) ||
               (first[0] === r  && first[1] === c  && last[0] === r0 && last[1] === c0);
      });

      if (match) {
        wsFound.add(match.word);
        // Mark found cells
        getWordCells(match).forEach(([fr, fc]) => {
          const foundCell = document.querySelector(`[data-r="${fr}"][data-c="${fc}"]`);
          if (foundCell) foundCell.classList.add('found');
        });
        // Cross off in list
        const listItem = document.getElementById(`ws-word-${match.word}`);
        if (listItem) listItem.classList.add('found');

        // Update count
        const countEl = document.getElementById('ws-found-count');
        if (countEl) countEl.textContent = `Found: ${wsFound.size} / ${WS_WORDS.length}`;

        const pts = Score.CONSTANTS.WORDSEARCH_WORD_BASE;
        Storage.addXP(pts);
        App.refreshXP();

        // Win check
        if (wsFound.size === WS_WORDS.length) {
          _wordSearchWin();
        }
      }
    }
  }

  function _clearHighlight() {
    document.querySelectorAll('.ws-cell.selected, .ws-cell.highlighted').forEach(el => {
      el.classList.remove('selected', 'highlighted');
    });
  }

  function _wordSearchWin() {
    const gs = Storage.getGameState('word');
    gs.wordsFound = (gs.wordsFound || 0) + WS_WORDS.length;
    Storage.saveGameState('word', gs);

    Modal.success(
      'All Words Found!',
      `<div class="text-center">
        <div class="score-big">+${Score.formatScore(WS_WORDS.length * Score.CONSTANTS.WORDSEARCH_WORD_BASE)}</div>
        <div class="text-dim mt-8">All ${WS_WORDS.length} SQL terms located.</div>
      </div>`,
      [{ label: 'New Grid', primary: true, onClick: () => _initWordSearch() }]
    );
  }

  function newWordSearch() { _initWordSearch(); }

  function switchTab(tab) {
    _showTab(tab);
    if (tab === 'hangman' && !document.getElementById('hm-word')) _initHangman();
    if (tab === 'wordsearch') _initWordSearch();
  }

  return { onEnter, newHangmanGame, newWordSearch, switchTab };
})();
