module.exports = {
  // ✅ Success Codes
  OK: 200,
  CREATED: 201,

  // ✅ Client Errors
  BAD_REQUEST: 400, // Invalid input / missing fields
  UNAUTHORIZED: 401, // No auth / invalid token
  FORBIDDEN: 403, // Access denied
  NOT_FOUND: 404, // Resource doesn't exist
  CONFLICT: 409, // Duplicate resource / already exists
  TOO_MANY_REQUESTS: 429, // Rate limit exceeded

  // ✅ Server Errors
  INTERNAL_SERVER_ERROR: 500, // Generic server error
  SERVICE_UNAVAILABLE: 503, // When service is temporarily down
};
