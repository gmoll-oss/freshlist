import { askClaude } from '../../lib/claude';
import { PROMPTS } from './prompts';
import type { PantryItem, MealPlan, UserPreferences } from '../../types';

export interface AssistantContext {
  pantryItems: PantryItem[];
  currentPlan: MealPlan[];
  preferences: UserPreferences | null;
}

function buildContextBlock(ctx: AssistantContext): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pantryLines = ctx.pantryItems
    .filter((i) => i.status === 'fresh' || i.status === 'expiring')
    .map((i) => {
      const exp = new Date(i.estimated_expiry);
      exp.setHours(0, 0, 0, 0);
      const days = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const urgency = days <= 0 ? ' [CADUCA HOY]' : days === 1 ? ' [CADUCA MANANA]' : '';
      return `- ${i.name} (${i.quantity} ${i.unit}, ${days} dias restantes)${urgency}`;
    })
    .join('\n');

  const planLines = ctx.currentPlan
    .map((m) => `- ${m.day} (${m.meal_type}): ${m.meal_name}${m.cooked ? ' [COCINADO]' : ''}`)
    .join('\n');

  const prefsBlock = ctx.preferences
    ? `Comensales: ${ctx.preferences.people_count}, Dieta: ${ctx.preferences.diet_type.join(', ')}, Tiempo cocina: ${ctx.preferences.cooking_time}`
    : 'Sin preferencias configuradas';

  return `
DESPENSA ACTUAL:
${pantryLines || 'Vacia'}

PLAN SEMANAL ACTUAL:
${planLines || 'Sin plan'}

PREFERENCIAS: ${prefsBlock}
`.trim();
}

export async function chatWithAssistant({
  message,
  conversationHistory,
  context,
}: {
  message: string;
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  context: AssistantContext;
}): Promise<string> {
  const contextBlock = buildContextBlock(context);
  const systemPrompt = `${PROMPTS.ASSISTANT}\n\n${contextBlock}`;

  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  return askClaude({
    system: systemPrompt,
    messages,
    maxTokens: 1500,
  });
}
