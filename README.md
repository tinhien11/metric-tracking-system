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


---

## API Reference

### POST /metrics
Add a new metric entry.

**Body:**
```json
{
  "userId": "user1",
  "type":   "distance",
  "date":   "2026-03-06",
  "value":  100,
  "unit":   "meter"
}
```

| Field    | Required | Description                      |
|----------|----------|----------------------------------|
| `userId` | yes      | Identifies the owner of the data |
| `type`   | yes      | `distance` or `temperature`      |
| `date`   | yes      | `YYYY-MM-DD`                     |
| `value`  | yes      | Numeric value                    |
| `unit`   | yes      | See valid units below            |

**Valid units:**
- `distance`: `meter`, `centimeter`, `inch`, `feet`, `yard`
- `temperature`: `C`, `F`, `K`

---

### GET /metrics
Retrieve all metrics for a user by type, with optional pagination and unit conversion.

| Param    | Required | Default | Description                                   |
|----------|----------|---------|-----------------------------------------------|
| `userId` | yes      |         |                                               |
| `type`   | yes      |         | `distance` or `temperature`                   |
| `unit`   | no       |         | If provided, converts all values to this unit |
| `page`   | no       | `1`     |                                               |
| `limit`  | no       | `20`    | Max `100`                                     |

**Response:**
```json
{
  "data": [
    { "id": 1, "user_id": "user1", "type": "distance", "value": 3.28084, "unit": "feet", "date": "2026-03-06" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### GET /metrics/chart
Chart-ready data: one entry per day (latest insert), filtered by time period.

| Param    | Required | Default | Description                                   |
|----------|----------|---------|-----------------------------------------------|
| `userId` | yes      |         |                                               |
| `type`   | yes      |         | `distance` or `temperature`                   |
| `period` | no       | `1`     | Number of months to look back                 |
| `unit`   | no       |         | If provided, converts all values to this unit |

**Response:**
```json
[
  { "date": "2026-03-01", "value": 100, "unit": "meter" },
  { "date": "2026-03-06", "value": 200, "unit": "meter" }
]
```

---

## Examples

```bash
# Add a distance metric
curl -X POST http://localhost:3000/metrics \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","type":"distance","date":"2026-03-06","value":1,"unit":"meter"}'

# Add a temperature metric
curl -X POST http://localhost:3000/metrics \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","type":"temperature","date":"2026-03-06","value":100,"unit":"C"}'

# List all distance metrics, converted to feet
curl "http://localhost:3000/metrics?userId=user1&type=distance&unit=feet"

# Chart data for last 2 months, converted to centimeter
curl "http://localhost:3000/metrics/chart?userId=user1&type=distance&period=2&unit=centimeter"
```

---


