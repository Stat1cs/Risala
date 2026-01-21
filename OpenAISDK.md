# OpenAI SDK Quickstart Guide

This document provides a quickstart guide for using the OpenAI SDK in the Aura project. **We use the Responses API**, which is the newer, stateful, multimodal, and more efficient way to generate model responses. For the official documentation, see [OpenAI Platform Quickstart](https://platform.openai.com/docs/quickstart).

## Key Differences: Responses API vs Chat Completions

If you're familiar with the Chat Completions API, here are the main differences:

- **Method**: Use `openai.responses.create()` instead of `openai.chat.completions.create()`
- **Input parameter**: Use `input` instead of `messages` (same array structure)
- **Output access**: Use `response.output_text` instead of `completion.choices[0].message.content`
- **Stateful**: Responses API maintains conversation state automatically
- **Better performance**: Improved latency and cache utilization

---

## Getting Started

### 1. Get Your API Key

1. Go to the [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to the [API keys section](https://platform.openai.com/api-keys)
4. Create a new secret key
5. **Important:** Copy and store your API key securely. You won't be able to see it again.

### 2. Install the OpenAI SDK

The OpenAI SDK is already installed in this project. If you need to install it in a new project:

```bash
npm install openai
```

### 3. Set Up Environment Variables

Create a `.env.local` file (or add to your existing `.env.local`) in the project root:

```bash
OPENAI_API_KEY=sk-your-api-key-here
```

**Never commit your API key to version control.** The `.env.local` file should be in `.gitignore`.

### 4. Initialize the Client

In your Next.js API routes or server-side code:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

---

## Basic Usage Examples

### Responses API (Recommended for Aura)

The **Responses API** is the newer, stateful, multimodal, and more efficient way to generate model responses. It provides better performance, cost efficiency, and is the recommended approach for new projects.

**Why Use the Responses API:**
- **Stateful by default**: Context is maintained automatically across turns
- **Multimodal capabilities**: Support for text, image inputs & outputs, function/tool calls
- **Better performance & cost**: Improved latency & cache utilization
- **Future-forward**: OpenAI is encouraging migration to Responses API

For generating text responses, use the Responses API:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getResponse() {
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input: [
      {
        role: "system",
        content: "You are a helpful assistant that provides calm, observational reflections.",
      },
      {
        role: "user",
        content: "Given these daily entries: [entries here], provide 3 reflection suggestions.",
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.output_text;
}
```

### Example: Daily Insights API Route

Here's how to use it in a Next.js API route for Aura:

```typescript
// app/api/ai/day-insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { date, entries, theme, mood } = await request.json();

    const prompt = `Given this daily context:
Date: ${date}
Theme: ${theme || "No theme set"}
Mood: ${mood || "Not set"} out of 10
Progress entries: ${JSON.stringify(entries)}

Provide up to 3 calm, observational reflection suggestions. No tasks or advice. Just gentle observations about patterns or moments. Return as a JSON array of strings.`;

    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: [
        {
          role: "system",
          content: "You are a reflective journaling assistant. Provide calm, observational insights without giving tasks or advice.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const content = response.output_text;
    const parsed = JSON.parse(content || "{}");
    const suggestions = parsed.suggestions || [];

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
```

### Example: Weekly Summary API Route

```typescript
// app/api/ai/weekly-summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, entries, logs } = await request.json();

    const prompt = `Summarize the past week (${startDate} to ${endDate}) as a narrative reflection.

Daily entries: ${JSON.stringify(entries)}
Progress logs: ${JSON.stringify(logs)}

Write a calm, observational narrative about themes, emotional rhythm, and recurring moments. Return as plain text.`;

    const response = await openai.responses.create({
      model: "gpt-5-nano",
      input: [
        {
          role: "system",
          content: "You are a reflective journaling assistant. Write calm, observational narratives about time and experience.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const summary = response.output_text;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
```

---

## Supported Models

### Recommended Models for Aura (Responses API)

- **`gpt-5-nano`**: Fast, cost-effective, good for most use cases (recommended for MVP)
- **`gpt-5`**: Higher quality, better reasoning, use for more complex insights
- **`gpt-4o-mini`**: Alternative option if gpt-5 models are not available
- **`gpt-4o`**: Higher quality alternative for more nuanced reflections

### Model Selection Tips

- Use `gpt-5-nano` for daily insights and summaries (faster, cheaper)
- Use `gpt-5` if you need more nuanced reflections or longer summaries
- Monitor usage and costs in the [OpenAI Dashboard](https://platform.openai.com/usage)
- Check the [OpenAI Models Overview](https://platform.openai.com/docs/models) for the latest available models

---

## Best Practices

### 1. Error Handling

Always wrap OpenAI API calls in try-catch blocks:

```typescript
try {
  const response = await openai.responses.create({...});
} catch (error) {
  if (error instanceof OpenAI.APIError) {
    console.error("OpenAI API Error:", error.status, error.message);
    // Handle API errors (rate limits, invalid key, etc.)
  } else {
    console.error("Unexpected error:", error);
  }
}
```

### 2. Rate Limits

OpenAI has rate limits based on your plan. Handle rate limit errors gracefully:

```typescript
if (error.status === 429) {
  // Rate limit exceeded - retry after delay or show user message
  return NextResponse.json(
    { error: "Rate limit exceeded. Please try again later." },
    { status: 429 }
  );
}
```

### 3. Cost Management

- Use `gpt-5-nano` for most operations (cheaper and more efficient)
- Set `max_tokens` to limit response length
- Cache results when possible (e.g., don't regenerate insights for the same day)
- Monitor usage in the [OpenAI Dashboard](https://platform.openai.com/usage)
- The Responses API provides better cost efficiency than Chat Completions

### 4. Prompt Engineering

For Aura's reflective tone:

- Use system messages in the `input` array to set the assistant's personality ("calm, observational")
- Request specific output formats (JSON arrays, plain text) using `response_format`
- Include context (date, mood, entries) in user messages
- Use `temperature: 0.7-0.8` for creative but consistent responses
- The Responses API maintains conversation state automatically, making multi-turn conversations easier

### 5. Security

- **Never expose your API key** in client-side code
- Only use OpenAI SDK in server-side code (API routes, server components)
- Validate and sanitize user inputs before sending to OpenAI
- Consider rate limiting at the API route level

### 6. Response Formatting

For structured responses, use `response_format`:

```typescript
// JSON object response
const response = await openai.responses.create({
  model: "gpt-5-nano",
  input: [...],
  response_format: { type: "json_object" },
});

// Access the output text directly
const parsed = JSON.parse(response.output_text || "{}");
```

---

## Streaming Responses (Optional)

For real-time streaming of responses (useful for longer summaries):

```typescript
const stream = await openai.responses.create({
  model: "gpt-5-nano",
  input: [...],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.delta?.output_text || "";
  // Send chunk to client
}
```

---

## Environment Setup Checklist

- [ ] API key created in OpenAI Dashboard
- [ ] `OPENAI_API_KEY` added to `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] OpenAI SDK installed (`npm install openai`)
- [ ] API routes handle errors gracefully
- [ ] Rate limiting considered
- [ ] Usage monitoring set up in OpenAI Dashboard

---

## Resources

- [OpenAI Platform Documentation](https://platform.openai.com/docs)
- [OpenAI Responses API Reference](https://platform.openai.com/docs/api-reference/responses)
- [Responses vs Chat Completions Guide](https://platform.openai.com/docs/guides/responses-vs-chat-completions)
- [Migrating to Responses API](https://platform.openai.com/docs/guides/migrate-to-responses)
- [OpenAI Models Overview](https://platform.openai.com/docs/models)
- [OpenAI Pricing](https://openai.com/api/pricing/)
- [OpenAI Dashboard](https://platform.openai.com/)

---

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check that `OPENAI_API_KEY` is set correctly in `.env.local` and the file is loaded
2. **"Rate limit exceeded"**: You've hit your usage limit. Wait or upgrade your plan
3. **"Model not found"**: Check that the model name is correct (e.g., `gpt-5-nano` not `gpt-5nano`). Verify available models in the [OpenAI Models Overview](https://platform.openai.com/docs/models)
4. **CORS errors**: Make sure API calls are only made from server-side code (API routes)
5. **"input is required"**: The Responses API uses `input` instead of `messages`. Make sure you're using the correct parameter name

### Getting Help

- Check the [OpenAI Documentation](https://platform.openai.com/docs)
- Review [OpenAI Community Forum](https://community.openai.com/)
- Check API status at [status.openai.com](https://status.openai.com/)
