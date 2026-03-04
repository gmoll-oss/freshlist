import { askClaude } from '../../lib/claude';
import { PROMPTS } from '../../constants/prompts';
import { callWithRetry } from './utils';
import { fetchPreferences } from '../supabase/preferences';
import type { PantryItem, MealPlanAIResponse, UserPreferences } from '../../types';

const COOKING_TIME_LIMITS: Record<string, string> = {
  rapido: 'MAX 15 minutos por receta',
  normal: 'MAX 30 minutos por receta',
  sin_prisa: 'Hasta 60 minutos por receta',
};

function buildUserContext(prefs: UserPreferences): string {
  const lines: string[] = ['CONTEXTO DEL USUARIO:'];

  lines.push(`- Comensales: ${prefs.people_count} personas`);
  lines.push(`- Raciones por receta: ${prefs.people_count}`);

  const meals = [
    prefs.meals_config.breakfast && 'desayuno',
    prefs.meals_config.lunch && 'comida',
    prefs.meals_config.dinner && 'cena',
  ].filter(Boolean).join(', ');
  lines.push(`- Comidas a planificar: ${meals}`);
  lines.push(`- Dieta: ${prefs.diet_type.join(', ')}`);
  lines.push(`- Tiempo de cocina: ${COOKING_TIME_LIMITS[prefs.cooking_time] ?? 'MAX 30 minutos'}`);

  if (prefs.health_goal) {
    lines.push(`- Objetivo de salud: ${prefs.health_goal} — adapta macros y tipo de recetas a este objetivo`);
  }

  if (prefs.intolerances.length > 0) {
    lines.push(`- Intolerancias/alergias: ${prefs.intolerances.join(', ')} — NO usar estos ingredientes`);
  }

  return lines.join('\n');
}

function buildMealRequest(prefs: UserPreferences | null, selectedDays: string[]): string {
  const mealTypes: string[] = [];
  if (prefs?.meals_config.breakfast) mealTypes.push('desayuno');
  if (prefs?.meals_config.lunch) mealTypes.push('comida');
  if (prefs?.meals_config.dinner) mealTypes.push('cena');
  if (mealTypes.length === 0) mealTypes.push('cena');

  const daysList = selectedDays.join(', ');
  const mealsStr = mealTypes.join(' y ');

  return `Genera un plan de ${mealsStr} para: ${daysList} (${selectedDays.length} dias).`;
}

export async function generateMealPlan(
  pantryItems: PantryItem[],
  selectedDays: string[],
): Promise<MealPlanAIResponse> {
  const itemsSummary = pantryItems
    .filter((i) => i.status === 'fresh' || i.status === 'expiring')
    .sort((a, b) => a.estimated_expiry.localeCompare(b.estimated_expiry))
    .map((i) => `${i.name} (${i.quantity} ${i.unit}, caduca: ${i.estimated_expiry})`)
    .join('\n');

  let prefs: UserPreferences | null = null;
  try {
    prefs = await fetchPreferences();
  } catch (e) {
    console.warn('Could not fetch preferences, using defaults:', e);
  }

  const userContext = prefs ? buildUserContext(prefs) : '';
  const mealRequest = buildMealRequest(prefs, selectedDays);

  const systemPrompt = userContext
    ? `${PROMPTS.MEAL_PLANNER}\n\n${userContext}`
    : PROMPTS.MEAL_PLANNER;

  return callWithRetry<MealPlanAIResponse>(() =>
    askClaude({
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Estos son los ingredientes de mi despensa (ordenados por caducidad, los primeros caducan antes):\n\n${itemsSummary}\n\n${mealRequest}`,
        },
      ],
      maxTokens: 4000,
    }),
  );
}
