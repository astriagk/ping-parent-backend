// Utility to assign trimmed string fields from source to target
export function assignTrimmedFields(
  target: any,
  source: any,
  fields: string[],
) {
  for (const field of fields) {
    if (source[field] !== undefined) {
      const trimmed = String(source[field]).trim();
      if (trimmed) target[field] = trimmed;
    }
  }
}
