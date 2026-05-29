import nodemailer, { Transporter } from 'nodemailer';
import { env } from '~/config/env';
import { MailPayload } from './mail.types';

export interface MailService {
  send(payload: MailPayload): Promise<void>;
}

export class SmtpMailService implements MailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async send(payload: MailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: env.MAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}

export const mailService: MailService = new SmtpMailService();
