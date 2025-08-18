'use client';

import { memo, useMemo, useRef, useState } from 'react';

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight: number;
  itemsPerRow: number;
  gap?: number;
  className?: string;
}

const VirtualGrid = memo(
  <T,>({
    items,
    renderItem,
    itemHeight,
    containerHeight,
    itemsPerRow,
    gap = 0,
    className = '',
  }: VirtualGridProps<T>) => {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const rowHeight = itemHeight + gap;
    const totalRows = Math.ceil(items.length / itemsPerRow);
    const totalHeight = totalRows * rowHeight;

    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const startRow = Math.floor(scrollTop / rowHeight);
    const endRow = Math.min(startRow + visibleRows + 1, totalRows);

    const visibleItems = useMemo(() => {
      const result = [];
      for (let row = startRow; row < endRow; row++) {
        for (let col = 0; col < itemsPerRow; col++) {
          const index = row * itemsPerRow + col;
          if (index < items.length) {
            result.push({
              item: items[index],
              index,
              row,
              col,
              top: row * rowHeight,
              left: col * (100 / itemsPerRow),
            });
          }
        }
      }
      return result;
    }, [items, startRow, endRow, itemsPerRow, rowHeight]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    };

    return (
      <div
        ref={containerRef}
        className={`overflow-auto ${className}`}
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(({ item, index, top, left }) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top,
                left: `${left}%`,
                width: `${100 / itemsPerRow}%`,
                height: itemHeight,
                padding: gap / 2,
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    );
  }
) as <T>(props: VirtualGridProps<T>) => JSX.Element;

(VirtualGrid as any).displayName = 'VirtualGrid';

export { VirtualGrid };
