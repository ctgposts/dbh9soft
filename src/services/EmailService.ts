/**
 * ইমেল সেবা
 * Phase 4: ব্যাকএন্ড ইমেল পাঠানোর জন্য Convex এ সেটআপ করতে হবে
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * ক্লায়েন্ট-সাইড ইমেল প্রিভিউ জেনারেটর
 * (বাস্তব পাঠানো Convex backend থেকে হবে)
 */
export class EmailService {
  /**
   * দৈনিক রিপোর্ট ইমেল HTML তৈরি করুন
   */
  static generateDailyReportEmail(params: {
    staffName: string;
    branchName: string;
    totalScans: number;
    totalUploads: number;
    totalImages: number;
    approvalRate: number;
    topPerformers: Array<{ name: string; scans: number; uploads: number }>;
  }): string {
    const html = `
      <!DOCTYPE html>
      <html lang="bn" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .content { padding: 30px; }
          .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .metric-card { background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #667eea; }
          .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
          .performers { margin: 20px 0; }
          .performers-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; }
          .performer-item { background: #f9f9f9; padding: 10px; margin: 8px 0; border-left: 3px solid #667eea; }
          .performer-name { font-weight: 600; color: #333; }
          .performer-stats { font-size: 12px; color: #666; margin-top: 3px; }
          .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 দৈনিক রিপোর্ট</h1>
            <p>${new Date().toLocaleDateString('bn-BD')}</p>
          </div>

          <div class="content">
            <p>নমস্কার ${params.staffName},</p>
            <p>আপনার ${params.branchName} এ আজকের কার্যকলাপ রিপোর্ট নিম্নে রয়েছে:</p>

            <div class="metrics">
              <div class="metric-card">
                <div class="metric-value">${params.totalScans}</div>
                <div class="metric-label">মোট স্ক্যান</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${params.totalUploads}</div>
                <div class="metric-label">মোট আপলোড</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${params.totalImages}</div>
                <div class="metric-label">মোট ছবি</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${params.approvalRate.toFixed(1)}%</div>
                <div class="metric-label">অনুমোদন হার</div>
              </div>
            </div>

            <div class="performers">
              <div class="performers-title">🏆 আজকের শীর্ষ পারফর্মার</div>
              ${params.topPerformers
                .map(
                  (perf, idx) => `
                <div class="performer-item">
                  <div class="performer-name">${idx + 1}. ${perf.name}</div>
                  <div class="performer-stats">${perf.scans} স্ক্যান • ${perf.uploads} আপলোড</div>
                </div>
              `
                )
                .join('')}
            </div>

            <a href="#" class="button">📱 বিস্তারিত দেখুন</a>

            <p>ধন্যবাদ আপনার কঠোর পরিশ্রমের জন্য!</p>
          </div>

          <div class="footer">
            <p>এই ইমেলটি স্বয়ংক্রিয় রূপে তৈরি হয়েছে। অনুগ্রহ করে উত্তর দিবেন না।</p>
            <p>&copy; 2026 DBH স্টাফ পণ্য পোর্টাল</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  }

  /**
   * পরিসংখ্যান রিপোর্ট ইমেল তৈরি করুন
   */
  static generateStatsReportEmail(params: {
    staffName: string;
    branchName: string;
    period: string;
    stats: {
      totalScans: number;
      totalUploads: number;
      totalImages: number;
      averageCompressionRatio: number;
    };
  }): string {
    const html = `
      <!DOCTYPE html>
      <html lang="bn" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; background: white; }
          .header { background: #667eea; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background: #667eea; color: white; }
          .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📈 পরিসংখ্যান রিপোর্ট</h2>
          </div>
          <div class="content">
            <p>স্টাফ: <strong>${params.staffName}</strong></p>
            <p>শাখা: <strong>${params.branchName}</strong></p>
            <p>সময়কাল: <strong>${params.period}</strong></p>

            <table>
              <tr>
                <th>মেট্রিক</th>
                <th>মান</th>
              </tr>
              <tr>
                <td>মোট স্ক্যান</td>
                <td>${params.stats.totalScans}</td>
              </tr>
              <tr>
                <td>মোট আপলোড</td>
                <td>${params.stats.totalUploads}</td>
              </tr>
              <tr>
                <td>মোট ছবি</td>
                <td>${params.stats.totalImages}</td>
              </tr>
              <tr>
                <td>গড় কম্প্রেশন অনুপাত</td>
                <td>${params.stats.averageCompressionRatio.toFixed(1)}%</td>
              </tr>
            </table>
          </div>
          <div class="footer">
            <p>ডিজিটালভাবে উৎপন্ন রিপোর্ট</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  }

