# XHS Trend Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight local tool that scans 1-5 Xiaohongshu-related keywords, ranks public candidate notes, and outputs a dashboard plus Markdown daily report.

**Architecture:** A Node CLI reads `config/keywords.yml`, runs pluggable public collectors, normalizes notes, scores them, and writes `data/runs`, `public/latest-run.json`, and `reports/*.md`. A React + Vite dashboard reads `public/latest-run.json` and presents ranked notes, signals, and daily insights. Collector interfaces reserve a future logged-in browser collector.

**Tech Stack:** TypeScript, Node.js, React, Vite, Vitest, Playwright, Cheerio.

---

### Task 1: Core Types, Scoring, And Reporting

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/scoring/score.ts`
- Create: `src/reporting/markdown.ts`
- Test: `tests/scoring.test.ts`
- Test: `tests/reporting.test.ts`

- [ ] Write failing tests for score ordering, missing metrics, and Markdown sections.
- [ ] Implement minimal type definitions, scoring, and report generator.
- [ ] Run `npm test`.

### Task 2: Public Collection And Scan CLI

**Files:**
- Create: `src/config/loadConfig.ts`
- Create: `src/collectors/types.ts`
- Create: `src/collectors/publicBrowserCollector.ts`
- Create: `src/collectors/searchFallbackCollector.ts`
- Create: `src/collectors/collectorPipeline.ts`
- Create: `src/cli/scan.ts`
- Test: `tests/collectorPipeline.test.ts`

- [ ] Write failing tests for dedupe and fallback behavior.
- [ ] Implement config loading, collector pipeline, and scan output writer.
- [ ] Run `npm run scan`.

### Task 3: Dashboard

**Files:**
- Create: `src/dashboard/main.tsx`
- Create: `src/dashboard/App.tsx`
- Create: `src/dashboard/styles.css`
- Create: `public/latest-run.json`

- [ ] Implement a clean operational dashboard that reads latest scan data.
- [ ] Run `npm run build`.
- [ ] Start `npm run dev` and verify the page renders.
