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

export async function sendEmailWithTemplate(params: {
  slug: string;
  to: string;
  variables: Record<string, string | number>;
}) {
  const { slug, to, variables } = params;

  const template = await prisma.adminEmailTemplate.findUnique({
    where: { slug },
  });

  if (!template || !template.isActive) {
    console.warn(`Email template ${slug} not found or inactive`);
    return false;
  }

  let subject = template.subject;
  let html = template.htmlContent;
  let text = template.textContent || "";

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
