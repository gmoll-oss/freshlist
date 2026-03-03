const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY!;

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string | Array<{type: string; [key: string]: any}>;
}

export async function askClaude({
  system,
  messages,
  maxTokens = 2000,
}: {
  system: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
}): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.content
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');
}

// Para enviar imágenes (escaneo ticket/nevera)
export async function askClaudeWithImage({
  system,
  prompt,
  imageBase64,
  mediaType = 'image/jpeg',
}: {
  system: string;
  prompt: string;
  imageBase64: string;
  mediaType?: string;
}): Promise<string> {
  return askClaude({
    system,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
  });
}
