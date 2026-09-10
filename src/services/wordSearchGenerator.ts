import { WordSearchGrid, WordSearchPlacement } from '../types';
import { sanitizeAnswer } from './crosswordGenerator';

export const sanitizeWord = sanitizeAnswer;

export interface RawWordSearchItem {
  word: string;
  clue?: string;
}

const DIRECTIONS = [
  { name: 'horizontal', dr: 0, dc: 1 },
  { name: 'horizontal_back', dr: 0, dc: -1 },
  { name: 'vertical', dr: 1, dc: 0 },
  { name: 'vertical_back', dr: -1, dc: 0 },
  { name: 'diagonal_down', dr: 1, dc: 1 },
  { name: 'diagonal_up', dr: -1, dc: 1 }
];

export function generateWordSearch(
  items: RawWordSearchItem[],
  gridSize?: number,
  allowedDirections = ['horizontal', 'vertical', 'diagonal_down']
): WordSearchGrid {
  const sanitized = items
    .map(i => ({
      word: sanitizeAnswer(i.word),
      clue: i.clue || i.word
    }))
    .filter(i => i.word.length >= 2);

  if (sanitized.length === 0) {
    return { rows: 10, cols: 10, grid: [], words: [], placements: [] };
  }

  // Determine grid dimension: maximum of longest word length + 3 or calculated dimension
  const maxWordLen = Math.max(...sanitized.map(w => w.word.length));
  const size = gridSize || Math.max(12, maxWordLen + 2, Math.ceil(Math.sqrt(sanitized.length * 15)));

  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  const placements: WordSearchPlacement[] = [];

  const dirs = DIRECTIONS.filter(d => allowedDirections.includes(d.name));
  const activeDirections = dirs.length > 0 ? dirs : [DIRECTIONS[0], DIRECTIONS[2]];

  // Sort longest words first
  const sortedWords = [...sanitized].sort((a, b) => b.word.length - a.word.length);

  for (const item of sortedWords) {
    const word = item.word;
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 200) {
      attempts++;
      const dir = activeDirections[Math.floor(Math.random() * activeDirections.length)];

      // Calculate start bounds
      let minR = 0, maxR = size - 1;
      let minC = 0, maxC = size - 1;

      if (dir.dr > 0) maxR = size - word.length;
      if (dir.dr < 0) minR = word.length - 1;
      if (dir.dc > 0) maxC = size - word.length;
      if (dir.dc < 0) minC = word.length - 1;

      if (maxR < minR || maxC < minC) continue;

      const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
      const c = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

      // Check collision
      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const curR = r + dir.dr * i;
        const curC = c + dir.dc * i;
        const currentCell = grid[curR][curC];
        if (currentCell !== '' && currentCell !== word[i]) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        // Place word
        for (let i = 0; i < word.length; i++) {
          const curR = r + dir.dr * i;
          const curC = c + dir.dc * i;
          grid[curR][curC] = word[i];
        }

        placements.push({
          word,
          clue: item.clue,
          startRow: r,
          startCol: c,
          endRow: r + dir.dr * (word.length - 1),
          endCol: c + dir.dc * (word.length - 1),
          direction: dir.name
        });
        placed = true;
      }
    }
  }

  // Fill remaining empty cells with random letters A-Z
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }
    }
  }

  return {
    rows: size,
    cols: size,
    grid,
    words: sanitized,
    placements
  };
}
