export function sanitizeJsonValue(value: unknown): any {
  if (value === null) return null;

  if (value === undefined) return null;

  if (typeof value === 'string') {
    return value
      .replace(/\u0000/g, '')
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/[\uD800-\uDFFF]/g, '')
      .replace(/\\u0000/g, '')
      .replace(/\\u0001/g, '')
      .replace(/\\u0008/g, '')
      .replace(/\\u000B/g, '')
      .replace(/\\u000C/g, '')
      .replace(/\\u001F/g, '')
      .replace(/\\u007F/g, '');
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonValue(item));
  }

  if (typeof value === 'object') {
    const safeObject: Record<string, any> = {};

    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      if (entryValue === undefined) continue;
      safeObject[sanitizeJsonValue(key)] = sanitizeJsonValue(entryValue);
    }

    return safeObject;
  }

  return String(value);
}

export function safeRawJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(sanitizeJsonValue(value))) as T;
}
