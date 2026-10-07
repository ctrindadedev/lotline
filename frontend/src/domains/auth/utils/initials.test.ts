import { describe, expect, it } from 'vitest';
import { initialsOf } from './initials';

describe('initialsOf', () => {
  it.each([
    ['Ana', 'A'],
    ['ana maria souza', 'AS'],
    ['  Bruno   Lima ', 'BL'],
    ['', '?'],
  ])('%j → %s', (name, initials) => {
    expect(initialsOf(name)).toBe(initials);
  });
});
