## Task 1 — Scaffold the repository and write the project instructions
- Brief: Create the project directory structure, initialize git, set up a basic Python or Node.js environment, and draft a CLAUDE.md file specifying the app architecture and styling guidelines. 
- What Claude proposed: Create package.json with React/Vite/Tailwind dependencies
- What I changed before approving: I had Claude add .gitignore to keep node_modules/ out of git.
- Verification: Ran git status to see the clean scaffold and open CLAUDE.md to confirm the project rules are readable.
- One thing I learned: A project directory structure is needed before starting to code.
## Task 2 — Build a baseline regex text parser
- Brief: Write a core utility helper function that takes a hardcoded string of text containing 3 typical syllabus styles (e.g., "Oct 24 - Midterm Exam", "Due 11/15: Essay 1", "09-02-2026 Homework 3") and uses regular expressions to extract dates and titles. 
- What Claude proposed: Claude built src/utils/parseDeadlines.js — four named regex patterns, tried in order per line
- What I changed before approving: I told Claude to run a parser verification script to prove the parsers work.
- Verification: Ran a local script in the terminal to assert that the function output returns a clean array of objects with isolated title and date strings.
- One thing I learned: I learned that text parsers are used to detect common words needed, for, in this case, a syllabus.
## Task 3 — Implement date normalization logic
- Brief: Add a helper function using a library like date-fns (JS) or datetime (Python) to convert those various parsed date strings into a standardized ISO format (YYYY−MM−DD), defaulting to the current year (2026) if the year is omitted. 
- What Claude proposed: The CLAUDE.md explicitly prohibits installing extra packages without asking — so I'll implement this with pure vanilla JS RegExp rather than date-fns, which fits the project's no-bloat rule and keeps everything browser-native.
- What I changed before approving: I had Claude run a date normalization verification script
- Verification: Feed mock inputs like "Sept 5" and "12/25" into the function and print the console logs to confirm they output 2026-09-05 and 2026-12-25 precisely.
- One thing I learned: I learned that there are many different libaries you can use to set date and time.
## Task 4 — 
- Brief: Create the core .ics generation engine: Integrate an ICS generation library (like ics for npm or icalendar for Python) to map your normalized array of deadline objects into valid iCalendar standard text format. 
- What Claude proposed: Write src/utils/generateIcs.js — map deadline objects to RFC 5545 iCalendar text, write scripts/test-ics.mjs — print raw output and assert required calendar tags, run test script and visually confirm BEGIN:VCALENDAR / VEVENT / END:VCALENDAR tags
- What I changed before approving: I had Claude run the ICS generation verification script.
- Verification: Run the generator script, print the raw output string to the terminal, and visually confirm it contains proper BEGIN:VCALENDAR, BEGIN:VEVENT, and END:VCALENDAR tags.
- One thing I learned: I learned that there is a lot that goes into extracting a syllabus deadline that doesn't just include retrieving text.
## Task 5 — Wire up the UI layout skeleton
- Brief: Scaffold a clean frontend single-page interface featuring a large text area for pasting the syllabus text, a "Parse Deadlines" submit button, and a hidden results container.
- What Claude proposed: 
  - Header — title + subtitle, white bar with shadow
  - Labeled textarea — full-width, monospace, placeholder shows example formats
  - Parse Deadlines button — correctly disabled (muted green) with no text entered
  - Ctrl+Enter tip — visible below the textarea
  - Results container — hidden until a parse is triggered (not shown, as expected)
- What I changed before approving: I had Claude take a screenshot of the website to prove that everything renders clearly
- Verification: Launch your local development server and open the browser to ensure the form elements render on the page correctly without layout errors.
- One thing I learned: I learned that Claude can take screenshots and place them into Visual Studio Code.
## Task 6 — Connect UI state to the API route
- Brief: Add an event handler to the submit button that grabs the raw pasted textarea value, sends it to your POST /api/extract route via an asynchronous network call, and stores the JSON response array into frontend component state. 
- What Claude proposed: The console.log in App.jsx:13 fires on every parse and logs the full array — visible in any browser's DevTools console. No network tab needed since everything runs client-side, which is the correct architecture for this project.
- What I changed before approving: I had Claude take a screenshot of the website to prove that everything renders clearly
- Verification: Paste a sample syllabus, click the button, check the browser's Network tab to confirm a successful network request, and use console logs to verify the frontend successfully received the array of matches. 
- One thing I learned: There is a lot of steps that need to be taken to make sure the front-end and back-end work together well.