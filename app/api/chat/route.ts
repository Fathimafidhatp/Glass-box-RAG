import { queryRepository } from "@/lib/chroma";
import { buildRagPrompt } from "@/lib/prompt";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { question?: string };
    const question = body.question?.trim();

    if (!question) {
      return Response.json(
        { error: "Question text cannot be empty." },
        { status: 400 },
      );
    }

    const chunks = await queryRepository(question, 5);
    const prompt = buildRagPrompt(question, chunks);

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: question,
        },
      ],
      temperature: 0.2,
      stream: true,
    });

    const encoder = new TextEncoder();

    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;

            if (typeof content === "string" && content.length > 0) {
              controller.enqueue(encoder.encode(content));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown chat error";

    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
