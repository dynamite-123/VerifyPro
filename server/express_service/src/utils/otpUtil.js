// OTP utility stub - Nexmo/Vonage integration removed.
// The project no longer sends SMS via Nexmo/Vonage. Use internal flow to mark OTP pending.

export async function sendOtpToUser() {
  return { success: false, error: 'OTP sending disabled in this deployment' };
}
