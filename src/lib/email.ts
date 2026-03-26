import nodemailer from 'nodemailer';

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: import.meta.env.GMAIL_USER,
      pass: import.meta.env.GMAIL_APP_PASSWORD,
    },
  });
  return _transporter;
}

export async function sendVerificationEmail(to: string, code: string): Promise<void> {
  const from = `"Space Coast Devs" <${import.meta.env.GMAIL_USER}>`;
  await getTransporter().sendMail({
    from,
    to,
    subject: 'Your Space Coast Devs verification code',
    text: `Your verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin-top:0">Space Coast Devs</h2>
        <p>Here's your verification code:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;text-align:center;padding:24px;background:#f4f4f5;border-radius:8px;margin:24px 0">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:14px">This code expires in 15 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}
