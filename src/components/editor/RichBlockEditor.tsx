'use client';

import { useState, useRef, useEffect } from 'react';
import { RichBlock, BlockType } from '@/src/core/database/types';

const BLOCK_TYPES: Array<{ type: BlockType; label: string; icon: string }> = [
  { type: 'paragraph', label: 'Paragraph', icon: '¶' },
  { type: 'heading1', label: 'Heading 1', icon: 'H1' },
  { type: 'heading2', label: 'Heading 2', icon: 'H2' },
  { type: 'heading3', label: 'Heading 3', icon: 'H3' },
  { type: 'bulleted_list', label: 'Bulleted List', icon: '•' },
  { type: 'numbered_list', label: 'Numbered List', icon: '1.' },
  { type: 'toggle', label: 'Toggle', icon: '▶' },
  { type: 'callout', label: 'Callout', icon: '💡' },
  { type: 'code', label: 'Code', icon: '</>' },
  { type: 'quote', label: 'Quote', icon: '"' },
  { type: 'divider', label: 'Divider', icon: '—' },
];

interface RichBlockEditorProps {
  block: RichBlock;
  onChange: (block: RichBlock) => void;
  onDelete?: () => void;
}

export function RichBlockEditor({ block, onChange, onDelete }: RichBlockEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const filteredTypes = BLOCK_TYPES.filter(bt =>
    bt.label.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, filteredTypes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectBlockType(filteredTypes[selectedIndex].type);
      } else if (e.key === 'Escape') {
        setShowSlashMenu(false);
      }
      return;
    }

    if (e.key === '/' && textareaRef.current?.selectionStart === 0) {
      e.preventDefault();
      setShowSlashMenu(true);
      setFilterText('');
    } else if (e.key === 'Backspace' && block.content === '' && onDelete) {
      e.preventDefault();
      onDelete();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.currentTarget.value;
    
    if (content.startsWith('/')) {
      setShowSlashMenu(true);
      setFilterText(content.slice(1));
    } else {
      setShowSlashMenu(false);
    }

    onChange({
      ...block,
      content: content.replace(/^\//, ''),
      updatedAt: Date.now(),
    });
  };

  const selectBlockType = (type: BlockType) => {
    onChange({
      ...block,
      type,
      content: block.content.replace(/^\/\w*/, ''),
      updatedAt: Date.now(),
    });
    setShowSlashMenu(false);
    setFilterText('');
    textareaRef.current?.focus();
  };

  const renderContent = () => {
    const baseClasses = 'w-full p-2 border-0 outline-none resize-none bg-transparent text-foreground';
    
    switch (block.type) {
      case 'heading1':
        return (
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className={`${baseClasses} text-3xl font-bold`}
            placeholder="Heading 1"
          />
        );
      case 'heading2':
        return (
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className={`${baseClasses} text-2xl font-bold`}
            placeholder="Heading 2"
          />
        );
      case 'heading3':
        return (
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className={`${baseClasses} text-xl font-bold`}
            placeholder="Heading 3"
          />
        );
      case 'code':
        return (
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className={`${baseClasses} font-mono text-sm bg-muted p-3 rounded`}
            placeholder="Code..."
          />
        );
      case 'quote':
        return (
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className={`${baseClasses} border-l-4 border-muted-foreground pl-4 italic`}
            placeholder="Quote..."
          />
        );
      case 'callout':
        return (
          <div className="flex gap-2 p-2 bg-muted rounded">
            <span>💡</span>
            <textarea
              ref={textareaRef}
              value={block.content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              className={`${baseClasses} bg-transparent`}
              placeholder="Callout..."
            />
          </div>
        );
      default:
        return (
          <textarea
            ref={textareaRef}
            value={block.content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            className={baseClasses}
            placeholder="Type '/' for commands..."
          />
        );
    }
  };

  return (
    <div className="relative">
      {renderContent()}
      
      {showSlashMenu && (
        <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded shadow-lg z-50 max-h-64 overflow-y-auto w-48">
          {filteredTypes.map((bt, idx) => (
            <button
              key={bt.type}
              onClick={() => selectBlockType(bt.type)}
              className={`w-full text-left px-3 py-2 hover:bg-accent ${
                idx === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <span className="font-bold mr-2">{bt.icon}</span>
              {bt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
