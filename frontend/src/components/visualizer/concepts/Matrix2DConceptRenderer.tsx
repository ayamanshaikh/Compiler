"use client";

import React, { useMemo } from "react";
import { NormalizedExecutionEvent } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Grid, ArrowRight } from "lucide-react";

interface Matrix2DConceptRendererProps {
  event: NormalizedExecutionEvent;
}

interface MatrixCell {
  row: number;
  col: number;
  value: string;
  isActive: boolean;
}

export function Matrix2DConceptRenderer({ event }: Matrix2DConceptRendererProps) {
  const { symbol, currentValue, previousValue, metadata, heapObjects } = event;

  // Extract active row and column
  const { activeRow, activeCol, matrixData, rowsCount, colsCount } = useMemo(() => {
    let r = typeof metadata?.rowIndex === "number" ? metadata.rowIndex : 0;
    let c = typeof metadata?.colIndex === "number" ? metadata.colIndex : 0;

    // Check if heap key has pattern [r][c] e.g. matrix[1][2]
    const heapKeys = Object.keys(heapObjects || {});
    for (const key of heapKeys) {
      const match = key.match(/\[(\d+)\]\[(\d+)\]/);
      if (match) {
        r = parseInt(match[1], 10);
        c = parseInt(match[2], 10);
        break;
      }
    }

    const totalRows = Math.max(3, r + 1);
    const totalCols = Math.max(3, c + 1);

    const cells: MatrixCell[][] = [];
    for (let i = 0; i < totalRows; i++) {
      const rowArr: MatrixCell[] = [];
      for (let j = 0; j < totalCols; j++) {
        const isTarget = i === r && j === c;
        let cellVal = "0";

        // Try lookup in heapObjects
        const expectedKey = `${symbol || "matrix"}[${i}][${j}]`;
        const heapEntry = heapObjects?.[expectedKey];
        if (heapEntry && typeof heapEntry.state?.value === "string") {
          cellVal = String(heapEntry.state.value);
        } else if (isTarget) {
          cellVal = currentValue || "0";
        }

        rowArr.push({
          row: i,
          col: j,
          value: cellVal,
          isActive: isTarget,
        });
      }
      cells.push(rowArr);
    }

    return {
      activeRow: r,
      activeCol: c,
      matrixData: cells,
      rowsCount: totalRows,
      colsCount: totalCols,
    };
  }, [metadata, heapObjects, symbol, currentValue]);

  return (
    <Card className="p-4 bg-zinc-900 border-zinc-800 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Grid className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">
            2D Matrix Memory Grid
          </span>
          <Badge variant="outline" size="sm" className="font-mono text-[10px] text-emerald-400 border-emerald-500/30">
            {rowsCount} × {colsCount} Matrix
          </Badge>
        </div>
        <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
          Target: [{activeRow}][{activeCol}]
        </Badge>
      </div>

      {/* Grid Coordinates Display */}
      <div className="flex flex-col items-center justify-center p-3 bg-zinc-950/80 rounded-lg border border-zinc-800/80 overflow-x-auto">
        {/* Column Index Headers */}
        <div className="flex items-center gap-1.5 mb-1.5 pl-8">
          {Array.from({ length: colsCount }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`w-10 text-center text-[10px] font-mono transition-colors ${
                cIdx === activeCol
                  ? "text-emerald-400 font-bold"
                  : "text-zinc-500"
              }`}
            >
              C{cIdx}
            </div>
          ))}
        </div>

        {/* Rows with Row Index Headers */}
        <div className="flex flex-col gap-1.5">
          {matrixData.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-1.5">
              <span
                className={`w-6 text-right text-[10px] font-mono select-none mr-0.5 ${
                  rIdx === activeRow
                    ? "text-emerald-400 font-bold"
                    : "text-zinc-500"
                }`}
              >
                R{rIdx}
              </span>
              {row.map((cell) => (
                <div
                  key={`${cell.row}-${cell.col}`}
                  className={`w-10 h-10 rounded border flex items-center justify-center font-mono text-xs transition-all ${
                    cell.isActive
                      ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400 scale-105"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400"
                  }`}
                  title={`[${cell.row}][${cell.col}] = ${cell.value}`}
                >
                  {cell.value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mutation Value Pipeline */}
      {currentValue !== undefined && (
        <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/70 text-xs font-mono">
          <span className="text-zinc-400">
            {symbol || "matrix"}[{activeRow}][{activeCol}] Mutation:
          </span>
          <div className="flex items-center gap-2">
            {previousValue && (
              <>
                <span className="text-zinc-500 line-through">{previousValue}</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </>
            )}
            <span className="text-emerald-400 font-bold">{currentValue}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
