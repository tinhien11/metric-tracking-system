const { Router } = require('express');
const { create, list, chart } = require('../controllers/metricController');

const router = Router();

router.post('/',       create);
router.get('/',        list);
router.get('/chart',   chart);

module.exports = router;
