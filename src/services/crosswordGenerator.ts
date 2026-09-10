import { CrosswordGrid, CrosswordPlacement, CrosswordCell } from '../types';

export interface RawCrosswordItem {
  id?: string;
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
}

// Clean and sanitize answers to uppercase A-Z only
export function sanitizeAnswer(raw: string): string {
  return (raw || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
}

interface CandidatePlacement {
  item: RawCrosswordItem;
  cleanWord: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

/**
 * Generates an optimized crossword puzzle layout using backtracking and intersection heuristics.
 */
export function generateCrossword(items: RawCrosswordItem[], maxAttempts = 25): CrosswordGrid {
  if (!items || items.length === 0) {
    return { rows: 0, cols: 0, grid: [], placements: [], placedWords: [], failedWords: [] };
  }

  // 1. Sanitize & Filter
  const sanitizedItems = items
    .map((item, idx) => ({
      ...item,
      id: item.id || `item_${idx + 1}`,
      cleanWord: sanitizeAnswer(item.answer)
    }))
    .filter(it => it.cleanWord.length >= 2);

  if (sanitizedItems.length === 0) {
    return {
      rows: 0,
      cols: 0,
      grid: [],
      placements: [],
      placedWords: [],
      failedWords: items.map(i => i.answer)
    };
  }

  let bestPlacements: CandidatePlacement[] = [];
  let bestScore = -1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Sort words: anchor is usually longest, with a little random perturbation for diversity
    const shuffled = [...sanitizedItems].sort((a, b) => {
      const lengthDiff = b.cleanWord.length - a.cleanWord.length;
      if (attempt === 0) return lengthDiff;
      return lengthDiff + (Math.random() - 0.5) * 2;
    });

    const currentPlacements: CandidatePlacement[] = [];
    // Board representation using Map key "r,c" -> char
    const board = new Map<string, { char: string; direction: 'across' | 'down' | 'both'; wordId: string }>();

    // Place first word (anchor) horizontally at (0, 0)
    const anchor = shuffled[0];
    const anchorDir: 'across' | 'down' = attempt % 2 === 0 ? 'across' : 'down';
    currentPlacements.push({
      item: anchor,
      cleanWord: anchor.cleanWord,
      row: 0,
      col: 0,
      direction: anchorDir
    });

    for (let i = 0; i < anchor.cleanWord.length; i++) {
      const r = anchorDir === 'across' ? 0 : i;
      const c = anchorDir === 'across' ? i : 0;
      board.set(`${r},${c}`, { char: anchor.cleanWord[i], direction: anchorDir, wordId: anchor.id });
    }

    // Try placing subsequent words by finding intersections
    for (let w = 1; w < shuffled.length; w++) {
      const currentItem = shuffled[w];
      const word = currentItem.cleanWord;

      // Find all valid candidate intersection spots
      const candidateSpots: { row: number; col: number; direction: 'across' | 'down'; overlaps: number }[] = [];

      for (const placed of currentPlacements) {
        const perpDir: 'across' | 'down' = placed.direction === 'across' ? 'down' : 'across';

        for (let i = 0; i < word.length; i++) {
          const char = word[i];

          for (let j = 0; j < placed.cleanWord.length; j++) {
            if (placed.cleanWord[j] === char) {
              // Potential intersection
              const targetRow = placed.direction === 'across' ? placed.row - i : placed.row + j;
              const targetCol = placed.direction === 'across' ? placed.col + j : placed.col - i;

              if (canPlaceWord(board, word, targetRow, targetCol, perpDir, currentItem.id)) {
                // Calculate count of overlaps
                const overlaps = countOverlaps(board, word, targetRow, targetCol, perpDir);
                candidateSpots.push({ row: targetRow, col: targetCol, direction: perpDir, overlaps });
              }
            }
          }
        }
      }

      if (candidateSpots.length > 0) {
        // Sort spots: prefer more intersections, more compact
        candidateSpots.sort((a, b) => b.overlaps - a.overlaps);
        const chosen = candidateSpots[0];

        currentPlacements.push({
          item: currentItem,
          cleanWord: word,
          row: chosen.row,
          col: chosen.col,
          direction: chosen.direction
        });

        // Stamp to board
        for (let idx = 0; idx < word.length; idx++) {
          const r = chosen.direction === 'across' ? chosen.row : chosen.row + idx;
          const c = chosen.direction === 'across' ? chosen.col + idx : chosen.col;
          const key = `${r},${c}`;
          const existing = board.get(key);
          if (existing) {
            existing.direction = 'both';
          } else {
            board.set(key, { char: word[idx], direction: chosen.direction, wordId: currentItem.id });
          }
        }
      }
    }

    // Score this attempt
    // High score for more words placed, compactness, and high intersection ratio
    const placedCount = currentPlacements.length;
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const p of currentPlacements) {
      minR = Math.min(minR, p.row);
      minC = Math.min(minC, p.col);
      const endR = p.direction === 'down' ? p.row + p.cleanWord.length - 1 : p.row;
      const endC = p.direction === 'across' ? p.col + p.cleanWord.length - 1 : p.col;
      maxR = Math.max(maxR, endR);
      maxC = Math.max(maxC, endC);
    }
    const width = maxC - minC + 1;
    const height = maxR - minR + 1;
    const area = width * height;
    const score = placedCount * 1000 - area * 2;

    if (score > bestScore || currentPlacements.length > bestPlacements.length) {
      bestScore = score;
      bestPlacements = currentPlacements;
      // If we placed all words, this is already great
      if (placedCount === sanitizedItems.length && area <= 400) {
        break;
      }
    }
  }

  // Find failed words
  const placedWordIds = new Set(bestPlacements.map(p => p.item.id));
  const failedWords = items
    .filter(i => {
      const clean = sanitizeAnswer(i.answer);
      if (clean.length < 2) return true;
      return !placedWordIds.has(i.id || '');
    })
    .map(i => i.answer);

  if (bestPlacements.length === 0) {
    return { rows: 0, cols: 0, grid: [], placements: [], placedWords: [], failedWords };
  }

  // Normalize coordinates so minRow = 0, minCol = 0
  let minRow = Infinity, minCol = Infinity, maxRow = -Infinity, maxCol = -Infinity;
  for (const p of bestPlacements) {
    minRow = Math.min(minRow, p.row);
    minCol = Math.min(minCol, p.col);
    const endR = p.direction === 'down' ? p.row + p.cleanWord.length - 1 : p.row;
    const endC = p.direction === 'across' ? p.col + p.cleanWord.length - 1 : p.col;
    maxRow = Math.max(maxRow, endR);
    maxCol = Math.max(maxCol, endC);
  }

  const normalizedPlacements: CandidatePlacement[] = bestPlacements.map(p => ({
    ...p,
    row: p.row - minRow,
    col: p.col - minCol
  }));

  const totalRows = maxRow - minRow + 1;
  const totalCols = maxCol - minCol + 1;

  // Build grid
  const grid: CrosswordCell[][] = Array.from({ length: totalRows }, (_, r) =>
    Array.from({ length: totalCols }, (_, c) => ({
      row: r,
      col: c,
      letter: '',
      isBlack: true,
      isBlocked: true
    }))
  );

  for (const p of normalizedPlacements) {
    for (let i = 0; i < p.cleanWord.length; i++) {
      const r = p.direction === 'across' ? p.row : p.row + i;
      const c = p.direction === 'across' ? p.col + i : p.col;
      grid[r][c].letter = p.cleanWord[i];
      grid[r][c].isBlack = false;
      grid[r][c].isBlocked = false;
    }
  }

  // Assign numbers logically (top-to-bottom, left-to-right)
  const finalPlacements: CrosswordPlacement[] = [];
  let clueNumber = 1;

  for (let r = 0; r < totalRows; r++) {
    for (let c = 0; c < totalCols; c++) {
      const acrossStart = normalizedPlacements.find(p => p.direction === 'across' && p.row === r && p.col === c);
      const downStart = normalizedPlacements.find(p => p.direction === 'down' && p.row === r && p.col === c);

      if (acrossStart || downStart) {
        grid[r][c].number = clueNumber;

        if (acrossStart) {
          finalPlacements.push({
            id: acrossStart.item.id || `pl_across_${clueNumber}`,
            number: clueNumber,
            direction: 'ACROSS',
            word: acrossStart.cleanWord,
            clue: acrossStart.item.question,
            hint: acrossStart.item.hint,
            explanation: acrossStart.item.explanation,
            row: r,
            col: c,
            length: acrossStart.cleanWord.length
          });
        }

        if (downStart) {
          finalPlacements.push({
            id: downStart.item.id || `pl_down_${clueNumber}`,
            number: clueNumber,
            direction: 'DOWN',
            word: downStart.cleanWord,
            clue: downStart.item.question,
            hint: downStart.item.hint,
            explanation: downStart.item.explanation,
            row: r,
            col: c,
            length: downStart.cleanWord.length
          });
        }

        clueNumber++;
      }
    }
  }

  return {
    rows: totalRows,
    cols: totalCols,
    grid,
    placements: finalPlacements,
    placedWords: finalPlacements,
    failedWords
  };
}

