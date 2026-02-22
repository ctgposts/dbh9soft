/**
 * Email Configuration Guide for Phase 4
 * Setting up nodemailer for production email sending
 */

// Step 1: Install dependencies
// npm install nodemailer dotenv

// Step 2: Create .env.local file in project root
/*
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SECURE=false

// For Gmail:
// 1. Enable 2-factor authentication
// 2. Generate App Password: https://myaccount.google.com/apppasswords
// 3. Copy the password and paste as EMAIL_PASSWORD

// For Outlook/Office365:
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587

// For custom SMTP:
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587 // or 465 for secure
*/

// Step 3: Create convex/emailConfig.ts
/*
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export const getEmailConfig = (): EmailConfig => {
  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for 587
    auth: {
      user: process.env.EMAIL_FROM || '',
      pass: process.env.EMAIL_PASSWORD || '',
    },
    from: process.env.EMAIL_FROM || 'noreply@company.com',
  };
};

export const createEmailTransporter = () => {
  const config = getEmailConfig();
  return nodemailer.createTransport(config);
};

export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    console.log('✅ Email connection verified');
    return true;
  } catch (error) {
    console.error('❌ Email connection failed:', error);
    return false;
  }
};
*/

// Step 4: Update convex/email.ts sendEmail mutation
/*
import { createEmailTransporter } from './emailConfig';

export const sendEmail = mutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    type: v.union(...),
    staffId: v.string(),
    staffName: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const transporter = createEmailTransporter();
      
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: args.to,
        subject: args.subject,
        html: args.html,
      });

      console.log(`✉️ Email sent: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        sent: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Email send failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  },
});
*/

// Step 5: Email Queue/Retry Logic (Optional but Recommended)
/*
export interface EmailQueue {
  _id: Id<'emailQueue'>;
  to: string;
  subject: string;
  html: string;
  type: EmailType;
  staffId: string;
  staffName: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  sentAt?: Date;
  nextRetry?: Date;
}

// Add to convex/schema.ts:
emailQueue: defineTable({
  to: v.string(),
  subject: v.string(),
  html: v.string(),
  type: v.string(),
  staffId: v.string(),
  staffName: v.string(),
  status: v.union(v.literal('pending'), v.literal('sent'), v.literal('failed')),
  attempts: v.number(),
  maxAttempts: v.number(),
  error: v.optional(v.string()),
  createdAt: v.float(),
  sentAt: v.optional(v.float()),
  nextRetry: v.optional(v.float()),
})
  .index('by_status', ['status'])
  .index('by_nextRetry', ['nextRetry']),

// Queue management:
export const queueEmail = mutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    type: v.string(),
    staffId: v.string(),
    staffName: v.string(),
  },
  handler: async (ctx, args) => {
    const queueId = await ctx.db.insert('emailQueue', {
      ...args,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: Date.now(),
    });
    return { queueId, queued: true };
  },
});

export const processEmailQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query('emailQueue')
      .withIndex('by_status', (q) => q.eq('status', 'pending'))
      .collect();

    for (const email of pending) {
      try {
        const transporter = createEmailTransporter();
        const info = await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email.to,
          subject: email.subject,
          html: email.html,
        });

        await ctx.db.patch(email._id, {
          status: 'sent',
          attempts: email.attempts + 1,
          sentAt: Date.now(),
        });
      } catch (error) {
        const nextRetry = Date.now() + (5 * 60 * 1000); // 5 mins
        
        if (email.attempts < email.maxAttempts) {
          await ctx.db.patch(email._id, {
            attempts: email.attempts + 1,
            nextRetry,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        } else {
          await ctx.db.patch(email._id, {
            status: 'failed',
            attempts: email.attempts + 1,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }
  },
});
*/

// Step 6: Testing
/*
// Test in Convex UI:
1. Go to Convex dashboard > Data tab
2. Create test email:
   - to: "your-test-email@gmail.com"
   - subject: "Test Email"
   - html: "<h1>Test</h1>"
   - type: "daily-report"
   - staffId: "test-001"
   - staffName: "Test User"

3. Check email inbox
4. Debug via Convex logs
*/

// Step 7: Scheduled Email Cron Jobs (Optional)
/*
// Add to convex/crons.ts (Convex handles scheduling)

import { cronJobs } from 'convex/server';

export const sendDailyReports = cronJobs.interval(
  'send-daily-reports',
  { minutes: 1440 }, // Every 24 hours
  async (ctx) => {
    // Fetch all branches
    const branches = await ctx.db.query('branches').collect();
    
    for (const branch of branches) {
      // Generate daily report
      const report = await ctx.runQuery(getDailyReport, {
        branchId: branch._id,
      });
      
      // Get all staff in branch
      const staff = await ctx.db
        .query('staff')
        .withIndex('by_branchId', (q) => q.eq('branchId', branch._id))
        .collect();
      
      // Send to all staff
      for (const member of staff) {
        await ctx.runMutation(queueEmail, {
          to: member.email,
          subject: `দৈনিক রিপোর্ট - ${new Date().toLocaleDateString('bn-BD')}`,
          html: generateDailyReportEmailContent(member.name, report),
          type: 'daily-report',
          staffId: member._id,
          staffName: member.name,
        });
      }
    }
  }
);
*/

export const emailSetupGuide = {
  steps: [
    "Install nodemailer: npm install nodemailer",
    "Create .env.local with email credentials",
    "Create emailConfig.ts with transporter setup",
    "Update email.ts with actual sending logic",
    "Test email connection before production",
    "(Optional) Setup email queue for reliability",
    "(Optional) Setup cron jobs for scheduled emails",
  ],
  
  providers: {
    gmail: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      needsAppPassword: true,
    },
    outlook: {
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      needsAppPassword: false,
    },
    sendgrid: {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      username: 'apikey',
    },
    custom: {
      host: 'your-smtp-server.com',
      port: 587,
      secure: false,
      needsAppPassword: false,
    },
  },

  testEmails: [
    {
      to: 'test-user@example.com',
      subject: 'Test Email from Convex',
      type: 'daily-report',
    },
  ],

  troubleshooting: {
    'Connection refused': 'Check host/port and firewall settings',
    'Invalid credentials': 'Verify EMAIL_FROM and EMAIL_PASSWORD in .env.local',
    'Authentication failed': 'For Gmail, use App Password not regular password',
    'STARTTLS required': 'Set EMAIL_SECURE=false and use port 587',
    'Timeout': 'Check internet connection and SMTP server status',
  },
};
