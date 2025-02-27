"use client";

import * as React from "react";

const TOAST_LIMIT = 1;

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_VALUE;
  return count.toString();
}

type State = {
  toasts: ToasterToast[];
};

export function useToast() {
  const [state, setState] = React.useState<State>({ toasts: [] });

  const toast = React.useCallback(({ ...props }: Omit<ToasterToast, "id">) => {
    const id = genId();

    setState((state) => {
      const newToasts = [{ id, ...props }, ...state.toasts].slice(
        0,
        TOAST_LIMIT
      );

      return {
        ...state,
        toasts: newToasts,
      };
    });

    return {
      id,
      dismiss: () =>
        setState((state) => ({
          ...state,
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    };
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId?: string) =>
      setState((state) => ({
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      })),
  };
}
