import type { MealPlan } from '../../types';

let _currentMeal: MealPlan | null = null;

export function setCurrentMeal(meal: MealPlan): void {
  _currentMeal = meal;
}

export function getCurrentMeal(): MealPlan | null {
  return _currentMeal;
}

export function clearCurrentMeal(): void {
  _currentMeal = null;
}
