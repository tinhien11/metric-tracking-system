const db = require('../db/database');
const { convert } = require('../utils/converter');

function addMetric({ userId, date, value, unit, type }) {
    const result = db.prepare(
        'INSERT INTO metrics (user_id, type, value, unit, date) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, type, value, unit, date);

    return db.prepare('SELECT * FROM metrics WHERE id = ?').get(result.lastInsertRowid);
}

function getMetrics({ userId, type, unit, page, limit }) {
    const offset = (page - 1) * limit;

    const total = db.prepare(
        'SELECT COUNT(*) AS count FROM metrics WHERE user_id = ? AND type = ?'
    ).get(userId, type).count;

    const rows = db.prepare(
        'SELECT * FROM metrics WHERE user_id = ? AND type = ? ORDER BY date DESC, id DESC LIMIT ? OFFSET ?'
    ).all(userId, type, limit, offset);

    const data = unit
        ? rows.map(r => ({ ...r, value: convert(r.value, r.unit, unit, type), unit }))
        : rows;

    return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

function getChartData({ userId, type, period, unit }) {
    const months = parseInt(period) || 1;
    const from   = new Date();
    from.setMonth(from.getMonth() - months);
    const fromDate = from.toISOString().split('T')[0];

    // Latest entry (highest id) per day within the period
    const rows = db.prepare(`
        SELECT date, value, unit
        FROM metrics
        WHERE user_id = ? AND type = ? AND date >= ?
          AND id IN (
            SELECT MAX(id)
            FROM metrics
            WHERE user_id = ? AND type = ? AND date >= ?
            GROUP BY date
            )
        ORDER BY date ASC
    `).all(userId, type, fromDate, userId, type, fromDate);

    if (!unit) return rows;

    return rows.map(r => ({ date: r.date, value: convert(r.value, r.unit, unit, type), unit }));
}

module.exports = { addMetric, getMetrics, getChartData };
