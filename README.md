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

## System Design

### How a request flows

```
HTTP Request
    │
    ▼
Controller     ← check input, return error if bad
    │
    ▼
Service        ← run the logic, talk to database
    │
    ▼
SQLite DB      ← save raw value and unit
    │
    ▼ (when reading)
Converter      ← change unit if user asked for one
```

---

## How Key Parts Work

| Part | How |
|------|-----|
| Save & convert | Save raw value + unit. Convert only when reading. Original data never changes. |
| Distance | Each unit has a ratio to meter. Formula: `result = value × fromRatio / toRatio`. Add new unit = one line. |
| Temperature | Convert via Celsius: `any → C → any`. Add new unit = two small functions. |
| Latest per day | Use `MAX(id)` per date — highest ID = last inserted row that day. |
---

## Trade-offs and Choices

| Choice | Why |
|--------|-----|
| SQLite | No setup, works as a local file. With PostgreSQL we could use window functions (`PARTITION BY date`) instead of `MAX(id)`. |
| Save raw, convert on read | Original data is never changed. Downside: mixed units in one query can give wrong averages — caller should always pass a `unit`. |
| `MAX(id)` for latest per day | Simple. Works for normal inserts. Relies on insert order. |
| One table for all types | Easier to add new types later. Separate tables would need separate queries and more code. |