function countOverlaps(
  board: Map<string, { char: string; direction: string; wordId: string }>,
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down'
): number {
  let count = 0;
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    if (board.has(`${r},${c}`)) count++;
  }
  return count;
}

function canPlaceWord(
  board: Map<string, { char: string; direction: string; wordId: string }>,
  word: string,
  row: number,
  col: number,
  direction: 'across' | 'down',
  wordId: string
): boolean {
  // Check cell before word start (must be empty)
  const beforeR = direction === 'across' ? row : row - 1;
  const beforeC = direction === 'across' ? col - 1 : col;
  if (board.has(`${beforeR},${beforeC}`)) return false;

  // Check cell after word end (must be empty)
  const afterR = direction === 'across' ? row : row + word.length;
  const afterC = direction === 'across' ? col + word.length : col;
  if (board.has(`${afterR},${afterC}`)) return false;

  let hasIntersection = false;

  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? row : row + i;
    const c = direction === 'across' ? col + i : col;
    const key = `${r},${c}`;
    const cell = board.get(key);

    if (cell) {
      // Must match letter
      if (cell.char !== word[i]) return false;
      // Cannot intersect word of the same direction
      if (cell.direction === direction || cell.direction === 'both') return false;
      hasIntersection = true;
    } else {
      // Parallel adjacent cells must NOT touch non-crossing words
      if (direction === 'across') {
        if (board.has(`${r - 1},${c}`) || board.has(`${r + 1},${c}`)) return false;
      } else {
        if (board.has(`${r},${c - 1}`) || board.has(`${r},${c + 1}`)) return false;
      }
    }
  }

  return hasIntersection;
}
