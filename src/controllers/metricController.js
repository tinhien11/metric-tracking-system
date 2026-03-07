const { addMetric, getMetrics, getChartData } = require('../services/metricService');
const { DISTANCE_UNITS, TEMPERATURE_UNITS } = require('../utils/converter');
const VALID_TYPES = ['distance', 'temperature'];

function validUnit(unit, type) {
  if (type === 'distance')    return DISTANCE_UNITS.includes(unit);
  if (type === 'temperature') return TEMPERATURE_UNITS.includes(unit);
  return false;
}

function validateQueryParams(res, { userId, type, unit }) {
  if (!userId || !type)
    return res.status(400).json({ error: 'Required query: userId, type' });
  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ error: `type must be: ${VALID_TYPES.join(' | ')}` });
  if (unit && !validUnit(unit, type))
    return res.status(400).json({ error: `Invalid unit for ${type}` });
}

function create(req, res) {
  const { userId, date, value, unit, type } = req.body;

  if (!userId || !date || value == null || !unit || !type)
    return res.status(400).json({ error: 'Required: userId, date, value, unit, type' });

  if (isNaN(parseFloat(value)))
    return res.status(400).json({ error: 'value must be a number' });

  if (!VALID_TYPES.includes(type))
    return res.status(400).json({ error: `type must be: ${VALID_TYPES.join(' | ')}` });

  if (!validUnit(unit, type))
    return res.status(400).json({ error: `Invalid unit for ${type}. Valid: ${type === 'distance' ? DISTANCE_UNITS.join(', ') : TEMPERATURE_UNITS.join(', ')}` });

  try {
    const metric = addMetric({ userId, date, value: parseFloat(value), unit, type });
    res.status(201).json(metric);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function list(req, res) {
  const { userId, type, unit } = req.query;
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  if (validateQueryParams(res, { userId, type, unit })) return;

  try {
    res.json(getMetrics({ userId, type, unit, page, limit }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function chart(req, res) {
  const { userId, type, period, unit } = req.query;

  if (validateQueryParams(res, { userId, type, unit })) return;

  try {
    res.json(getChartData({ userId, type, period, unit }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { create, list, chart };
