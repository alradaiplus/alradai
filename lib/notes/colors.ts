import type { NoteColor } from './types';

/**
 * Light tints for note cards. `bg`/`border` style the card surface and `swatch`
 * is the solid dot shown in the color picker. The palette leans warm to stay
 * on-brand with the orange UI, with a few cool options for variety.
 */
export const NOTE_COLORS: Record<
  NoteColor,
  { bg: string; border: string; swatch: string }
> = {
  default: { bg: '#FFFFFF', border: '#E4E6E9', swatch: '#FFFFFF' },
  red: { bg: '#FDECEC', border: '#F6C6C6', swatch: '#E5484D' },
  orange: { bg: '#FEEDE5', border: '#F8C6AE', swatch: '#EC4516' },
  amber: { bg: '#FEF6E0', border: '#F5DFA0', swatch: '#F5A623' },
  green: { bg: '#E9F7EF', border: '#B8E6CB', swatch: '#2BA160' },
  blue: { bg: '#E8F1FD', border: '#B7D4F5', swatch: '#2D7FF0' },
  purple: { bg: '#F1ECFB', border: '#D4C4F2', swatch: '#7C5CDB' },
};

export const NOTE_COLOR_KEYS = Object.keys(NOTE_COLORS) as NoteColor[];

export function noteColor(color: string) {
  return NOTE_COLORS[(color as NoteColor) in NOTE_COLORS ? (color as NoteColor) : 'default'];
}
