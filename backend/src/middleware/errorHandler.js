export const notFoundHandler = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  error.status = 404
  error.code = 'ROUTE_NOT_FOUND'
  next(error)
}

export const errorHandler = (error, _req, res, _next) => {
  const isZodError = error?.name === 'ZodError'
  const isMulterError = error?.name === 'MulterError'
  const status = Number.isInteger(error.status)
    ? error.status
    : isZodError
      ? 400
      : isMulterError
        ? 413
        : 500
  const code = error.code ?? (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR')
  const message =
    error.message ??
    (isZodError ? 'Validation failed. Check request fields and try again.' : 'An unexpected error occurred. Please try again.')

  res.status(status).json({
    message,
    code,
    status,
  })
}
