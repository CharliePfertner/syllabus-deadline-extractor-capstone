# CLAUDE.md — Syllabus Deadline Extractor

## Project Overview
The Syllabus Deadline Extractor is a single-page web utility designed to simplify academic organization for high school and college students. Users paste the raw, unformatted text of a course syllabus into the application, which automatically parses out assignment titles and their associated due dates. These deadlines are aggregated into an interactive checklist where users can review, edit, or filter the results before exporting them into a standardized `.ics` calendar file. This file can be instantly imported into mainstream calendar applications like Google Calendar or Apple Calendar, eliminating the tedious chore of manual date entry.

## Tech Stack & Rationale
This project is built using a modern, lightweight web stack: **React (via Vite)** for the user interface, **Tailwind CSS** for rapid styling, and standard client-side JavaScript APIs for handling text processing and file downloads. React was chosen for its efficient, reactive state management, which allows the dynamic checklist to update instantly as users toggle or modify deadlines. Tailwind CSS guarantees a clean, accessible, and responsive user experience with minimal styling overhead. By executing all Regular Expression text parsing and `.ics` file blob generation directly in the browser, we eliminate the need for a backend server, making the application fast, secure, free to host, and fully privacy-compliant.

## Code Guidelines & Conventions
- **Functional Architecture:** Write clean, modular, functional React components. Keep utility text parsing functions completely pure and isolated in `/src/utils/` so they can be tested independently of the UI.
- **State Management:** Use standard React hooks (`useState`, `useMemo`). Keep component state local; do not introduce complex global state management libraries (like Redux or Zustand).
- **Date Standardization:** Force all extracted dates into a strict ISO format (`YYYY-MM-DD`). If a syllabus omits the year, default to the current year (2026).
- **TypeScript-like JSDoc:** Write clear JSDoc comments for helper functions detailing expected input strings and output object shapes.
- **Component Anatomy:** Use explicit semantic HTML tags for layouts (e.g., `<main>`, `<section>`, `<header>`, `<table>`). Ensure all form inputs have associated `<label>` tags for accessibility.

## Strict Restrictions (What NOT to Do)
- **No Third-Party Ecosystem Bloat:** Do not install extra npm packages or dependencies without asking explicitly. Use native browser Web APIs for downloading the file blob and standard vanilla JavaScript RegExp for text parsing.
- **Never Alter Tests to Pass:** Do not modify existing test assertions or validation suites just to bypass a failing error condition. Fix the application logic, not the benchmark.
- **Avoid Inline CSS:** Do not use inline `style={{}}` attributes in React components; utilize Tailwind CSS utility classes exclusively.
- **No Mock-Heavy Refactoring:** Do not tear down working layouts or component structures to replace them with large, speculative multi-file systems. Build iteratively on top of the established layout.
