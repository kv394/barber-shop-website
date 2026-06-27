import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { VertexAI } from '@google-cloud/vertexai';
import { getTenantClient } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const vertex_ai = new VertexAI({
  project: 'igneous-etching-492302-v7', 
  location: 'us-central1'
});

const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.2, // Low temperature for more analytical/factual responses
    responseMimeType: 'application/json',
  },
});

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
   const { shopId } = await params;
   const tenantClient = await getTenantClient(shopId);
   const authResult = await requireShopRole(shopId, ['SHOP_ADMIN', 'SITE_ADMIN']);
   if (isAuthError(authResult)) return authResult;

   const body = await request.json();
   const { byStaff, byService, totalRevenue, totalAppointments, dateRange } = body;

   const shop = await tenantClient.shop.findUnique({
     where: { id: shopId },
     select: { name: true },
   });

   if (!shop) {
     return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
   }

   const prompt = `You are an expert business analyst for a barber shop/salon named "${shop.name}".
Analyze the following performance data for the period: ${dateRange || 'All Time'}.

Total Revenue: $${totalRevenue}
Total Appointments: ${totalAppointments}

Revenue by Staff Member:
${JSON.stringify(byStaff, null, 2)}

Revenue by Service:
${JSON.stringify(byService, null, 2)}

Provide a concise, 3-bullet-point summary of the shop's performance. 
Highlight the top performing staff/services, and suggest one actionable area for improvement or growth based on the data. 
Use a professional, encouraging tone. Include emojis.

Return a JSON object with this exact structure:
{
 "insights": [
   "Bullet point 1",
   "Bullet point 2",
   "Bullet point 3"
 ]
}`;

   const requestParts = {
     contents: [{ role: 'user', parts: [{ text: prompt }] }]
   };

   const responseStream = await generativeModel.generateContentStream(requestParts);
   const aggregatedResponse = await responseStream.response;
   
   const resultText = aggregatedResponse.candidates?.[0]?.content?.parts?.[0]?.text;
   
   if (!resultText) {
     throw new Error('No response from AI');
   }

   let parsed;
   try {
     parsed = JSON.parse(resultText);
   } catch {
     throw new Error('Failed to parse AI response');
   }

   return NextResponse.json({
     success: true,
     insights: parsed.insights,
   });

 } catch (err: any) {
   logger.error('AI Insights Generation Error:', err);
   return NextResponse.json(
     { error: 'Failed to generate AI insights. Please try again.' },
     { status: 500 }
   );
 }
}
