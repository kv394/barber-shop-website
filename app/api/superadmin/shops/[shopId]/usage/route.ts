import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    let userId = authUserSession?.id;
    const authUserEmail = authUserSession?.email;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      return new Response("Forbidden", { status: 403 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // 1. Gather all resource usage metrics
    const [
      userCount,
      appointmentCount,
      productCount,
      serviceCount,
      formSubmissionCount,
      portfolioImageCount,
      clientHistoryImageCount,
      clientFormulaCount,
      reviewCount
    ] = await Promise.all([
      prisma.user.count({ where: { shopId } }),
      prisma.appointment.count({ where: { shopId } }),
      prisma.product.count({ where: { shopId } }),
      prisma.service.count({ where: { shopId } }),
      prisma.formSubmission.count({ where: { appointment: { shopId } } }),
      prisma.portfolioImage.count({ where: { shopId } }),
      prisma.clientHistoryImage.count({ where: { shopId } }),
      prisma.clientFormula.count({ where: { shopId } }),
      prisma.review.count({ where: { shopId } })
    ]);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });
    }

    // 2. Ask Gemini for Cost/Strategy Analysis
    const prompt = `You are a SaaS infrastructure and pricing expert. I run a Barber & Beauty SaaS platform.
Here is the current lifetime resource usage data for the shop "${shop.name}":
- Users (Staff & Clients): ${userCount}
- Appointments Booked: ${appointmentCount}
- Products Tracked: ${productCount}
- Services Offered: ${serviceCount}
- Digital Intake Forms Signed: ${formSubmissionCount}
- Staff Portfolio Images: ${portfolioImageCount}
- Client Before/After Photos: ${clientHistoryImageCount}
- Client Color Formulas: ${clientFormulaCount}
- Reviews: ${reviewCount}

Based on these exact metrics, calculate an estimated storage cost and suggest a monthly SaaS billing strategy for this specific shop.
Return your response as a valid JSON object matching exactly this schema:
{
  "estimatedStorageMB": <number estimating storage used based on images and db records>,
  "suggestedMonthlyFeeUSD": <number suggesting a fair SaaS fee>,
  "pricingTierName": "<creative string name for their tier (e.g. Starter, Growth, Enterprise Spa)>",
  "strategyReasoning": "<string up to 3 sentences detailing why this pricing and tier makes sense based on their specific usage profile>"
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: "You are a senior data analyst. You only return valid JSON. Do not include markdown wrappers like ```json."
          }]
        },
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to analyze usage');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const analysis = JSON.parse(text);

    return NextResponse.json({
      metrics: {
        userCount,
        appointmentCount,
        productCount,
        serviceCount,
        formSubmissionCount,
        portfolioImageCount,
        clientHistoryImageCount,
        clientFormulaCount,
        reviewCount
      },
      analysis
    });

  } catch (error: any) {
    logger.error('Usage analysis error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
