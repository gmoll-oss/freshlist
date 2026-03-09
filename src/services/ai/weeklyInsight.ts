import { askClaude } from '../../lib/claude';
import { PROMPTS } from '../../constants/prompts';
import { callWithRetry } from './utils';
import type { WeeklySummary, WeeklyInsightResponse } from '../../types';

export async function generateWeeklyInsight(
  summary: WeeklySummary,
  previousSummary: WeeklySummary | null,
): Promise<WeeklyInsightResponse> {
  const comparisonText = previousSummary
    ? `\nSEMANA ANTERIOR: ${previousSummary.meals_cooked} comidas cocinadas, ${previousSummary.products_saved} productos aprovechados, ${previousSummary.euros_saved}€ ahorrados.`
    : '\nNo hay datos de la semana anterior (primera semana del usuario).';

  const userMessage = `DATOS DE ESTA SEMANA:
- Comidas planificadas: ${summary.meals_planned}
- Comidas cocinadas: ${summary.meals_cooked}
- Productos aprovechados: ${summary.products_saved}
- Productos tirados: ${summary.products_thrown}
- Euros ahorrados: ${summary.euros_saved}€
- Receta favorita: ${summary.favorite_meal ?? 'Ninguna'}
${comparisonText}`;

  return callWithRetry<WeeklyInsightResponse>(() =>
    askClaude({
      system: PROMPTS.WEEKLY_INSIGHT,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 1000,
    }),
  );
}
