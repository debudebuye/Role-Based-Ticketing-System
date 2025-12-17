import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';

class EmailService {
  constructor() {
    this.transporter = null;
    this.emailMode = null;
    this.initialized = false;
  }

  async initializeTransporter() {
    if (this.initialized) {
      return; // Already initialized
    }

    try {
      // Check if real email credentials are provided
      const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASSWORD;
      console.log('🔍 Checking email credentials:', {
        EMAIL_USER: process.env.EMAIL_USER ? 'Set' : 'Not set',
        EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'Set' : 'Not set',
        hasCredentials: hasEmailCredentials
      });
      
      if (hasEmailCredentials) {
        console.log('📧 Using real email service with credentials');
        // Real email configuration
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        this.emailMode = 'real';
      } else {
        console.log('📧 No email credentials found, using Ethereal Email (test service)');
        // Development configuration (Ethereal Email for testing)
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        this.emailMode = 'test';
        console.log('📧 Test email credentials:', {
          user: testAccount.user,
          pass: testAccount.pass
        });
      }

      // Verify connection
      await this.transporter.verify();
      console.log(`📧 Email service initialized successfully (${this.emailMode} mode)`);
      this.initialized = true;
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      // Create a mock transporter for development if real email fails
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('📧 Mock email sent (fallback mode):', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: mailOptions.text?.substring(0, 100) + '...'
          });
          return { messageId: 'mock-' + Date.now() };
        }
      };
      this.emailMode = 'mock';
      this.initialized = true;
    }
  }

  async loadTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(process.cwd(), 'shared', 'templates', 'email', `${templateName}.html`);
      let template = await fs.readFile(templatePath, 'utf-8');
      
      // Replace variables in template
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, variables[key]);
      });
      
      return template;
    } catch (error) {
      console.error(`Failed to load email template ${templateName}:`, error.message);
      // Return a basic template if file loading fails
      return this.getBasicTemplate(variables);
    }
  }

  getBasicTemplate(variables) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${variables.subject || 'Notification'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Ticket Management System</h1>
            </div>
            <div class="content">
              ${variables.content || variables.message || 'Thank you for using our service.'}
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendEmail(options) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@ticketmanagement.com',
        to: options.to,
        subject: options.subject,
        html: options.html || options.template,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      if (this.emailMode === 'test') {
        const previewUrl = nodemailer.getTestMessageUrl(result);
        console.log('📧 Test email sent successfully!');
        console.log('🔗 Preview URL:', previewUrl);
        console.log('💡 This is a test email. To send real emails, add EMAIL_USER and EMAIL_PASSWORD to your .env file');
      } else if (this.emailMode === 'real') {
        console.log('📧 Real email sent successfully to:', mailOptions.to);
      } else {
        console.log('📧 Mock email logged (no actual email sent)');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to send email:', error.message);
      throw error;
    }
  }

  // Specific email methods
  async sendWelcomeEmail(user) {
    const template = await this.loadTemplate('welcome', {
      name: user.name,
      email: user.email,
      role: user.role,
      loginUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    });

    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to Ticket Management System',
      html: template
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const template = await this.loadTemplate('password-reset', {
      name: user.name,
      resetUrl: resetUrl,
      expiryTime: '1 hour'
    });

    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: template
    });
  }

  async sendTicketNotification(ticket, user, type) {
    const templates = {
      created: 'ticket-created',
      assigned: 'ticket-assigned',
      updated: 'ticket-updated',
      resolved: 'ticket-resolved',
      closed: 'ticket-closed'
    };

    const subjects = {
      created: `New Ticket Created: ${ticket.title}`,
      assigned: `Ticket Assigned to You: ${ticket.title}`,
      updated: `Ticket Updated: ${ticket.title}`,
      resolved: `Ticket Resolved: ${ticket.title}`,
      closed: `Ticket Closed: ${ticket.title}`
    };

    const template = await this.loadTemplate(templates[type] || 'ticket-notification', {
      name: user.name,
      ticketId: ticket._id,
      ticketTitle: ticket.title,
      ticketStatus: ticket.status,
      ticketPriority: ticket.priority,
      ticketUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/tickets/${ticket._id}`,
      type: type
    });

    return this.sendEmail({
      to: user.email,
      subject: subjects[type] || `Ticket Notification: ${ticket.title}`,
      html: template
    });
  }

  async sendCommentNotification(comment, ticket, user) {
    const template = await this.loadTemplate('comment-notification', {
      name: user.name,
      ticketId: ticket._id,
      ticketTitle: ticket.title,
      commentAuthor: comment.author.name,
      commentContent: comment.content.substring(0, 200) + (comment.content.length > 200 ? '...' : ''),
      ticketUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/tickets/${ticket._id}`
    });

    return this.sendEmail({
      to: user.email,
      subject: `New Comment on Ticket: ${ticket.title}`,
      html: template
    });
  }

  async sendBulkEmail(recipients, subject, template, variables = {}) {
    const promises = recipients.map(recipient => {
      const personalizedVariables = {
        ...variables,
        name: recipient.name,
        email: recipient.email
      };
      
      return this.sendEmail({
        to: recipient.email,
        subject: subject,
        html: template,
        variables: personalizedVariables
      });
    });

    try {
      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`📧 Bulk email completed: ${successful} sent, ${failed} failed`);
      return { successful, failed, results };
    } catch (error) {
      console.error('❌ Bulk email failed:', error.message);
      throw error;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService; 