function create(req, res) {
  try {
    res.status(201).json({});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function list(req, res) {
  try {
    res.json({});
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

function chart(req, res) {
  try {
    res.json();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

module.exports = { create, list, chart };
