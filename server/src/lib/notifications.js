export const sendSms = async ({ to, message }) => {
  if (!process.env.SMS_PROVIDER) {
    console.log('[SMS_FALLBACK]', { to, message });
    return { queued: false };
  }
  return { queued: true };
};

export const sendWhatsApp = async ({ to, message }) => {
  if (!process.env.WHATSAPP_PROVIDER) {
    console.log('[WHATSAPP_FALLBACK]', { to, message });
    return { queued: false };
  }
  return { queued: true };
};
