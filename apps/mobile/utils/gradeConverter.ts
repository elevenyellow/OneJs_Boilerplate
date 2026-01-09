/**
 * French grade conversion utilities
 */

export const FRENCH_GRADES = [
  '3a', '3b', '3c',
  '4a', '4b', '4c',
  '5a', '5a+', '5b', '5b+', '5c', '5c+',
  '6a', '6a+', '6b', '6b+', '6c', '6c+',
  '7a', '7a+', '7b', '7b+', '7c', '7c+',
  '8a', '8a+', '8b', '8b+', '8c', '8c+',
  '9a', '9a+', '9b', '9b+', '9c', '9c+',
] as const;

export type FrenchGrade = typeof FRENCH_GRADES[number];

/**
 * Convert grade to index for comparison
 */
export function gradeToIndex(grade: string): number {
  const normalized = grade.toLowerCase().trim();
  const index = FRENCH_GRADES.indexOf(normalized as FrenchGrade);
  return index !== -1 ? index : 0;
}

/**
 * Convert index back to grade
 */
export function indexToGrade(index: number): FrenchGrade {
  if (index < 0 || index >= FRENCH_GRADES.length) {
    return '5a';
  }
  return FRENCH_GRADES[index];
}

/**
 * Get grade display name
 */
export function getGradeDisplay(grade: string): string {
  const normalized = grade.toLowerCase().trim();
  return FRENCH_GRADES.includes(normalized as FrenchGrade) ? normalized : grade;
}

/**
 * Get grades in range
 */
export function getGradesInRange(minGrade: string, maxGrade: string): FrenchGrade[] {
  const minIndex = gradeToIndex(minGrade);
  const maxIndex = gradeToIndex(maxGrade);
  
  return FRENCH_GRADES.slice(minIndex, maxIndex + 1);
}

/**
 * Format grade range for display
 */
export function formatGradeRange(min: string, max: string): string {
  return `${getGradeDisplay(min)} - ${getGradeDisplay(max)}`;
}

/**
 * Get default grade range based on skill level
 */
export function getDefaultGradeRange(level: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'intermediate'): { min: string; max: string } {
  switch (level) {
    case 'beginner':
      return { min: '4a', max: '5c' };
    case 'intermediate':
      return { min: '5c', max: '6c' };
    case 'advanced':
      return { min: '6b', max: '7b' };
    case 'expert':
      return { min: '7a', max: '8c' };
    default:
      return { min: '5c', max: '6c' };
  }
}
