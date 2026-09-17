import { z } from 'zod';

const phoneDigits = (value: unknown): string => {
  const text = typeof value === 'string' ? value : value == null ? '' : String(value);
  const digits = text.replace(/\D+/g, '');
  return digits;
};

const sanitizeText = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const normalizeName = (value: unknown): string => sanitizeText(value).replace(/\s+/g, ' ');
const normalizeToken = (value: unknown): string => sanitizeText(value).replace(/\s+/g, '');

export function normalizePhone(value: unknown): string {
  const digits = phoneDigits(value);
  if (!digits) return '';
  if (digits.startsWith('62')) return `0${digits.slice(2)}`;
  if (digits.startsWith('0')) return digits;
  return `0${digits}`;
}

export function isValidPhone(value: unknown): boolean {
  const normalized = normalizePhone(value);
  if (!normalized) return false;
  const digits = normalized.replace(/\D+/g, '');
  return digits.length >= 9 && digits.length <= 15;
}

export function validateEventPayload(input: unknown) {
  const schema = z.object({
    name: z.any(),
    phone: z.any(),
    engine: z.any(),
    location: z.any().optional(),
    notes: z.any().optional(),
  });

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: 'Payload event tidak valid.',
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const name = normalizeName(parsed.data.name);
  const phone = normalizePhone(parsed.data.phone);
  const engineNumber = normalizeToken(parsed.data.engine);
  const location = sanitizeText(parsed.data.location);
  const notes = sanitizeText(parsed.data.notes);

  if (!name) {
    return { ok: false as const, message: 'Nama wajib diisi.' };
  }

  if (!isValidPhone(phone)) {
    return { ok: false as const, message: 'Nomor HP wajib diisi dan minimal 9 digit.' };
  }

  if (!engineNumber || engineNumber.length < 5) {
    return { ok: false as const, message: 'Nomor Mesin wajib diisi minimal 5 karakter.' };
  }

  return {
    ok: true as const,
    data: {
      name,
      phone,
      engineNumber,
      location: location || null,
      notes: notes || null,
    },
  };
}

export function validateLcrPayload(input: unknown) {
  const schema = z.object({
    name: z.any(),
    phone: z.any(),
    nik: z.any().optional(),
    motor: z.any().optional(),
    district: z.any().optional(),
    status: z.any().optional(),
    contact: z.any().optional(),
    result: z.any().optional(),
  });

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: 'Payload LCR tidak valid.',
      issues: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const name = normalizeName(parsed.data.name);
  const phone = normalizePhone(parsed.data.phone);
  const nik = sanitizeText(parsed.data.nik).replace(/\D+/g, '');
  const motor = sanitizeText(parsed.data.motor);
  const district = sanitizeText(parsed.data.district);
  const status = sanitizeText(parsed.data.status) || 'Prospek';
  const contact = sanitizeText(parsed.data.contact) || 'Belum di-FU';
  const result = sanitizeText(parsed.data.result) || 'Belum ada hasil';

  if (!name) {
    return { ok: false as const, message: 'Nama wajib diisi.' };
  }

  if (!isValidPhone(phone)) {
    return { ok: false as const, message: 'Nomor HP wajib diisi dan minimal 9 digit.' };
  }

  return {
    ok: true as const,
    data: {
      name,
      phone,
      nik: nik || null,
      motor: motor || null,
      district: district || null,
      status,
      contact,
      result,
    },
  };
}
