/* wordgame-data.js — Hangman word list + pre-built word search grid */

const HANGMAN_WORDS = [
  { word: 'TRANSACTION',   difficulty: 'intermediate', definition: 'A unit of work that is atomic, consistent, isolated, and durable (ACID).' },
  { word: 'DEADLOCK',      difficulty: 'advanced',     definition: 'A situation where two transactions block each other, each waiting for the other to release a lock.' },
  { word: 'PARTITION',     difficulty: 'advanced',     definition: 'Divides a result set into groups for window function calculations.' },
  { word: 'CLUSTERED',     difficulty: 'intermediate', definition: 'An index type that physically reorders table data to match the index key order.' },
  { word: 'COALESCE',      difficulty: 'intermediate', definition: 'Returns the first non-NULL value in a list of expressions.' },
  { word: 'CONSTRAINT',    difficulty: 'beginner',     definition: 'A rule enforced on a column or table, such as NOT NULL, UNIQUE, or FOREIGN KEY.' },
  { word: 'AGGREGATE',     difficulty: 'beginner',     definition: 'A function that computes a single result from multiple rows: SUM, COUNT, AVG, MIN, MAX.' },
  { word: 'SUBQUERY',      difficulty: 'intermediate', definition: 'A query nested inside another query, used in SELECT, FROM, or WHERE clauses.' },
  { word: 'ISOLATION',     difficulty: 'advanced',     definition: 'The degree to which one transaction is shielded from the effects of other concurrent transactions.' },
  { word: 'EXECUTION',     difficulty: 'intermediate', definition: 'The process of running a SQL query according to an optimized query plan.' },
  { word: 'CARDINALITY',   difficulty: 'advanced',     definition: 'The uniqueness of data values in a column; high cardinality means many unique values.' },
  { word: 'NORMALIZATION', difficulty: 'intermediate', definition: 'Organizing a database to reduce redundancy by dividing data into related tables.' },
  { word: 'TRIGGER',       difficulty: 'beginner',     definition: 'A stored procedure that runs automatically in response to INSERT, UPDATE, or DELETE events.' },
  { word: 'ROLLBACK',      difficulty: 'beginner',     definition: 'Undoes all changes made in the current transaction.' },
  { word: 'FRAGMENTATION', difficulty: 'advanced',     definition: 'Occurs when the logical order of index pages does not match physical disk order, degrading performance.' },
  { word: 'REPLICATION',   difficulty: 'advanced',     definition: 'Copying and distributing data and database objects from one database to another.' },
  { word: 'STATISTICS',    difficulty: 'intermediate', definition: 'Objects SQL Server uses to estimate row counts for query optimization.' },
  { word: 'CHECKPOINT',    difficulty: 'advanced',     definition: 'A database event that writes all dirty pages from memory to disk.' },
  { word: 'PREDICATE',     difficulty: 'intermediate', definition: 'A condition in a WHERE clause that evaluates to TRUE, FALSE, or UNKNOWN for each row.' },
  { word: 'SARGABLE',      difficulty: 'advanced',     definition: 'A predicate that can use an index seek (Search ARGument ABLE); avoid wrapping indexed columns in functions.' },
];

// SSMS error messages for wrong hangman guesses (6 levels)
const HANGMAN_ERRORS = [
  'Msg 8152, Level 16, State 14 — String or binary data would be truncated.',
  'Msg 547, Level 16, State 0 — The INSERT statement conflicted with the FOREIGN KEY constraint.',
  'Msg 1205, Level 13, State 51 — Transaction was deadlocked and chosen as the deadlock victim. Retry.',
  "Msg 208, Level 16, State 1 — Invalid object name 'dbo.YourCareer'.",
  "Msg 4064, Level 11, State 1 — Cannot open database requested by the login. Login failed.",
  'Msg 911, Level 16, State 99 — DATABASE IS ON FIRE. Rollback initiated. Job security: NULL.',
];

// ============================================================
// PRE-BUILT 15×15 WORD SEARCH GRID
// Hidden words (horizontal only, no diagonal):
//   SELECT, INSERT, DELETE, UPDATE, INDEX, TABLE,
//   QUERY, JOIN, VIEW, SCHEMA, CURSOR, GRANT
//
// Words are placed as follows (0-indexed row, col, direction H/V):
//   SELECT  → H row 0,  col 0
//   INSERT  → H row 2,  col 4
//   DELETE  → H row 4,  col 7
//   UPDATE  → H row 6,  col 2
//   INDEX   → H row 8,  col 9
//   TABLE   → H row 10, col 1
//   QUERY   → H row 1,  col 8
//   JOIN    → V row 0,  col 14
//   VIEW    → H row 3,  col 0
//   SCHEMA  → H row 5,  col 5
//   CURSOR  → V row 7,  col 6
//   GRANT   → H row 12, col 3
// ============================================================

const WS_WORDS = [
  { word: 'SELECT', row: 0,  col: 0,  dir: 'H' },
  { word: 'INSERT', row: 2,  col: 4,  dir: 'H' },
  { word: 'DELETE', row: 4,  col: 7,  dir: 'H' },
  { word: 'UPDATE', row: 6,  col: 2,  dir: 'H' },
  { word: 'INDEX',  row: 8,  col: 9,  dir: 'H' },
  { word: 'TABLE',  row: 10, col: 1,  dir: 'H' },
  { word: 'QUERY',  row: 1,  col: 8,  dir: 'H' },
  { word: 'JOIN',   row: 0,  col: 14, dir: 'V' },
  { word: 'VIEW',   row: 3,  col: 0,  dir: 'H' },
  { word: 'SCHEMA', row: 5,  col: 5,  dir: 'H' },
  { word: 'CURSOR', row: 7,  col: 6,  dir: 'V' },
  { word: 'GRANT',  row: 12, col: 3,  dir: 'H' },
];

// Build the grid
function buildWordSearchGrid() {
  const ROWS = 15, COLS = 15;
  const FILL = 'ABCDEFGHIJKLMNOPRSTUVWXZ'; // no Q/Y to avoid accidental words

  // Initialize with filler
  const grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => FILL[Math.floor(Math.random() * FILL.length)])
  );

  // Place each word
  WS_WORDS.forEach(({ word, row, col, dir }) => {
    for (let i = 0; i < word.length; i++) {
      if (dir === 'H') grid[row][col + i] = word[i];
      else             grid[row + i][col] = word[i];
    }
  });

  return grid;
}

// Cell coordinate sets for each word (for found-highlight mapping)
function getWordCells(wordObj) {
  const cells = [];
  for (let i = 0; i < wordObj.word.length; i++) {
    if (wordObj.dir === 'H') cells.push([wordObj.row, wordObj.col + i]);
    else                      cells.push([wordObj.row + i, wordObj.col]);
  }
  return cells;
}
