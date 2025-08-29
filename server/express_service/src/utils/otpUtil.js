import { exec } from 'child_process';

const NEXMO_API_KEY = process.env.NEXMO_API_KEY || process.env.VONAGE_API_KEY || process.env.NEXMO_KEY || process.env.NEXMO_API;
const NEXMO_API_SECRET = process.env.NEXMO_API_SECRET || process.env.VONAGE_API_SECRET || process.env.NEXMO_SECRET || process.env.NEXMO_API_SECRET;
const NEXMO_SENDER = process.env.NEXMO_SENDER || process.env.VONAGE_SENDER || 'VerifyPro';

function ensurePlus(number) {
  if (!number) return number;
  return number.startsWith('+') ? number : `+${number}`;
}

function escapeShellArg(str = '') {
  // simple single-quote escape for POSIX shells
  return String(str).replace(/'/g, "'\\''");
}

export function sendOtpToUser(to, text) {
  return new Promise((resolve) => {
    if (!NEXMO_API_KEY || !NEXMO_API_SECRET) {
      return resolve({ success: false, error: 'NEXMO_API_KEY or NEXMO_API_SECRET not configured' });
    }

    const phone = ensurePlus(to);
    if (!phone) return resolve({ success: false, error: 'Missing destination phone number' });

    // Use --data-urlencode for text to preserve unicode / special chars
    const safeText = escapeShellArg(text || 'Your VerifyPro OTP');

    const cmdParts = [
      'curl',
      '-s',
      '-X', 'POST',
      '"https://rest.nexmo.com/sms/json"',
      '-H', '"Content-Type: application/x-www-form-urlencoded"',
      `-d "api_key=${NEXMO_API_KEY}"`,
      `-d "api_secret=${NEXMO_API_SECRET}"`,
      `-d "to=${phone}"`,
      `-d "from=${NEXMO_SENDER}"`,
      `--data-urlencode "text=${safeText}"`
    ];

    const cmd = cmdParts.join(' ');

    exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return resolve({ success: false, error: err.message || stderr });
      }

      try {
        const data = JSON.parse(stdout);
        // Vonage returns a messages array with status per message
        return resolve({ success: true, data });
      } catch (parseErr) {
        return resolve({ success: false, error: `Invalid JSON response: ${parseErr.message}`, raw: stdout });
      }
    });
  });
}
