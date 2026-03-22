/* quiz.js — Quiz game logic */

const QuizGame = (() => {
  const QUESTION_COUNT = 10;
  const TIME_LIMIT = 30;

  let questions = [];
  let currentIdx = 0;
  let answered = false;
  let streak = 0;
  let roundScore = 0;
  let roundCorrect = 0;
  let timer = null;
  let timerBar = null;

  // ── DOM refs (cached on first enter) ──────────────────────
  let elStart, elGame, elSummary;
  let elQNum, elQDiff, elQText, elChoices, elExplanation, elTimerBar;
  let elSumScore, elSumCorrect, elSumStreak, elSumXP;

  function _cacheEls() {
    elStart       = document.getElementById('quiz-start');
    elGame        = document.getElementById('quiz-game');
    elSummary     = document.getElementById('quiz-summary');
    elQNum        = document.getElementById('quiz-q-num');
    elQDiff       = document.getElementById('quiz-q-diff');
    elQText       = document.getElementById('quiz-q-text');
    elChoices     = document.getElementById('quiz-choices-body');
    elExplanation = document.getElementById('quiz-explanation');
    elTimerBar    = document.getElementById('quiz-timer-bar');
    elSumScore    = document.getElementById('quiz-sum-score');
    elSumCorrect  = document.getElementById('quiz-sum-correct');
    elSumStreak   = document.getElementById('quiz-sum-streak');
    elSumXP       = document.getElementById('quiz-sum-xp');
  }

  function onEnter() {
    _cacheEls();
    _showPhase('start');
  }

  function _showPhase(phase) {
    elStart   && (elStart.style.display   = phase === 'start'   ? ''     : 'none');
    elGame    && (elGame.style.display    = phase === 'game'    ? 'flex' : 'none');
    elSummary && (elSummary.style.display = phase === 'summary' ? ''     : 'none');
  }

  function startRound() {
    const diff = App.getDifficulty();
    const pool = QUIZ_QUESTIONS.filter(q => q.difficulty === diff);

    // Shuffle and pick QUESTION_COUNT
    const shuffled = pool.slice().sort(() => Math.random() - 0.5);
    questions = shuffled.slice(0, Math.min(QUESTION_COUNT, shuffled.length));

    // Fill with other difficulties if not enough
    if (questions.length < QUESTION_COUNT) {
      const extra = QUIZ_QUESTIONS
        .filter(q => q.difficulty !== diff)
        .sort(() => Math.random() - 0.5)
        .slice(0, QUESTION_COUNT - questions.length);
      questions = questions.concat(extra);
    }

    currentIdx  = 0;
    streak      = 0;
    roundScore  = 0;
    roundCorrect = 0;

    _showPhase('game');
    _renderQuestion();
  }

  function _renderQuestion() {
    if (currentIdx >= questions.length) {
      _showSummary();
      return;
    }

    answered = false;
    const q = questions[currentIdx];

    elQNum.textContent  = `-- QUESTION ${currentIdx + 1} of ${questions.length}  [${q.difficulty.toUpperCase()}]`;
    elQDiff.className   = `badge badge-${q.difficulty}`;
    elQDiff.textContent = q.difficulty;
    elQText.textContent = q.question;
    elExplanation.innerHTML = '';
    elExplanation.style.display = 'none';

    // Build choices table rows
    elChoices.innerHTML = '';
    q.choices.forEach((choice, i) => {
      const tr = document.createElement('tr');
      tr.className = 'quiz-choice';
      tr.innerHTML = `<td class="col-rownum">${i + 1}</td><td>${choice}</td>`;
      tr.addEventListener('click', () => _handleAnswer(i, q));
      elChoices.appendChild(tr);
    });

    // Timer bar
    _startTimer();
  }

  function _startTimer() {
    if (timer) timer.reset();

    // Update status bar timer display
    const statusTimer = document.getElementById('status-timer');

    timer = new Timer({
      duration: TIME_LIMIT,
      displayEl: statusTimer,
      onTick: (elapsed, remaining) => {
        const pct = (remaining / TIME_LIMIT) * 100;
        if (elTimerBar) {
          elTimerBar.style.width = `${pct}%`;
          elTimerBar.classList.toggle('urgent', remaining <= 8);
        }
      },
      onExpire: () => {
        if (!answered) _handleAnswer(-1, questions[currentIdx]);
      },
    });
    timer.start();

    if (elTimerBar) {
      elTimerBar.style.width = '100%';
      elTimerBar.classList.remove('urgent');
    }
  }

  function _handleAnswer(choiceIdx, q) {
    if (answered) return;
    answered = true;
    timer.pause();

    const rows = elChoices.querySelectorAll('.quiz-choice');
    rows.forEach(r => r.classList.add('locked'));

    const isCorrect = choiceIdx === q.correct;
    const timeRemaining = timer.getRemaining();

    // Highlight choices
    if (choiceIdx >= 0) {
      rows[choiceIdx].classList.add(isCorrect ? 'correct' : 'wrong');
    }
    rows[q.correct].classList.add('correct');

    // Explanation
    elExplanation.innerHTML = `<span class="cmt">-- </span>${q.explanation}`;
    elExplanation.style.display = 'block';

    // Score
    if (isCorrect) {
      streak++;
      roundCorrect++;
      const pts = Score.calcQuizScore({
        correct: true,
        timeRemaining,
        timeLimitSecs: TIME_LIMIT,
        difficulty: q.difficulty,
        streak,
      });
      roundScore += pts;
    } else {
      streak = 0;
    }

    // Auto-advance after 2.5s
    setTimeout(() => {
      currentIdx++;
      _renderQuestion();
    }, 2500);
  }

  function _showSummary() {
    // Persist to storage
    const xpEarned = roundScore;
    Storage.addXP(xpEarned);
    const gs = Storage.getGameState('quiz');
    gs.highScore      = Math.max(gs.highScore || 0, roundScore);
    gs.questionsAnswered = (gs.questionsAnswered || 0) + questions.length;
    gs.bestStreak     = Math.max(gs.bestStreak || 0, streak);
    gs.roundsPlayed   = (gs.roundsPlayed || 0) + 1;
    Storage.saveGameState('quiz', gs);
    App.refreshXP();

    const accuracy = Math.round((roundCorrect / questions.length) * 100);

    if (elSumScore)   elSumScore.textContent   = Score.formatScore(roundScore);
    if (elSumCorrect) elSumCorrect.textContent  = `${roundCorrect} / ${questions.length} (${accuracy}%)`;
    if (elSumStreak)  elSumStreak.textContent   = String(streak);
    if (elSumXP)      elSumXP.textContent       = `+${Score.formatScore(xpEarned)} XP`;

    // Timer to 0
    const statusTimer = document.getElementById('status-timer');
    if (statusTimer) statusTimer.textContent = '00:00';

    _showPhase('summary');
  }

  return { onEnter, startRound };
})();
