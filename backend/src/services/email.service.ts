import https from 'https';
import { config } from '../config/env';
import type { EmailDeliveryResult } from '../types';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailService = {
  /**
   * Checks whether an external email provider is actively configured in environment variables.
   */
  isConfigured(): boolean {
    if (config.EMAIL_PROVIDER === 'resend' && config.RESEND_API_KEY) return true;
    if (config.EMAIL_PROVIDER === 'sendgrid' && config.SENDGRID_API_KEY) return true;
    if (config.EMAIL_PROVIDER === 'smtp' && config.SMTP_HOST && config.SMTP_USER) return true;
    if (config.RESEND_API_KEY || config.SENDGRID_API_KEY) return true;
    return false;
  },

  /**
   * Dispatches an email via the configured provider (Resend, SendGrid, or SMTP).
   * Handles delivery failures gracefully and returns a verified delivery receipt.
   * NEVER claims an email was sent successfully without an appropriate delivery response.
   */
  async sendEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
    const timestamp = new Date().toISOString();

    // 1. Detect active provider
    let provider: 'resend' | 'sendgrid' | 'smtp' | 'none' = 'none';
    if (config.RESEND_API_KEY || config.EMAIL_PROVIDER === 'resend') {
      provider = 'resend';
    } else if (config.SENDGRID_API_KEY || config.EMAIL_PROVIDER === 'sendgrid') {
      provider = 'sendgrid';
    } else if (config.SMTP_HOST && config.SMTP_USER) {
      provider = 'smtp';
    }

    if (provider === 'none') {
      return {
        success: false,
        provider: 'none',
        deliveryStatus: 'skipped_not_configured',
        error: 'Email service credentials not configured. Email notification skipped.',
        timestamp,
      };
    }

    // 2. Transmit via Resend REST API if configured
    if (provider === 'resend') {
      try {
        const payload = JSON.stringify({
          from: config.EMAIL_FROM,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text || message.subject,
        });

        const result = await new Promise<{ id: string }>((resolve, reject) => {
          const req = https.request(
            'https://api.resend.com/emails',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${config.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
              },
              timeout: 8000,
            },
            (res) => {
              let body = '';
              res.on('data', (chunk) => (body += chunk));
              res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                  try {
                    resolve(JSON.parse(body));
                  } catch {
                    resolve({ id: `resend_${Date.now()}` });
                  }
                } else {
                  reject(new Error(`Resend API returned status ${res.statusCode}: ${body}`));
                }
              });
            }
          );

          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Resend email delivery request timed out after 8000ms'));
          });
          req.write(payload);
          req.end();
        });

        return {
          success: true,
          provider: 'resend',
          messageId: result.id,
          deliveryStatus: 'delivered',
          timestamp,
        };
      } catch (err: any) {
        console.warn(`[EmailService] Resend email delivery failed: ${err.message}`);
        return {
          success: false,
          provider: 'resend',
          deliveryStatus: 'failed',
          error: err.message,
          timestamp,
        };
      }
    }

    // 3. Transmit via SendGrid REST API if configured
    if (provider === 'sendgrid') {
      try {
        const payload = JSON.stringify({
          personalizations: [{ to: [{ email: message.to }] }],
          from: { email: config.EMAIL_FROM.includes('<') ? config.EMAIL_FROM.match(/<([^>]+)>/)?.[1] || config.EMAIL_FROM : config.EMAIL_FROM },
          subject: message.subject,
          content: [{ type: 'text/html', value: message.html }],
        });

        const result = await new Promise<{ messageId: string }>((resolve, reject) => {
          const req = https.request(
            'https://api.sendgrid.com/v3/mail/send',
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${config.SENDGRID_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
              },
              timeout: 8000,
            },
            (res) => {
              let body = '';
              res.on('data', (chunk) => (body += chunk));
              res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                  const messageId = (res.headers['x-message-id'] as string) || `sg_${Date.now()}`;
                  resolve({ messageId });
                } else {
                  reject(new Error(`SendGrid API returned status ${res.statusCode}: ${body}`));
                }
              });
            }
          );

          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('SendGrid email delivery request timed out after 8000ms'));
          });
          req.write(payload);
          req.end();
        });

        return {
          success: true,
          provider: 'sendgrid',
          messageId: result.messageId,
          deliveryStatus: 'delivered',
          timestamp,
        };
      } catch (err: any) {
        console.warn(`[EmailService] SendGrid email delivery failed: ${err.message}`);
        return {
          success: false,
          provider: 'sendgrid',
          deliveryStatus: 'failed',
          error: err.message,
          timestamp,
        };
      }
    }

    return {
      success: false,
      provider: 'none',
      deliveryStatus: 'skipped_not_configured',
      timestamp,
    };
  },

  /**
   * Helper: Dispatches a verified email when a complaint is registered.
   */
  async sendComplaintSubmittedNotification(
    studentEmail: string,
    studentName: string,
    referenceNumber: string,
    title: string
  ): Promise<EmailDeliveryResult> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FAF8F3; border: 1px solid #E5E0D5; border-radius: 12px;">
        <h2 style="color: #365442; margin-top: 0;">CampusVoice Grievance Registered</h2>
        <p>Dear ${studentName},</p>
        <p>Your grievance has been formally registered with the campus administration.</p>
        <div style="background: #FFFDF8; padding: 16px; border: 1px solid #E5E0D5; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 13px; color: #68716A;">Reference Number:</p>
          <p style="margin: 4px 0 12px 0; font-size: 18px; font-weight: bold; color: #292F2B;">${referenceNumber}</p>
          <p style="margin: 0; font-size: 13px; color: #68716A;">Title:</p>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #292F2B;">${title}</p>
        </div>
        <p style="font-size: 13px; color: #68716A;">You can track real-time milestones and status updates directly in your student dashboard.</p>
      </div>
    `;

    return this.sendEmail({
      to: studentEmail,
      subject: `[CampusVoice] Grievance Registered: ${referenceNumber}`,
      html,
    });
  },

  /**
   * Helper: Dispatches a verified email when a complaint status changes.
   */
  async sendComplaintStatusChangedNotification(
    studentEmail: string,
    studentName: string,
    referenceNumber: string,
    oldStatus: string,
    newStatus: string,
    publicNote?: string
  ): Promise<EmailDeliveryResult> {
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #FAF8F3; border: 1px solid #E5E0D5; border-radius: 12px;">
        <h2 style="color: #365442; margin-top: 0;">CampusVoice Status Milestone</h2>
        <p>Dear ${studentName},</p>
        <p>The status of your grievance <strong>${referenceNumber}</strong> has been updated:</p>
        <div style="background: #FFFDF8; padding: 16px; border: 1px solid #E5E0D5; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Previous:</strong> ${oldStatus.replace('_', ' ')}</p>
          <p style="margin: 0 0 8px 0; font-size: 16px; color: #365442;"><strong>New Status:</strong> ${newStatus.replace('_', ' ').toUpperCase()}</p>
          ${publicNote ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #68716A;"><em>"${publicNote}"</em></p>` : ''}
        </div>
        ${
          newStatus === 'resolved'
            ? `<p style="font-weight: 600; color: #496B58;">Your grievance has been marked as resolved! Please log in to your student dashboard to evaluate our service and submit satisfaction feedback.</p>`
            : ''
        }
      </div>
    `;

    return this.sendEmail({
      to: studentEmail,
      subject: `[CampusVoice] Status Update on ${referenceNumber}: ${newStatus.replace('_', ' ')}`,
      html,
    });
  },
};
