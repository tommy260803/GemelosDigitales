import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement<any>;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayMs?: number;
}

/**
 * Accessible tooltip following WAI-ARIA Tooltip pattern.
 * Wraps any single child element and shows a tooltip on hover/focus.
 */
export function Tooltip({ content, children, side = 'right', delayMs = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [tooltipId] = useState(() => 'tip-' + Math.random().toString(36).slice(2, 9));

  const show = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(true), delayMs);
  };
  const hide = () => {
    clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const POSITION: Record<string, string> = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  return (
    <span className="relative inline-flex">
      {React.cloneElement(children, {
        'aria-describedby': visible ? tooltipId : undefined,
        onMouseEnter: (e: React.MouseEvent) => { show(); children.props.onMouseEnter?.(e); },
        onMouseLeave: (e: React.MouseEvent) => { hide(); children.props.onMouseLeave?.(e); },
        onFocus:      (e: React.FocusEvent) => { show(); children.props.onFocus?.(e); },
        onBlur:       (e: React.FocusEvent) => { hide(); children.props.onBlur?.(e); },
      })}
      {visible && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`
            pointer-events-none absolute z-[9999] whitespace-nowrap
            px-2.5 py-1.5 rounded-lg text-xs font-medium
            bg-slate-800 text-slate-100 border border-slate-700
            shadow-xl shadow-black/40
            ${POSITION[side]}
          `}
        >
          {content}
        </span>
      )}
    </span>
  );
}
