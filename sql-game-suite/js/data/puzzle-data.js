/* puzzle-data.js — 5 puzzles with JS validation */

const PUZZLE_DATA = [
  {
    id: 'p001',
    type: 'fix',   // Type A: fix the broken query
    difficulty: 'beginner',
    title: 'Missing Quotes',
    description: 'The query below should return all employees in the Sales department, but it throws an error. Fix it.',
    brokenSql: `SELECT e.EmployeeName, d.DepartmentName
FROM Employees e
INNER JOIN Departments d ON e.DepartmentID = d.DepartmentID
WHERE d.DepartmentName = Sales`,
    hint: "SQL string values must be enclosed in single quotes. Identifiers (column/table names) don't need quotes, but literal text values do.",
    validate(answer) {
      const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
      if (a.includes("'SALES'") || a.includes('"SALES"')) {
        return { pass: true, feedback: "(1 row affected)\nQuery executed successfully." };
      }
      if (a.includes('SALES') && !a.includes("'SALES'")) {
        return { pass: false, feedback: "Msg 207, Level 16, State 1 — Invalid column name 'Sales'. String literals require single quotes." };
      }
      return { pass: false, feedback: "Msg 102, Level 15, State 1 — Incorrect syntax. Check the WHERE clause." };
    },
  },

  {
    id: 'p002',
    type: 'blank',  // Type B: fill in the blank
    difficulty: 'beginner',
    title: 'GROUP BY + HAVING',
    description: 'Complete the query to count sales per product, showing only products that sold more than 100 units.',
    template: [
      { text: 'SELECT ProductName, SUM(Quantity) AS TotalSold\nFROM OrderItems\n' },
      { blank: true, id: 'b1', options: ['GROUP', 'WHERE', 'HAVING', 'ORDER'], answer: 'GROUP' },
      { text: ' BY ProductName\n' },
      { blank: true, id: 'b2', options: ['WHERE', 'HAVING', 'GROUP', 'FILTER'], answer: 'HAVING' },
      { text: ' SUM(Quantity) > 100\nORDER BY TotalSold DESC' },
    ],
    hint: 'The first blank groups rows together. The second blank filters those groups.',
    validate(answers) {
      const b1 = (answers.b1 || '').toUpperCase().trim();
      const b2 = (answers.b2 || '').toUpperCase().trim();
      if (b1 === 'GROUP' && b2 === 'HAVING') {
        return { pass: true, feedback: "(8 rows affected)\nQuery executed successfully." };
      }
      if (b1 !== 'GROUP') {
        return { pass: false, feedback: `Msg 156, Level 15, State 1 — Incorrect syntax near '${answers.b1}'. Expected GROUP.` };
      }
      return { pass: false, feedback: `Msg 4145, Level 15, State 1 — An expression of non-boolean type was found near '${answers.b2}'.` };
    },
  },

  {
    id: 'p003',
    type: 'match',  // Type C: match the result set
    difficulty: 'intermediate',
    title: 'Average Salary by Department',
    description: 'Write a query against the Employees table that returns the average salary per department, only for departments where the average exceeds $65,000, sorted highest first.',
    targetResult: [
      { Department: 'Engineering', AvgSalary: '95000.00' },
      { Department: 'Marketing',   AvgSalary: '72000.00' },
      { Department: 'Sales',       AvgSalary: '68000.00' },
    ],
    targetColumns: ['Department', 'AvgSalary'],
    hint: 'You need AVG(), GROUP BY, HAVING, and ORDER BY. The column filtering groups (not rows) needs a specific clause.',
    validate(answer) {
      const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
      const required = ['AVG', 'GROUP BY', 'HAVING', 'ORDER BY'];
      const missing = required.filter(r => !a.includes(r));
      if (missing.length === 0) {
        if (!a.includes('DESC') && !a.includes('ASC')) {
          return { pass: false, feedback: "Msg 4 — Results not sorted correctly. Specify ORDER BY ... DESC for highest first." };
        }
        return { pass: true, feedback: "(3 rows affected)\nQuery executed successfully." };
      }
      return { pass: false, feedback: `Msg 8120, Level 16, State 1 — Missing required clause(s): ${missing.join(', ')}.` };
    },
  },

  {
    id: 'p004',
    type: 'fix',
    difficulty: 'intermediate',
    title: 'Wrong Sort Order',
    description: 'This query is supposed to find the 3 highest salaries, but it returns the wrong results. Fix the sort direction.',
    brokenSql: `-- Find the top 3 highest salaries
SELECT DISTINCT TOP 3 Salary
FROM Employees
ORDER BY Salary ASC`,
    hint: 'Think about which ORDER BY direction puts the largest values first.',
    validate(answer) {
      const a = answer.toUpperCase().replace(/\s+/g, ' ').trim();
      if (a.includes('ORDER BY SALARY DESC') || a.includes('ORDER BY SALARY  DESC')) {
        return { pass: true, feedback: "(3 rows affected)\nTop 3 salaries returned correctly." };
      }
      if (a.includes('ASC')) {
        return { pass: false, feedback: "Msg 0 — Query runs but returns the 3 LOWEST salaries. ASC sorts ascending (smallest first). Try the other direction." };
      }
      return { pass: false, feedback: "Msg 102, Level 15, State 1 — Unexpected syntax in ORDER BY clause." };
    },
  },

  {
    id: 'p005',
    type: 'blank',
    difficulty: 'advanced',
    title: 'Window Function Blanks',
    description: 'Complete the window function expression to rank employees by salary within each department.',
    template: [
      { text: 'SELECT\n    EmployeeName,\n    Salary,\n    ' },
      { blank: true, id: 'b1', options: ['RANK', 'COUNT', 'SUM', 'ROW_NUMBER'], answer: 'RANK' },
      { text: '(Salary) OVER (' },
      { blank: true, id: 'b2', options: ['PARTITION', 'ORDER', 'GROUP', 'HAVING'], answer: 'PARTITION' },
      { text: ' BY DepartmentID ' },
      { blank: true, id: 'b3', options: ['ORDER', 'PARTITION', 'SORT', 'GROUP'], answer: 'ORDER' },
      { text: ' BY Salary DESC) AS SalaryRank\nFROM Employees' },
    ],
    hint: 'Window functions use OVER(). The first word divides the result into groups. The second sorts within each group.',
    validate(answers) {
      const b1 = (answers.b1 || '').toUpperCase().trim();
      const b2 = (answers.b2 || '').toUpperCase().trim();
      const b3 = (answers.b3 || '').toUpperCase().trim();
      const errors = [];
      if (b1 !== 'RANK') errors.push(`'${answers.b1 || '?'}' is not a ranking function`);
      if (b2 !== 'PARTITION') errors.push(`'${answers.b2 || '?'}' should be PARTITION`);
      if (b3 !== 'ORDER') errors.push(`'${answers.b3 || '?'}' should be ORDER`);
      if (errors.length === 0) {
        return { pass: true, feedback: "(12 rows affected)\nEmployees ranked by salary within each department." };
      }
      return { pass: false, feedback: `Msg 4108, Level 15, State 1 — Windowed functions: ${errors.join('; ')}.` };
    },
  },
];
