"use client";

import { useCallback, useRef, MouseEvent, TouchEvent } from 'react';

const useLongPress = (
  onLongPress: (event: MouseEvent | TouchEvent) => void,
  onClick: (event: MouseEvent | TouchEvent) => void,
  { threshold = 400 } = {}
) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(
    (event: MouseEvent | TouchEvent) => {
      isLongPressRef.current = false;
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress(event);
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const clear = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (!isLongPressRef.current) {
        onClick(event);
      }
    },
    [onClick]
  );

  return {
    onMouseDown: (e: MouseEvent) => start(e),
    onTouchStart: (e: TouchEvent) => start(e),
    onMouseUp: (e: MouseEvent) => clear(e),
    onMouseLeave: (e: MouseEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    onTouchEnd: (e: TouchEvent) => clear(e),
  };
};

export default useLongPress;
