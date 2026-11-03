function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  console.error(error);
  res.status(error.status || 500).json({
    error: error.status ? error.message : 'Error interno del servidor'
  });
}

module.exports = errorHandler;
