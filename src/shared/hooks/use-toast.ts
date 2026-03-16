'use client';

import { useReducer } from 'react';

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 4000;

type ToastVariant = 'default' | 'destructive';

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  open?: boolean;
}

type Action =
  | { type: 'ADD_TOAST'; toast: ToastData }
  | { type: 'REMOVE_TOAST'; toastId: string }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToastData> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId: string };

interface State {
  toasts: ToastData[];
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string, dispatch: React.Dispatch<Action>) {
  if (toastTimeouts.has(toastId)) return;
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: 'REMOVE_TOAST', toastId });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };
    case 'DISMISS_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toastId ? { ...t, open: false } : t,
        ),
      };
    case 'REMOVE_TOAST':
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
}

export function useToast() {
  const [state, dispatch] = useReducer(reducer, { toasts: [] });

  function toast(data: Omit<ToastData, 'id'>) {
    const id = genId();
    dispatch({ type: 'ADD_TOAST', toast: { ...data, id, open: true } });
    addToRemoveQueue(id, dispatch);
    return id;
  }

  function dismiss(toastId: string) {
    dispatch({ type: 'DISMISS_TOAST', toastId });
    addToRemoveQueue(toastId, dispatch);
  }

  return { toasts: state.toasts, toast, dismiss };
}