  /**
   * লিডারবোর্ড আপডেট ইমেল তৈরি করুন
   */
  static generateLeaderboardEmail(params: {
    staffName: string;
    currentRank: number;
    previousRank: number;
    category: string;
    topPerformers: Array<{ rank: number; name: string; score: number }>;
  }): string {
    const rankChange = params.previousRank - params.currentRank;
    const rankChangeText =
      rankChange > 0
        ? `⬆️ ${rankChange} র‍্যাঙ্ক উন্নতি!`
        : rankChange < 0
          ? `⬇️ ${Math.abs(rankChange)} র‍্যাঙ্ক পরিবর্তন`
          : '➡️ একই র‍্যাঙ্ক';

    const html = `
      <!DOCTYPE html>
      <html lang="bn" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; }
          .header { background: linear-gradient(135deg, #ffd89b 0%, #19547b 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .rank-card { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; }
          .leaderboard { margin: 20px 0; }
          .leaderboard-item { display: flex; padding: 10px; background: #f9f9f9; margin: 5px 0; border-left: 3px solid #ffc107; }
          .leaderboard-rank { font-size: 24px; font-weight: bold; color: #ffc107; min-width: 40px; }
          .leaderboard-info { flex: 1; margin-left: 15px; }
          .leaderboard-name { font-weight: 600; }
          .leaderboard-score { font-size: 12px; color: #666; }
          .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🏆 লিডারবোর্ড আপডেট</h2>
          </div>
          <div class="content">
            <p>নমস্কার ${params.staffName},</p>
            
            <div class="rank-card">
              <p><strong>আপনার বর্তমান র‍্যাঙ্ক: #${params.currentRank}</strong></p>
              <p>${rankChangeText}</p>
              <p>ক্যাটাগরি: ${params.category}</p>
            </div>

            <div class="leaderboard">
              <h3>শীর্ষ ৫ পারফর্মার</h3>
              ${params.topPerformers
                .map(
                  (perf) => `
                <div class="leaderboard-item">
                  <div class="leaderboard-rank">#${perf.rank}</div>
                  <div class="leaderboard-info">
                    <div class="leaderboard-name">${perf.name}</div>
                    <div class="leaderboard-score">স্কোর: ${perf.score}</div>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>

            <p>আরও ভাল পারফরম্যান্সের জন্য চেষ্টা করুন! 💪</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 DBH স্টাফ পণ্য পোর্টাল</p>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  }

  /**
   * ইমেল প্রিভিউ খুলুন (টেস্টিংয়ের জন্য)
   */
  static previewEmail(html: string): void {
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  }

  /**
   * ইমেল সিমুলেশন (Phase 4: backend এ nodemailer দিয়ে)
   */
  static async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      console.log('📧 ইমেল পাঠানোর চেষ্টা করছি:', options);

      // Phase 4: এই কল Convex backend এ যাবে
      // const response = await mutation(api.email.sendEmail, options);
      // return response;

      // স্টাব এখন:
      return {
        success: true,
        messageId: `msg-${Date.now()}`,
      };
    } catch (error) {
      console.error('ইমেল পাঠাতে ব্যর্থ:', error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}
