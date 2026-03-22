/* escape-chapters.js — 5 chapter narratives and puzzle specs */

const ESCAPE_CHAPTERS = [
  {
    id: 1,
    title: 'The Deadlock',
    callTime: '02:47 AM',
    callText: '"The production database is down. Orders aren\'t processing. The CEO is awake. Fix it."',
    narrative: `-- CHAPTER 1: THE DEADLOCK
-- ─────────────────────────────────────────────────
-- You remote in. The error log is flooding:
--
-- Msg 1205, Level 13, State 51
-- Transaction (Process ID 72) was deadlocked
-- on lock resources with another process.
-- Chosen as the deadlock victim. Retry.
--
-- Orders are piling up. You need to find
-- what's blocking what — and kill it.`,
    successNarrative: 'The blocking session is terminated. Orders begin flowing again.\n-- (1205 errors stop immediately)\n-- But why did this deadlock happen in the first place?',
    puzzles: [
      {
        id: 'e1p1',
        type: 'table-select',
        prompt: 'Examine the blocking session data below. Which session_id is the ROOT blocker (blocking_session_id = 0)?',
        tableData: {
          columns: ['session_id', 'blocking_session_id', 'wait_type', 'wait_time_ms', 'status'],
          rows: [
            ['72', '65', 'LCK_M_X', '18432', 'suspended'],
            ['65', '0',  'ASYNC_NETWORK_IO', '124', 'running'],
            ['58', '72', 'LCK_M_S', '18501', 'suspended'],
          ],
        },
        options: ['Session 58', 'Session 65', 'Session 72', 'None — no blocker'],
        correct: 1,  // index
        validate(answer) {
          if (answer === 1 || String(answer).includes('65')) {
            return { pass: true, feedback: 'Correct. Session 65 has blocking_session_id = 0, meaning it is blocked by nothing — it is the root.' };
          }
          return { pass: false, feedback: 'Msg 1205 — Incorrect. Look for the row where blocking_session_id = 0.' };
        },
      },
      {
        id: 'e1p2',
        type: 'free-text',
        prompt: 'Write the T-SQL command to terminate session 65.',
        placeholder: 'KILL ...',
        hint: 'The command is a single word followed by the session ID.',
        validate(answer) {
          const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
          if (/^KILL\s+65\s*;?$/.test(a)) {
            return { pass: true, feedback: 'Command(s) completed successfully. Session 65 has been killed.' };
          }
          if (a.startsWith('KILL') && !a.includes('65')) {
            return { pass: false, feedback: 'Msg 6106, Level 16, State 1 — Incorrect session ID. Which session was the root blocker?' };
          }
          return { pass: false, feedback: 'Msg 102, Level 15, State 1 — Incorrect syntax. Hint: KILL <session_id>' };
        },
      },
    ],
  },

  {
    id: 2,
    title: 'The Missing Index',
    narrative: `-- CHAPTER 2: THE MISSING INDEX
-- ─────────────────────────────────────────────────
-- Orders are flowing again, but queries are slow.
-- A developer left last week and nobody knows
-- what changed. You check the execution plan.
--
-- Table Scan on Orders
-- Estimated cost: 94%
-- Estimated rows: 1,847,293
-- Missing Index (impact 98.7%)
--
-- The optimizer is crying. You must fix this.`,
    successNarrative: 'Index created. Query cost drops from 94% to 2%.\n-- The CEO\'s phone stops ringing. For now.\n-- (1 row affected)',
    puzzles: [
      {
        id: 'e2p1',
        type: 'free-text',
        prompt: `The slow query is:\n\nSELECT OrderID, CustomerID, OrderDate\nFROM Orders\nWHERE CustomerID = @CustID\n  AND OrderDate > @Date\n\nWrite a CREATE INDEX statement that would help this query. Use table name "Orders".`,
        placeholder: 'CREATE INDEX ...',
        hint: 'Include both CustomerID and OrderDate in the index. Consider which column to put first based on the WHERE clause.',
        validate(answer) {
          const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
          const required = ['CREATE', 'INDEX', 'ORDERS', 'CUSTOMERID', 'ORDERDATE'];
          const missing = required.filter(r => !a.includes(r));
          if (missing.length === 0) {
            return { pass: true, feedback: '(0 rows affected)\nThe CREATE INDEX command completed successfully.' };
          }
          return { pass: false, feedback: `Msg 1902, Level 16, State 3 — Missing elements in index definition: ${missing.join(', ')}.` };
        },
      },
    ],
  },

  {
    id: 3,
    title: 'The Corrupted Backup',
    narrative: `-- CHAPTER 3: THE CORRUPTED BACKUP
-- ─────────────────────────────────────────────────
-- It's 4:15 AM. A Slack message appears:
--
-- [junior_dev]: "hey quick question, what does
--               DROP TABLE do exactly"
-- [junior_dev]: "asking for a friend"
-- [junior_dev]: "in prod"
-- [junior_dev]: "without a WHERE clause"
--
-- The most recent backup: 3 days ago.
-- The transaction log: intact.
-- You: wide awake.`,
    successNarrative: 'Database restored to 16:42:59 — one second before the DROP.\n-- 1,847,293 rows recovered.\n-- The junior dev is writing an incident report.\n-- You are a hero. For the next 20 minutes.',
    puzzles: [
      {
        id: 'e3p1',
        type: 'mc',
        prompt: 'The DROP TABLE occurred at exactly 16:43:00. Which RESTORE command recovers the database to the point just BEFORE the drop?',
        options: [
          'RESTORE DATABASE Orders FROM DISK = \'backup.bak\' WITH RECOVERY',
          'RESTORE DATABASE Orders FROM DISK = \'backup.bak\' WITH NORECOVERY',
          "RESTORE DATABASE Orders FROM DISK = 'backup.bak' WITH STOPAT = '2024-11-15 16:42:59', RECOVERY",
          'RESTORE LOG Orders FROM DISK = \'log.bak\' WITH NORECOVERY',
        ],
        correct: 2,
        validate(answer) {
          if (answer === 2 || String(answer).toUpperCase().includes('STOPAT')) {
            return { pass: true, feedback: "Correct. STOPAT specifies the point-in-time recovery target. RECOVERY brings the database online." };
          }
          return { pass: false, feedback: 'Msg 3013, Level 16, State 1 — RESTORE DATABASE is terminating abnormally. STOPAT is required for point-in-time recovery.' };
        },
      },
      {
        id: 'e3p2',
        type: 'free-text',
        prompt: `The junior dev claims they only dropped "test rows."\nYou have an audit log table: dbo.AuditLog (EventType, TableName, RowCount, EventTime).\nWrite a query to find the recorded row count for the Orders table at the time of the DROP event.`,
        placeholder: 'SELECT ...',
        hint: "Filter AuditLog by TableName = 'Orders' and EventType containing 'DROP'.",
        validate(answer) {
          const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
          if (a.includes('AUDITLOG') && (a.includes('DROP') || a.includes('ORDERS'))) {
            return { pass: true, feedback: '(1 row affected)\nRowCount: 1847293\nNot "just a few test rows." The junior dev lied.' };
          }
          return { pass: false, feedback: 'Msg 208, Level 16, State 1 — Query must reference dbo.AuditLog with appropriate filters.' };
        },
      },
    ],
  },

  {
    id: 4,
    title: 'Parameter Sniffing',
    narrative: `-- CHAPTER 4: THE PARAMETER SNIFFING TRAP
-- ─────────────────────────────────────────────────
-- It's 5:30 AM. A stored procedure
-- that runs in 200ms for small customers
-- takes 8 MINUTES for Enterprise accounts.
--
-- The sales team is calling.
-- The Enterprise customer is calling.
-- The VP of Sales is texting the CEO.
--
-- Something smells like parameter sniffing.`,
    successNarrative: "Stored procedure fixed. Execution time: 180ms for all customer sizes.\n-- You add a comment:\n-- /* Learned this the hard way. Don't be like me. */\n-- (0 rows affected)",
    puzzles: [
      {
        id: 'e4p1',
        type: 'mc',
        prompt: 'Why does the stored procedure run fast for small customers but takes 8 minutes for Enterprise accounts?',
        options: [
          'The query has a syntax error that only manifests for large datasets',
          'The database server needs a reboot to clear memory pressure',
          'SQL Server cached an execution plan optimized for a small @CustomerID value; that plan performs a Table Scan instead of an Index Seek for large accounts',
          'The index on CustomerID is corrupt and needs rebuilding',
        ],
        correct: 2,
        validate(answer) {
          if (answer === 2) {
            return { pass: true, feedback: 'Correct. Parameter sniffing: SQL Server compiles and caches the plan based on the first parameter value it sees. A plan optimal for CustomerID=1 (few rows) may use a Table Scan that is catastrophic for CustomerID=10000 (millions of rows).' };
          }
          return { pass: false, feedback: 'Msg 0 — Incorrect diagnosis. Think about what SQL Server caches and when.' };
        },
      },
      {
        id: 'e4p2',
        type: 'free-text',
        prompt: `Add the correct query hint to force SQL Server to recompile the execution plan for each execution:\n\nCREATE PROCEDURE GetCustomerOrders\n  @CustomerID INT\nAS\n  SELECT * FROM Orders WHERE CustomerID = @CustomerID\n  -- Add your hint on the line above`,
        placeholder: 'OPTION (...) or WITH RECOMPILE',
        hint: 'The hint goes at the end of the SELECT statement (not the procedure definition) and forces a fresh plan every execution.',
        validate(answer) {
          const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
          if (a.includes('OPTION') && a.includes('RECOMPILE')) {
            return { pass: true, feedback: 'Correct. OPTION (RECOMPILE) forces plan recompilation per execution, ensuring the optimizer picks the best plan for each parameter value.' };
          }
          if (a.includes('WITH RECOMPILE')) {
            return { pass: true, feedback: 'Correct. WITH RECOMPILE on the procedure definition forces recompile every time — though OPTION (RECOMPILE) on the statement is more targeted.' };
          }
          return { pass: false, feedback: 'Msg 8622, Level 16, State 1 — Query processor could not produce a query plan. The hint syntax is incorrect.' };
        },
      },
    ],
  },

  {
    id: 5,
    title: 'The Final Boss — The Audit',
    narrative: `-- CHAPTER 5: THE AUDIT
-- ─────────────────────────────────────────────────
-- 6:00 AM. You fixed the deadlock, the missing
-- index, the corrupted data, and the parameter
-- sniffing. Four crises. One night. Zero sleep.
--
-- Then: an email.
-- Subject: Security Audit — 8 AM
-- From: compliance@company.com
--
-- They want to know who has access to what.
-- A user called 'sa' was active at 3:17 AM.
-- This is fine. Everything is fine.`,
    successNarrative: null,  // handled specially — final ending
    puzzles: [
      {
        id: 'e5p1',
        type: 'free-text',
        prompt: 'Write a query to list all logins that are members of the sysadmin server role. Use sys.server_role_members and sys.server_principals.',
        placeholder: 'SELECT ...',
        hint: 'JOIN sys.server_role_members to sys.server_principals twice — once for the role, once for the member.',
        validate(answer) {
          const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
          const hasPrincipals = a.includes('SERVER_PRINCIPALS') || a.includes('SYSLOGINS');
          const hasSysadmin  = a.includes('SYSADMIN');
          if (hasPrincipals && hasSysadmin) {
            return { pass: true, feedback: "(3 rows affected)\nname          type_desc\n----          ---------\nsa            SQL_LOGIN\nNT AUTHORITY\\SYSTEM  WINDOWS_LOGIN\nYourAccount   SQL_LOGIN\n\nHm." };
          }
          return { pass: false, feedback: 'Msg 208, Level 16, State 1 — Reference sys.server_role_members and filter for the sysadmin role.' };
        },
      },
      {
        id: 'e5p2',
        type: 'free-text',
        prompt: "The 'sa' account was active at 3:17 AM. Write a query to check recent session/connection history for the sa login.",
        placeholder: 'SELECT ...',
        hint: 'Check sys.dm_exec_sessions and filter by login_name.',
        validate(answer) {
          const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
          const hasDMV = a.includes('DM_EXEC_SESSIONS') || a.includes('DM_EXEC_CONNECTIONS') || a.includes('XP_LOGININFO');
          if (hasDMV) {
            return { pass: true, feedback: "(1 row affected)\nlogin_name  login_time            host_name\n------      ----------            ---------\nsa          2024-11-15 03:17:42  UNKNOWN-PC\n\nThis is not fine." };
          }
          return { pass: false, feedback: 'Msg 208, Level 16, State 1 — Try querying a Dynamic Management View (DMV) for session information.' };
        },
      },
    ],
  },
];

// Final ending text (shown after chapter 5 complete, typewriter-style)
const ESCAPE_ENDING_LINES = [
  "It's 8:15 AM.",
  "The auditors are satisfied.",
  "The CEO sends a one-word email: 'Good.'",
  "",
  "You fixed:",
  "  ✓ A production deadlock",
  "  ✓ A missing index with 98.7% query cost",
  "  ✓ A dropped production table",
  "  ✓ Parameter sniffing on a critical stored procedure",
  "  ✓ A suspicious sa login at 3 AM",
  "",
  "You close your laptop.",
  "You deserve coffee. And a raise.",
  "",
  "SELECT GETDATE() AS [You_Survived];",
  "",
  "-- (1 row affected)",
];
