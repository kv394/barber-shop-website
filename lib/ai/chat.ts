import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleFunctionCall } from '@/lib/ai/dispatcher';
import { isAllowed } from '@/lib/ai/dispatcher';

// Initialise Gemini client – expects `GEMINI_API_KEY` in environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: `You are an AI assistant for the Barber SaaS platform.
You have full knowledge of the shop's data model (services, staff, bookings, loyalty, reports).
You must only perform actions that the user's role permits.
When a user asks to create, edit, or retrieve data, respond with a JSON object containing:
{ "function": "functionName", "arguments": { ... } }
If the request is purely informational, answer directly in plain text.`,
});

/**
 * Process a user message.
 * Returns `{ reply: string }`. If a function call is required, the function will be executed
 * and the result will be incorporated into a friendly response.
 */
export async function processMessage({
  message,
  shopId,
  userRole,
}: {
  message: string;
  shopId: string;
  userRole: string;
}) {
  // First generation – let Gemini decide if a function call is needed
  const firstResult = await model.generateContent(message);
  const firstResponse = firstResult.response.text();

  // Try to parse JSON for a function call
  let functionCall: { function: string; arguments: any } | null = null;
  try {
    const parsed = JSON.parse(firstResponse.trim());
    if (parsed.function && parsed.arguments) {
      functionCall = parsed as any;
    }
  } catch {
    // Not JSON – treat as plain answer
  }

  if (functionCall) {
    const { function: fnName, arguments: args } = functionCall;
    // Permission check
    if (!isAllowed(userRole, fnName)) {
      return { reply: `⚠️ You do not have permission to perform **${fnName}**.` };
    }
    // Execute the function with tenant‑isolated Prisma client
    const result = await handleFunctionCall(fnName, args, shopId);
    // Second generation – provide the result to Gemini to craft a friendly reply
    const secondPrompt = `The user asked to perform ${fnName} with arguments ${JSON.stringify(
      args,
    )}. The operation succeeded and returned: ${JSON.stringify(result)}. Respond to the user in a friendly way.`;
    const secondResult = await model.generateContent(secondPrompt);
    const finalReply = secondResult.response.text();
    return { reply: finalReply };
  }

  // No function call – just return the plain model answer
  return { reply: firstResponse };
}
