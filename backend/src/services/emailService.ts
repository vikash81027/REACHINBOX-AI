import nodemailer from 'nodemailer';
import { createTestAccount, getTestMessageUrl } from 'nodemailer';

export interface SendEmailOptions {
    to: string;
    subject: string;
    body: string;
    from: string;
    etherealUser: string;
    etherealPass: string;
}

export interface SendEmailResult {
    success: boolean;
    messageId?: string;
    previewUrl?: string;
    error?: string;
}

/**
 * Create an Ethereal test account for development
 */
export async function createEtherealAccount(): Promise<{
    user: string;
    pass: string;
    email: string;
}> {
    const testAccount = await createTestAccount();
    return {
        user: testAccount.user,
        pass: testAccount.pass,
        email: testAccount.user,
    };
}

/**
 * Send an email using Ethereal SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
        // Create transporter with Ethereal credentials
        const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: options.etherealUser,
                pass: options.etherealPass,
            },
        });

        // Send email
        const info = await transporter.sendMail({
            from: options.from,
            to: options.to,
            subject: options.subject,
            text: options.body,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <p>${options.body.replace(/\n/g, '<br>')}</p>
      </div>`,
        });

        // Get preview URL (Ethereal-specific)
        const previewUrl = getTestMessageUrl(info);

        console.log(`📨 Email sent: ${info.messageId}`);
        if (previewUrl) {
            console.log(`   Preview URL: ${previewUrl}`);
        }

        return {
            success: true,
            messageId: info.messageId,
            previewUrl: previewUrl || undefined,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Failed to send email:', errorMessage);
        return {
            success: false,
            error: errorMessage,
        };
    }
}

export default { sendEmail, createEtherealAccount };
