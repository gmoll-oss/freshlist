import { useState, useCallback, useRef } from 'react';
import { chatWithAssistant, AssistantContext } from '../services/ai/assistant';
import { fetchPantryItems } from '../services/supabase/pantry';
import { fetchMealPlans, updateMealPlan, insertMealPlans, deleteWeekMealPlans } from '../services/supabase/mealPlans';
import { addShoppingItem } from '../services/supabase/shopping';
import { autoConsumePantryItems } from '../services/supabase/pantry';
import { fetchPreferences } from '../services/supabase/preferences';
import type { MealPlan, UserPreferences } from '../types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

function getCurrentWeekStart(): string {
  const today = new Date();
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return monday.toISOString().split('T')[0];
}

function extractAction(text: string): { cleanText: string; action: any | null } {
  const actionMatch = text.match(/<action>([\s\S]*?)<\/action>/);
  if (!actionMatch) return { cleanText: text, action: null };

  const cleanText = text.replace(/<action>[\s\S]*?<\/action>/, '').trim();
  try {
    const action = JSON.parse(actionMatch[1]);
    return { cleanText, action };
  } catch {
    return { cleanText, action: null };
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'idle' | 'thinking' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const contextRef = useRef<AssistantContext>({
    pantryItems: [],
    currentPlan: [],
    preferences: null,
  });

  const loadContext = useCallback(async () => {
    try {
      const weekStart = getCurrentWeekStart();
      const [pantryItems, currentPlan, preferences] = await Promise.all([
        fetchPantryItems().catch(() => []),
        fetchMealPlans(weekStart).catch(() => []),
        fetchPreferences().catch(() => null),
      ]);
      contextRef.current = { pantryItems, currentPlan, preferences };
    } catch (e) {
      console.warn('[Chat] Failed to load context:', e);
    }
  }, []);

  async function executeAction(action: any) {
    try {
      if (action.action === 'add_to_list' && Array.isArray(action.items)) {
        for (const item of action.items) {
          await addShoppingItem({
            name: item,
            category: 'Otro',
            quantity: 1,
            unit: 'unidad',
            source: 'ai_suggestion',
          });
        }
      } else if (action.action === 'mark_used' && Array.isArray(action.items)) {
        await autoConsumePantryItems(action.items);
      }
      // Reload context after action
      await loadContext();
    } catch (e) {
      console.warn('[Chat] Action execution failed:', e);
    }
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(36) + 'u',
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setStatus('thinking');
    setError(null);

    try {
      // Ensure context is fresh
      await loadContext();

      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await chatWithAssistant({
        message: text.trim(),
        conversationHistory,
        context: contextRef.current,
      });

      const { cleanText, action } = extractAction(response);

      const assistantMsg: ChatMessage = {
        id: Date.now().toString(36) + 'a',
        role: 'assistant',
        content: cleanText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (action) {
        await executeAction(action);
      }

      setStatus('idle');
    } catch (e: any) {
      console.error('[Chat] Error:', e);
      setError(e.message ?? 'Error al enviar mensaje');
      setStatus('error');
    }
  }, [messages, loadContext]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setStatus('idle');
    setError(null);
  }, []);

  return { messages, status, error, sendMessage, clearHistory, loadContext };
}
