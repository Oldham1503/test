/* escape.js — Escape Room chapter state machine + typewriter */

const EscapeGame = (() => {
  let currentChapter = 1;
  let currentPuzzleIdx = 0;
  let attemptsUsed = {};  // { chapterId_puzzleId: count }
  let chapterDone = false;

  function onEnter() {
    const gs = Storage.getGameState('escape');
    currentChapter = gs.currentChapter || 1;
    _renderEscape();
  }

  function _renderEscape() {
    const panel = document.getElementById('escape-panel');
    if (!panel) return;

    const gs = Storage.getGameState('escape');

    if (gs.completed) {
      _renderEnding(panel);
      return;
    }

    const chapter = ESCAPE_CHAPTERS.find(c => c.id === currentChapter);
    if (!chapter) return;

    currentPuzzleIdx = 0;
    chapterDone = false;

    panel.innerHTML = `
      <div style="flex:1;overflow-y:auto;padding:20px">
        ${_buildChapterProgress()}
        ${chapter.callTime ? _buildIncomingCall(chapter) : ''}
        <div class="escape-narrative" id="escape-narrative">
          <div class="narrative-label">-- Situation</div>
          <div class="narrative-text" id="narrative-text"></div>
        </div>
        <div id="escape-puzzles"></div>
        <div id="escape-success" style="display:none" class="chapter-success"></div>
        <div id="escape-nav" style="display:none;margin-top:16px">
          <button class="btn btn-primary" onclick="EscapeGame.nextChapter()">
            Next Chapter →
          </button>
        </div>
      </div>`;

    // Typewriter narrative
    _typewriter(document.getElementById('narrative-text'), chapter.narrative, () => {
      _renderPuzzle(chapter, 0);
    });
  }

  function _buildChapterProgress() {
    return `<div class="chapter-progress mb-16">
      ${ESCAPE_CHAPTERS.map(c => {
        const gs = Storage.getGameState('escape');
        const isDone    = c.id < currentChapter;
        const isCurrent = c.id === currentChapter;
        return `<div class="chapter-pip ${isDone ? 'done' : isCurrent ? 'current' : ''}">
          Ch.${c.id}${isDone ? ' ✓' : ''}
        </div>`;
      }).join('')}
    </div>`;
  }

  function _buildIncomingCall(chapter) {
    return `<div class="incoming-call">
      <div class="call-icon">📞</div>
      <div class="call-text">
        <div class="call-time">INCOMING CALL — ${chapter.callTime}</div>
        <div>${chapter.callText}</div>
      </div>
    </div>`;
  }

  function _renderPuzzle(chapter, idx) {
    if (idx >= chapter.puzzles.length) {
      _showChapterSuccess(chapter);
      return;
    }

    const puzzle = chapter.puzzles[idx];
    const container = document.getElementById('escape-puzzles');
    if (!container) return;

    const attemptKey = `${chapter.id}_${puzzle.id}`;
    const attempts   = attemptsUsed[attemptKey] || 0;
    const maxAttempts = 3;

    let puzzleHtml = `<div class="escape-puzzle animate-in" id="ep-${puzzle.id}">
      <div class="escape-puzzle-label">-- Puzzle ${idx + 1} of ${chapter.puzzles.length}</div>
      <div class="text-mono mb-12" style="color:var(--color-text-primary);line-height:1.7">${puzzle.prompt.replace(/\n/g, '<br>')}</div>`;

    if (puzzle.type === 'table-select') {
      puzzleHtml += _buildTableSelect(puzzle);
    } else if (puzzle.type === 'mc') {
      puzzleHtml += _buildMC(puzzle);
    } else if (puzzle.type === 'free-text') {
      puzzleHtml += _buildFreeText(puzzle);
    }

    // Attempts display
    puzzleHtml += `<div class="attempts-display">
      <span class="text-dim">Attempts:</span>
      ${Array.from({length: maxAttempts}, (_, i) =>
        `<div class="attempt-dot${i < attempts ? ' used' : ''}"></div>`
      ).join('')}
      <span class="text-dim">(−${Score.CONSTANTS.ESCAPE_ATTEMPT_PENALTY} XP each)</span>
    </div>`;

    if (puzzle.hint) {
      puzzleHtml += `<div class="hint-area mt-8">
        <button class="btn btn-ghost btn-sm" onclick="EscapeGame.showHint('${puzzle.id}')">
          💡 Hint (−${Score.CONSTANTS.ESCAPE_ATTEMPT_PENALTY} XP)
        </button>
        <span id="hint-${puzzle.id}" style="display:none;margin-left:8px;color:var(--color-warning);font-family:var(--font-mono);font-size:11px"></span>
      </div>`;
    }

    puzzleHtml += `</div>`;

    const div = document.createElement('div');
    div.innerHTML = puzzleHtml;
    container.appendChild(div.firstElementChild);

    // Wire submit
    const submitBtn = document.getElementById(`ep-submit-${puzzle.id}`);
    if (submitBtn) {
      submitBtn.addEventListener('click', () => _submitPuzzle(chapter, idx, puzzle));
    }
  }

  function _buildTableSelect(puzzle) {
    const { columns, rows } = puzzle.tableData;
    let html = `<table class="result-table mb-12"><thead><tr>`;
    columns.forEach(c => { html += `<th>${c}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => { html += `<td>${cell}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += `<div class="escape-options">`;
    puzzle.options.forEach((opt, i) => {
      html += `<div class="escape-option" data-optidx="${i}" onclick="EscapeGame.selectOption(this, '${puzzle.id}')">
        <span class="option-key">${String.fromCharCode(65+i)}.</span> ${opt}
      </div>`;
    });
    html += `</div>`;
    html += `<div class="mt-12"><button class="btn btn-execute" id="ep-submit-${puzzle.id}">
      <span class="play-icon"></span> Submit Answer
    </button></div>`;
    return html;
  }

  function _buildMC(puzzle) {
    let html = `<div class="escape-options">`;
    puzzle.options.forEach((opt, i) => {
      html += `<div class="escape-option" data-optidx="${i}" onclick="EscapeGame.selectOption(this, '${puzzle.id}')">
        <span class="option-key">${String.fromCharCode(65+i)}.</span>
        <span>${opt}</span>
      </div>`;
    });
    html += `</div>`;
    html += `<div class="mt-12"><button class="btn btn-execute" id="ep-submit-${puzzle.id}">
      <span class="play-icon"></span> Submit Answer
    </button></div>`;
    return html;
  }

  function _buildFreeText(puzzle) {
    return `<textarea class="sql-editor" id="ep-input-${puzzle.id}" rows="4"
      placeholder="${puzzle.placeholder || 'Write your answer here...'}" spellcheck="false"></textarea>
    <div class="mt-8"><button class="btn btn-execute" id="ep-submit-${puzzle.id}">
      <span class="play-icon"></span> Execute
    </button></div>`;
  }

  function selectOption(el, puzzleId) {
    const container = el.closest('.escape-options');
    container.querySelectorAll('.escape-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    el.dataset.selected = '1';
    // Store on element so submit can read it
    container.dataset.selected = el.dataset.optidx;
  }

  function _submitPuzzle(chapter, idx, puzzle) {
    let answer;

    if (puzzle.type === 'free-text') {
      const ta = document.getElementById(`ep-input-${puzzle.id}`);
      answer = ta ? ta.value : '';
    } else {
      // MC or table-select
      const container = document.querySelector(`#ep-${puzzle.id} .escape-options`);
      if (!container || container.dataset.selected === undefined || container.dataset.selected === '') {
        Modal.info('No Selection', 'Please select an answer before submitting.', []);
        return;
      }
      answer = parseInt(container.dataset.selected, 10);
    }

    const attemptKey = `${chapter.id}_${puzzle.id}`;
    const result = puzzle.validate(answer);

    if (result.pass) {
      _puzzleSuccess(chapter, idx, puzzle, result.feedback);
    } else {
      attemptsUsed[attemptKey] = (attemptsUsed[attemptKey] || 0) + 1;
      Storage.addXP(-Score.CONSTANTS.ESCAPE_ATTEMPT_PENALTY);
      App.refreshXP();

      // Show error feedback
      const puzzleEl = document.getElementById(`ep-${puzzle.id}`);
      const msgEl = puzzleEl ? puzzleEl.querySelector('.escape-puzzle-label') : null;

      // Update attempt dots
      const dots = puzzleEl ? puzzleEl.querySelectorAll('.attempt-dot') : [];
      const used = attemptsUsed[attemptKey];
      dots.forEach((d, i) => d.classList.toggle('used', i < used));

      Modal.error(
        'Incorrect',
        `<div class="text-mono" style="font-size:12px;line-height:1.7">${result.feedback}</div>
         <div class="text-dim mt-8">−${Score.CONSTANTS.ESCAPE_ATTEMPT_PENALTY} XP</div>`,
        []
      );
    }
  }

  function _puzzleSuccess(chapter, idx, puzzle, feedback) {
    // Disable the puzzle's submit
    const submitBtn = document.getElementById(`ep-submit-${puzzle.id}`);
    if (submitBtn) submitBtn.disabled = true;

    // Show success feedback inline
    const puzzleEl = document.getElementById(`ep-${puzzle.id}`);
    if (puzzleEl) {
      const fb = document.createElement('div');
      fb.className = 'messages-pane msg-success animate-in mt-8';
      fb.style.fontFamily = 'var(--font-mono)';
      fb.style.fontSize = '11px';
      fb.textContent = feedback;
      puzzleEl.appendChild(fb);
    }

    // Next puzzle or chapter success
    setTimeout(() => {
      _renderPuzzle(chapter, idx + 1);
    }, 1000);
  }

  function _showChapterSuccess(chapter) {
    const successEl = document.getElementById('escape-success');
    const navEl     = document.getElementById('escape-nav');
    if (!successEl) return;

    const attemptsTotal = Object.values(attemptsUsed).reduce((a, b) => a + b, 0);
    const pts = Score.calcEscapeChapterScore({ attemptsUsed: attemptsTotal });
    Storage.addXP(pts);

    // Save progress
    const gs = Storage.getGameState('escape');
    gs.currentChapter = Math.min(currentChapter + 1, ESCAPE_CHAPTERS.length + 1);
    if (!gs.chapterScores) gs.chapterScores = [];
    gs.chapterScores.push({ chapter: currentChapter, score: pts });
    if (currentChapter >= ESCAPE_CHAPTERS.length) gs.completed = true;
    Storage.saveGameState('escape', gs);
    App.refreshXP();

    successEl.style.display = '';
    successEl.innerHTML = `
      <div class="text-mono mb-8">-- ✓ CHAPTER ${chapter.id} COMPLETE</div>
      <div style="color:var(--color-text-secondary);font-size:12px;line-height:1.8;white-space:pre-line">${chapter.successNarrative || ''}</div>
      <div class="mt-12" style="color:var(--color-xp-gold);font-family:var(--font-mono);font-size:13px">+${Score.formatScore(pts)} XP earned</div>`;

    if (navEl) {
      navEl.style.display = '';
      if (currentChapter >= ESCAPE_CHAPTERS.length) {
        navEl.innerHTML = `<button class="btn btn-primary" onclick="EscapeGame.showEnding()">
          View Final Results →
        </button>`;
      }
    }
  }

  function nextChapter() {
    currentChapter++;
    attemptsUsed = {};
    const gs = Storage.getGameState('escape');
    gs.currentChapter = currentChapter;
    Storage.saveGameState('escape', gs);
    _renderEscape();
  }

  function showHint(puzzleId) {
    const hintEl = document.getElementById(`hint-${puzzleId}`);
    const chapter = ESCAPE_CHAPTERS.find(c => c.id === currentChapter);
    if (!chapter) return;
    const puzzle = chapter.puzzles.find(p => p.id === puzzleId);
    if (!puzzle || !puzzle.hint) return;
    if (hintEl) {
      hintEl.style.display = 'inline';
      hintEl.textContent   = puzzle.hint;
    }
    Storage.addXP(-Score.CONSTANTS.ESCAPE_ATTEMPT_PENALTY);
    App.refreshXP();
  }

  function showEnding() {
    const panel = document.getElementById('escape-panel');
    if (!panel) return;
    _renderEnding(panel);
  }

  function _renderEnding(panel) {
    panel.innerHTML = `<div style="flex:1;overflow-y:auto;padding:20px">
      <div class="escape-ending">
        <div class="text-mono text-dim mb-16">-- MISSION COMPLETE</div>
        <div class="ending-sql" id="ending-text"></div>
        <div id="ending-rank" style="display:none">
          <div class="rank-reveal" id="ending-rank-title"></div>
          <div class="text-dim">Final XP: <span id="ending-xp" style="color:var(--color-xp-gold)"></span></div>
          <div class="mt-16">
            <button class="btn btn-ghost" onclick="EscapeGame.resetEscape()">Play Again</button>
          </div>
        </div>
      </div>
    </div>`;

    // Add final bonus XP
    Storage.addXP(2000);
    App.refreshXP();

    const textEl = document.getElementById('ending-text');
    _typewriter(textEl, ESCAPE_ENDING_LINES.join('\n'), () => {
      const rankEl  = document.getElementById('ending-rank');
      const titleEl = document.getElementById('ending-rank-title');
      const xpEl    = document.getElementById('ending-xp');
      const session = Storage.getSession();
      const rank    = Score.getRank(session.totalXP);

      if (titleEl) titleEl.textContent = rank.title;
      if (xpEl)    xpEl.textContent    = Score.formatXP(session.totalXP);
      if (rankEl)  rankEl.style.display = '';
    });
  }

  function resetEscape() {
    const gs = Storage.getGameState('escape');
    gs.currentChapter = 1;
    gs.completed = false;
    gs.chapterScores = [];
    Storage.saveGameState('escape', gs);
    currentChapter = 1;
    attemptsUsed = {};
    _renderEscape();
  }

  // ── TYPEWRITER ─────────────────────────────────────────────
  function _typewriter(el, text, onDone, speed = 18) {
    if (!el) { if (onDone) onDone(); return; }
    el.innerHTML = '';
    let i = 0;
    const lines = text.split('');

    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.appendChild(cursor);

    function tick() {
      if (i >= lines.length) {
        cursor.remove();
        if (onDone) onDone();
        return;
      }
      const ch = lines[i++];
      const node = document.createTextNode(ch === '\n' ? '\n' : ch);
      el.insertBefore(node, cursor);
      if (ch === '\n') {
        el.insertBefore(document.createElement('br'), cursor);
      }
      setTimeout(tick, ch === '\n' ? 80 : speed);
    }
    tick();
  }

  return { onEnter, nextChapter, showHint, selectOption, showEnding, resetEscape };
})();
