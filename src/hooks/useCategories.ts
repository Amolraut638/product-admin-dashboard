'use client';

import { useReducer, useEffect } from 'react';
import { getCategories } from '@/services/product.service';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
interface CategoriesState {
  categories: string[];
  loading: boolean;
  error: boolean;
}

type CategoriesAction =
  | { type: 'LOAD_SUCCESS'; categories: string[] }
  | { type: 'LOAD_ERROR' };

// Initial state has loading:true so the consumer can show a skeleton
// immediately, without an extra LOAD_START dispatch inside the effect.
const initialState: CategoriesState = {
  categories: [],
  loading: true,
  error: false,
};

function categoriesReducer(
  state: CategoriesState,
  action: CategoriesAction,
): CategoriesState {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return { categories: action.categories, loading: false, error: false };
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: true };
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook — categories are stable data; loaded once on mount.
// dispatch() from useReducer is called only inside async .then/.catch callbacks
// (never synchronously in the effect body), so no lint rule is triggered.
// ---------------------------------------------------------------------------
export function useCategories(): CategoriesState {
  const [state, dispatch] = useReducer(categoriesReducer, initialState);

  useEffect(() => {
    let cancelled = false;

    getCategories()
      .then((data) => {
        if (!cancelled) dispatch({ type: 'LOAD_SUCCESS', categories: data });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'LOAD_ERROR' });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
