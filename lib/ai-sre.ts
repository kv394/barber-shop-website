import { prisma } from './prisma';

export class AISreService {
  /**
   * Analyzes recent system logs using OpenAI and generates an AI_ALERT if severe anomalies are detected.
   */
  static async analyzeLogsAndAlert() {
    console.log('AI_SRE: Starting system health analysis...');
    
    // 1. Check if AI is enabled and we have an API key
    const settings = await prisma.platformSettings.findUnique({
      where: { id: 'global' },
      select: { openAiKey: true, enableAi: true }
    });

    if (!settings?.enableAi || !settings?.openAiKey) {
      console.log('AI_SRE: AI features disabled or OpenAI key missing. Aborting.');
      return null;
    }

    // 2. Fetch recent unresolved ERROR and WARNING logs (last 60 minutes)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const recentLogs = await prisma.systemLog.findMany({
      where: {
        isResolved: false,
        level: { in: ['ERROR', 'WARNING'] },
        createdAt: { gte: oneHourAgo }
      },
      select: {
        id: true,
        level: true,
        message: true,
        path: true,
        shopId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Cap at 50 to avoid massive token usage
    });

    if (recentLogs.length === 0) {
      console.log('AI_SRE: No recent errors to analyze. System is healthy.');
      return null;
    }

    console.log(`AI_SRE: Analyzing ${recentLogs.length} recent logs...`);

    // 3. Construct prompt for OpenAI
    const prompt = `
      You are an expert Site Reliability Engineer (SRE). 
      Review the following system logs from the last hour of a multi-tenant SaaS application.
      
      Your job is to determine if there is a severe, systemic issue happening (e.g. repeated payment gateway failures, database timeouts affecting multiple tenants, high frequency of the same exact crash).
      Ignore one-off minor errors.
      
      Logs:
      ${JSON.stringify(recentLogs, null, 2)}
      
      Respond in strictly valid JSON format matching this schema:
      {
        "anomalyDetected": boolean,
        "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        "summaryTitle": "A short 5-10 word title of the issue",
        "detailedAnalysis": "A 2-3 sentence explanation of what is going wrong and what the impact is",
        "recommendedAction": "1-2 sentences on what the admin should check first"
      }
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openAiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: 'You are an SRE alerting system. Output only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      let analysis;
      try {
        analysis = JSON.parse(data.choices[0].message.content);
      } catch {
        throw new Error('Failed to parse AI response');
      }

      // 4. If a severe anomaly is detected, trigger an alert
      if (analysis.anomalyDetected && ['CRITICAL', 'HIGH'].includes(analysis.severity)) {
        console.log(`AI_SRE: Anomaly detected! ${analysis.summaryTitle}`);
        
        // Create an elevated SystemLog entry
        await prisma.systemLog.create({
          data: {
            level: 'AI_ALERT',
            message: analysis.summaryTitle,
            metadata: {
              severity: analysis.severity,
              analysis: analysis.detailedAnalysis,
              recommendation: analysis.recommendedAction,
              sourceLogCount: recentLogs.length
            }
          }
        });
        
        return analysis;
      }

      console.log('AI_SRE: Logs analyzed. No severe anomalies detected.');
      return { status: 'healthy', logCount: recentLogs.length };

    } catch (error) {
      console.error('AI_SRE: Failed to perform analysis:', error);
      return null;
    }
  }
}
