/* puzzle.js — SQL Puzzle / Challenge game logic */

const PuzzleGame = (() => {
  let currentPuzzle = null;
  let blankAnswers  = {};
  let hintsUsed     = 0;
  let startTime     = null;
  let puzzleTimer   = null;

  let elList, elPlay;
  let elPlayTitle, elPlayType, elPlayDesc;
  let elEditorArea, elResultsPane, elMessagesPane, elHintArea;

  function _cacheEls() {
    elList        = document.getElementById('puzzle-list-view');
    elPlay        = document.getElementById('puzzle-play-view');
    elPlayTitle   = document.getElementById('puzzle-play-title');
    elPlayType    = document.getElementById('puzzle-play-type');
    elPlayDesc    = document.getElementById('puzzle-play-desc');
    elEditorArea  = document.getElementById('puzzle-editor-area');
    elResultsPane = document.getElementById('puzzle-results-pane');
    elMessagesPane = document.getElementById('puzzle-messages-pane');
    elHintArea    = document.getElementById('puzzle-hint-area');
  }

  function onEnter() {
    _cacheEls();
    _renderList();
  }

  function _renderList() {
    elList.style.display = '';
    elPlay.style.display = 'none';

    const gs = Storage.getGameState('puzzle');
    const container = document.getElementById('puzzle-cards');
    if (!container) return;
    container.innerHTML = '';

    PUZZLE_DATA.forEach(p => {
      const solved = gs.solved && gs.solved.includes(p.id);
      const div = document.createElement('div');
      div.className = `puzzle-card${solved ? ' solved' : ''}`;
      div.innerHTML = `
        <div style="font-size:20px">${solved ? '✓' : _typeIcon(p.type)}</div>
        <div class="puzzle-card-info">
          <div class="puzzle-card-name">${p.title}</div>
          <div class="puzzle-card-meta">
            <span class="badge badge-${p.difficulty}">${p.difficulty}</span>
            &nbsp;${_typeLabel(p.type)}
            ${solved ? '&nbsp;<span class="text-success">SOLVED</span>' : ''}
          </div>
        </div>
        <button class="btn btn-execute btn-sm">
          <span class="play-icon"></span> ${solved ? 'Replay' : 'Execute'}
        </button>`;
      div.querySelector('button').addEventListener('click', () => _loadPuzzle(p));
      container.appendChild(div);
    });
  }

  function _typeIcon(type) {
    return type === 'fix' ? '🔧' : type === 'blank' ? '📝' : '📊';
  }

  function _typeLabel(type) {
    return type === 'fix' ? 'Fix the Bug' : type === 'blank' ? 'Fill in the Blank' : 'Match the Result';
  }

  function _loadPuzzle(puzzle) {
    currentPuzzle = puzzle;
    blankAnswers  = {};
    hintsUsed     = 0;
    startTime     = Date.now();

    elList.style.display = 'none';
    elPlay.style.display = 'flex';
    elPlay.style.flexDirection = 'column';
    elPlay.style.height = '100%';

    if (elPlayTitle) elPlayTitle.textContent = puzzle.title;
    if (elPlayType)  elPlayType.textContent  = _typeLabel(puzzle.type);
    if (elPlayDesc)  elPlayDesc.textContent  = puzzle.description || '';

    _setMessages('', '');
    _clearResults();

    if (puzzle.type === 'fix') {
      _buildFixEditor(puzzle);
    } else if (puzzle.type === 'blank') {
      _buildBlankEditor(puzzle);
    } else if (puzzle.type === 'match') {
      _buildMatchEditor(puzzle);
    }

    // Hint setup
    if (elHintArea) {
      elHintArea.style.display = puzzle.hint ? '' : 'none';
      elHintArea.innerHTML = `<button class="btn btn-ghost btn-sm" id="btn-hint">
        💡 Use Hint (−${Score.CONSTANTS.PUZZLE_HINT_PENALTY} pts)
      </button><span id="hint-text" style="display:none;margin-left:10px;color:var(--color-warning)"></span>`;
      document.getElementById('btn-hint').addEventListener('click', _showHint);
    }
  }

  function _buildFixEditor(puzzle) {
    elEditorArea.innerHTML = `
      <textarea class="sql-editor-full" id="puzzle-textarea" spellcheck="false">${puzzle.brokenSql}</textarea>`;

    const execBtn = document.getElementById('puzzle-exec-btn');
    if (execBtn) {
      execBtn.onclick = _executeQuery;
    }
  }

  function _buildBlankEditor(puzzle) {
    let html = '<div class="puzzle-sql-display">';
    puzzle.template.forEach(part => {
      if (!part.blank) {
        html += `<span class="kw-inline">${part.text.replace(/\n/g, '<br>').replace(/ /g, '&nbsp;')}</span>`;
      } else {
        html += `<select class="blank-select" id="blank-${part.id}" data-blank="${part.id}">
          <option value="">______</option>
          ${part.options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>`;
      }
    });
    html += '</div>';
    elEditorArea.innerHTML = html;

    // Listen for changes
    elEditorArea.querySelectorAll('.blank-select').forEach(sel => {
      sel.addEventListener('change', () => {
        blankAnswers[sel.dataset.blank] = sel.value;
        sel.classList.toggle('filled', !!sel.value);
      });
    });

    const execBtn = document.getElementById('puzzle-exec-btn');
    if (execBtn) {
      execBtn.onclick = _executeBlank;
    }
  }

  function _buildMatchEditor(puzzle) {
    // Show target result
    let resultHtml = '<div style="margin-bottom:10px"><div class="pane-label" style="margin-bottom:6px">Target Result</div>';
    resultHtml += '<table class="result-table"><thead><tr>';
    puzzle.targetColumns.forEach(c => { resultHtml += `<th>${c}</th>`; });
    resultHtml += '</tr></thead><tbody>';
    puzzle.targetResult.forEach(row => {
      resultHtml += '<tr>';
      puzzle.targetColumns.forEach(c => { resultHtml += `<td>${row[c]}</td>`; });
      resultHtml += '</tr>';
    });
    resultHtml += '</tbody></table></div>';
    elResultsPane.innerHTML = resultHtml;

    elEditorArea.innerHTML = `<textarea class="sql-editor-full" id="puzzle-textarea"
      placeholder="-- Write your SQL query here" spellcheck="false"></textarea>`;

    const execBtn = document.getElementById('puzzle-exec-btn');
    if (execBtn) {
      execBtn.onclick = _executeQuery;
    }
  }

  function _executeQuery() {
    const ta = document.getElementById('puzzle-textarea');
    if (!ta) return;
    const answer = ta.value;
    _runValidation(answer);
  }

  function _executeBlank() {
    _runValidation(blankAnswers);
  }

  function _runValidation(answer) {
    // Spinner effect
    const btn = document.getElementById('puzzle-exec-btn');
    if (btn) {
      btn.classList.add('executing');
      btn.innerHTML = `<span class="spinner-ring"></span> Executing...`;
    }

    setTimeout(() => {
      if (btn) {
        btn.classList.remove('executing');
        btn.innerHTML = `<span class="play-icon"></span> Execute (F5)`;
      }

      const result = currentPuzzle.validate(answer);

      if (result.pass) {
        _setMessages(result.feedback, 'success');
        _markSolved();
      } else {
        _setMessages(result.feedback, 'error');
        _shakePuzzle();
      }
    }, 400);
  }

  function _markSolved() {
    const gs = Storage.getGameState('puzzle');
    if (!gs.solved) gs.solved = [];
    if (!gs.solved.includes(currentPuzzle.id)) {
      gs.solved.push(currentPuzzle.id);
      const elapsed = (Date.now() - startTime) / 1000;
      const pts = Score.calcPuzzleScore({ hintsUsed, timeElapsedSecs: elapsed, timeLimitSecs: 300 });
      Storage.addXP(pts);
      App.refreshXP();

      Modal.success(
        'Query Executed Successfully',
        `<div style="text-align:center">
          <div class="score-big">+${Score.formatScore(pts)}</div>
          <div class="text-dim mt-8">XP earned for solving <strong>${currentPuzzle.title}</strong></div>
          ${hintsUsed > 0 ? `<div class="text-warning mt-8">Hint penalty: −${hintsUsed * Score.CONSTANTS.PUZZLE_HINT_PENALTY} pts</div>` : ''}
        </div>`,
        [{ label: 'Back to Puzzles', primary: true, onClick: () => { App.refreshXP(); _renderList(); } }]
      );
    }
    Storage.saveGameState('puzzle', gs);
  }

  function _showHint() {
    hintsUsed++;
    const hintText = document.getElementById('hint-text');
    if (hintText) {
      hintText.style.display = 'inline';
      hintText.textContent   = currentPuzzle.hint;
    }
    const hintBtn = document.getElementById('btn-hint');
    if (hintBtn) hintBtn.disabled = true;
  }

  function _setMessages(text, type) {
    if (!elMessagesPane) return;
    elMessagesPane.textContent = text;
    elMessagesPane.className   = 'puzzle-pane-messages' + (type ? ` ${type}` : '');
  }

  function _clearResults() {
    if (elResultsPane) elResultsPane.innerHTML = '';
  }

  function _shakePuzzle() {
    if (elEditorArea) {
      elEditorArea.classList.add('shake');
      setTimeout(() => elEditorArea.classList.remove('shake'), 400);
    }
  }

  return { onEnter };
})();
