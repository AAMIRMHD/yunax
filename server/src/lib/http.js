export const ok = (res, data = {}, status = 200) => res.status(status).json(data);

export const fail = (res, status, message, code = 'BAD_REQUEST', details = undefined) =>
  res.status(status).json({
    error: message,
    errorObj: {
      code,
      message,
      details,
    },
  });
