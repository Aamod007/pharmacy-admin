import nodemailer from "nodemailer";
import prisma from "@pharmacy-admin/db";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth:
    env.SMTP_USER && env.SMTP_PASS
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        }
      : undefined,
});

const DEFAULT_TEMPLATES: Record<string, { subject: string; html: string }> = {
  "staff-welcome": {
    subject: "Welcome to Pharmico Admin Staff",
    html: "<p>Hello {{name}},</p><p>You have been added as {{role}}. Temporary password: <strong>{{temporaryPassword}}</strong></p>",
  },
  "password-reset": {
    subject: "Reset your Pharmico password",
    html: "<p>Hello {{name}},</p><p>Your password reset code is: <strong>{{resetToken}}</strong></p>",
  },
  "order-status": {
    subject: "Order {{orderNumber}} Status Updated",
    html: "<p>Your order {{orderNumber}} is now {{status}}.</p>",
  },
};

export async function sendEmailWithTemplate(params: {
  slug: string;
  to: string;
  variables: Record<string, string | number>;
}) {
  const { slug, to, variables } = params;

  let subject = DEFAULT_TEMPLATES[slug]?.subject || `Notification: ${slug}`;
  let html = DEFAULT_TEMPLATES[slug]?.html || `<p>Notification for ${slug}</p>`;
  let text = "";

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    subject = subject.replace(regex, String(value));
    html = html.replace(regex, String(value));
    text = text.replace(regex, String(value));
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    await prisma.adminNotificationLog.create({
      data: {
        channel: "EMAIL",
        recipient: to,
        eventType: slug,
        payload: { variables, messageId: info.messageId },
        status: "SUCCESS",
      },
    });

    return true;
  } catch (err: any) {
    console.error("Email send failed:", err.message);
    await prisma.adminNotificationLog.create({
      data: {
        channel: "EMAIL",
        recipient: to,
        eventType: slug,
        payload: { variables },
        status: "FAILED",
        errorMessage: err.message,
      },
    });
    return false;
  }
}
