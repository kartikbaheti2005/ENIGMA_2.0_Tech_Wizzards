import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# ─── Configure these with your Gmail credentials ──────────────────────────────
# Option 1: Set as environment variables (recommended for production)
# Option 2: Replace the strings directly (for local development only)
GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_PASS = os.getenv("GMAIL_PASS", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# NOTE: Use Gmail App Password, NOT your regular password.
# Generate at: https://myaccount.google.com/apppasswords
# (Requires 2-Step Verification to be enabled on your Gmail)


def send_reset_email(to_email: str, full_name: str, reset_token: str) -> bool:
    """
    Sends a password reset email via Gmail SMTP.
    Returns True on success, False on failure.
    """
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    # ── HTML Email Body ────────────────────────────────────────────────────────
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 0; }}
        .container {{ max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
        .header {{ background: linear-gradient(135deg, #1d4ed8, #0891b2); padding: 36px 32px; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 22px; font-weight: 700; }}
        .header p {{ color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px; }}
        .body {{ padding: 36px 32px; }}
        .body p {{ color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }}
        .btn {{ display: block; width: fit-content; margin: 28px auto; background: #1d4ed8; color: white; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px; }}
        .link-box {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 16px 0; word-break: break-all; font-family: monospace; font-size: 12px; color: #64748b; }}
        .warning {{ background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 20px 0; font-size: 13px; color: #92400e; }}
        .footer {{ background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; }}
        .footer p {{ color: #94a3b8; font-size: 12px; margin: 0; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩺 DermAssist AI</h1>
          <p>AI-Based Skin Cancer Screening</p>
        </div>
        <div class="body">
          <p>Hi <strong>{full_name}</strong>,</p>
          <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for <strong>30 minutes</strong>.</p>
          <a class="btn" href="{reset_link}">Reset My Password</a>
          <p style="text-align:center;color:#94a3b8;font-size:13px;">Or copy and paste this link in your browser:</p>
          <div class="link-box">{reset_link}</div>
          <div class="warning">
            ⚠️ If you did not request a password reset, you can safely ignore this email. Your password will not change.
          </div>
          <p>For security, this link will expire in 30 minutes.</p>
        </div>
        <div class="footer">
          <p>DermAssist AI — For educational and screening purposes only.</p>
          <p style="margin-top:6px">Not a medical diagnosis tool.</p>
        </div>
      </div>
    </body>
    </html>
    """

    # Plain text fallback
    text_body = f"""
Hi {full_name},

We received a request to reset your DermAssist AI password.

Click this link to reset your password (valid for 30 minutes):
{reset_link}

If you did not request this, ignore this email — your password will not change.

— DermAssist AI Team
    """

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Your DermAssist AI Password"
        msg["From"]    = f"DermAssist AI <{GMAIL_USER}>"
        msg["To"]      = to_email

        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, GMAIL_PASS)
            server.sendmail(GMAIL_USER, to_email, msg.as_string())

        print(f"✅ Reset email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Failed to send email: {e}")
        return False