'use client';

import { useState } from 'react';
import { Database, DatabaseRow, Property } from '@/src/core/database/types';

interface TableViewProps {
  database: Database;
  rows: DatabaseRow[];
  onRowUpdate: (rowId: string, values: Record<string, unknown>) => void;
  onRowDelete: (rowId: string) => void;
}

export function TableView({ database, rows, onRowUpdate, onRowDelete }: TableViewProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; propertyId: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCellClick = (rowId: string, property: Property) => {
    const row = rows.find(r => r.id === rowId);
    if (row) {
      setEditingCell({ rowId, propertyId: property.id });
      setEditValue(String(row.values[property.id] ?? ''));
    }
  };

  const handleCellChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleCellSave = (rowId: string, property: Property) => {
    const row = rows.find(r => r.id === rowId);
    if (row) {
      onRowUpdate(rowId, {
        ...row.values,
        [property.id]: editValue,
      });
    }
    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowId: string, property: Property) => {
    if (e.key === 'Enter') {
      handleCellSave(rowId, property);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <thead>
          <tr className="bg-muted">
            <th className="border border-border px-4 py-2 text-left font-semibold w-12">#</th>
            {database.properties.map(prop => (
              <th key={prop.id} className="border border-border px-4 py-2 text-left font-semibold min-w-48">
                {prop.name}
                <span className="text-xs text-muted-foreground ml-2">({prop.type})</span>
              </th>
            ))}
            <th className="border border-border px-4 py-2 text-left font-semibold w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.id} className="hover:bg-muted/50">
              <td className="border border-border px-4 py-2 text-muted-foreground">{rowIdx + 1}</td>
              {database.properties.map(prop => (
                <td
                  key={`${row.id}-${prop.id}`}
                  className="border border-border px-4 py-2 cursor-pointer hover:bg-accent/50"
                  onClick={() => handleCellClick(row.id, prop)}
                >
                  {editingCell?.rowId === row.id && editingCell?.propertyId === prop.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editValue}
                      onChange={handleCellChange}
                      onBlur={() => handleCellSave(row.id, prop)}
                      onKeyDown={(e) => handleCellKeyDown(e, row.id, prop)}
                      className="w-full px-2 py-1 border border-border rounded bg-background"
                    />
                  ) : (
                    <span>{String(row.values[prop.id] ?? '')}</span>
                  )}
                </td>
              ))}
              <td className="border border-border px-4 py-2">
                <button
                  onClick={() => onRowDelete(row.id)}
                  className="text-xs px-2 py-1 bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
