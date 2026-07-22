# Operations Checklist

## Environment Separation
- Keep separate `.env` values for `dev`, `staging`, and `prod`.
- Use unique JWT secrets and payment keys per environment.
- Set `CLIENT_ORIGIN` per deployed frontend URL.

## Monitoring and Alerts
- Track API uptime and response-time alerts.
- Log authentication failures and payment verification failures.
- Alert on order creation errors and stock update transaction failures.

## Backups and Recovery
- Enable daily database backups.
- Keep at least 7 rolling snapshots.
- Test a restore drill monthly.

## Security Operations
- Run `npm audit` regularly for frontend and backend.
- Rotate SMTP/payment/JWT secrets periodically.
- Review CORS allowlist before production release.
