const express = require('express');
const metricRoutes = require('./src/routes/metrics');

const app = express();
app.use(express.json());
app.use('/metrics', metricRoutes);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
