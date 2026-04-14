/**
 * Regular Expression Parser
 * Converts infix regex to postfix using the Shunting-Yard algorithm.
 * Operators: | (union), · (concatenation), * (Kleene star), + (plus), ? (optional)
 */

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

// Operator precedence (higher = tighter binding)
const PRECEDENCE: Record<string, number> = {
  '|': 1,
  '·': 2,
  '*': 3,
  '+': 3,
  '?': 3,
};

const RIGHT_ASSOCIATIVE = new Set(['*', '+', '?']);
const UNARY_OPS = new Set(['*', '+', '?']);
const BINARY_OPS = new Set(['|', '·']);

function isLiteral(ch: string): boolean {
  return !UNARY_OPS.has(ch) && !BINARY_OPS.has(ch) && ch !== '(' && ch !== ')';
}

/**
 * Inserts explicit concatenation operators (·) into the regex.
 * E.g.  "ab" → "a·b", "a*b" → "a*·b", "(a|b)c" → "(a|b)·c"
 */
export function insertConcatOps(regex: string): string {
  let result = '';
  for (let i = 0; i < regex.length; i++) {
    const cur = regex[i];
    const next = regex[i + 1];
    result += cur;
    if (next === undefined) continue;

    const curIsAtom = isLiteral(cur) || UNARY_OPS.has(cur) || cur === ')';
    const nextIsAtom = isLiteral(next) || next === '(';

    if (curIsAtom && nextIsAtom) {
      result += '·';
    }
  }
  return result;
}

/**
 * Converts an infix regex (with explicit · operators) to postfix using Shunting-Yard.
 */
export function toPostfix(regex: string): string {
  const output: string[] = [];
  const opStack: string[] = [];

  for (const token of regex) {
    if (token === '(') {
      opStack.push(token);
    } else if (token === ')') {
      while (opStack.length > 0 && opStack[opStack.length - 1] !== '(') {
        output.push(opStack.pop()!);
      }
      if (opStack.length === 0) {
        throw new ParseError('Mismatched parentheses: unexpected ")"');
      }
      opStack.pop(); // remove '('
    } else if (BINARY_OPS.has(token) || UNARY_OPS.has(token)) {
      const prec = PRECEDENCE[token];
      while (
        opStack.length > 0 &&
        opStack[opStack.length - 1] !== '(' &&
        (PRECEDENCE[opStack[opStack.length - 1]] > prec ||
          (PRECEDENCE[opStack[opStack.length - 1]] === prec && !RIGHT_ASSOCIATIVE.has(token)))
      ) {
        output.push(opStack.pop()!);
      }
      opStack.push(token);
    } else {
      // literal
      output.push(token);
    }
  }

  while (opStack.length > 0) {
    const op = opStack.pop()!;
    if (op === '(' || op === ')') {
      throw new ParseError('Mismatched parentheses: unclosed "("');
    }
    output.push(op);
  }

  return output.join('');
}

/**
 * Validates a regex string for common errors.
 */
export function validateRegex(regex: string): void {
  if (!regex || regex.trim() === '') {
    throw new ParseError('Regular expression cannot be empty');
  }

  // Check for unmatched parentheses
  let depth = 0;
  for (const ch of regex) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) throw new ParseError('Mismatched parentheses: unexpected ")"');
  }
  if (depth !== 0) throw new ParseError('Mismatched parentheses: unclosed "("');

  // Check for empty groups
  if (regex.includes('()')) {
    throw new ParseError('Empty group "()" is not allowed');
  }

  // Check for double binary operators
  const binaryChars = ['|'];
  for (const op of binaryChars) {
    if (regex.startsWith(op) || regex.endsWith(op)) {
      throw new ParseError(`Operator "${op}" cannot appear at the start or end`);
    }
    if (regex.includes(op + op)) {
      throw new ParseError(`Double operator "${op + op}" is not allowed`);
    }
    if (regex.includes('(' + op) || regex.includes(op + ')')) {
      throw new ParseError(`Operator "${op}" cannot appear adjacent to parentheses`);
    }
  }

  // Check for operators applied to nothing
  if (['*', '+', '?'].some(op => regex.startsWith(op))) {
    throw new ParseError(`Operator "${regex[0]}" must be applied to an expression`);
  }
}

/**
 * Full parse pipeline: validate → insert concat ops → convert to postfix
 */
export function parseRegex(regex: string): string {
  validateRegex(regex);
  const withConcat = insertConcatOps(regex);
  return toPostfix(withConcat);
}
