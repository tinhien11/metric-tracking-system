# Metric Tracking System

A REST API for tracking distance and temperature metrics with unit conversion support.

## Stack

- **Runtime**: Node.js (pure JS, no TypeScript)
- **Framework**: Express
- **Database**: SQLite via `better-sqlite3`
- **Testing**: Node built-in test runner + Supertest

## Project Structure

```
metric-tracking-system/
├── app.js                              # Entry point
├── src/
│   ├── routes/metrics.js               # Route definitions
│   ├── controllers/metricController.js # Input validation
│   ├── services/metricService.js       # Business logic & DB queries
│   ├── utils/converter.js              # Unit conversion
│   └── db/database.js                  # SQLite setup
└── tests/
    └── metrics.test.js
```

## Setup

```bash
npm install
npm start        # production
npm run dev      # watch mode
npm test         # run tests
```

Server runs on `http://localhost:3000`
