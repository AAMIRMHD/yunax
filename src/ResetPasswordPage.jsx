import { useEffect } from 'react';

const ResetPasswordPage = () => {
  useEffect(() => {
    window.location.href = '/forgot-password';
  }, []);

  return null;
};

export default ResetPasswordPage;
