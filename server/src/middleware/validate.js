import { fail } from '../lib/http.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const target = req[source] || {};
  const parsed = schema.safeParse(target);
  if (!parsed.success) {
    return fail(
      res,
      400,
      'Validation failed',
      'VALIDATION_ERROR',
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
    );
  }
  req[source] = parsed.data;
  return next();
};
