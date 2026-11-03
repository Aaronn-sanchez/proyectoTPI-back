const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      api: 'online',
      database: 'online'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
