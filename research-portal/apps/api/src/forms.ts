import { BadRequestException } from '@nestjs/common';

export type FormItem = {
  id: string; label: string; type: 'choice' | 'number' | 'scale' | 'text'; required?: boolean;
  options?: string[]; min?: number; max?: number; maxLength?: number;
};
export type FormSchema = { items: FormItem[]; source_version?: string };

export function validateSchema(value: unknown): FormSchema {
  const schema = value as FormSchema;
  if (!schema || !Array.isArray(schema.items) || schema.items.length < 1 || schema.items.length > 40) {
    throw new BadRequestException('A questionnaire needs 1–40 questions');
  }
  const seen = new Set<string>();
  for (const item of schema.items) {
    if (!item || !/^[a-z][a-z0-9_]{1,49}$/.test(item.id) || seen.has(item.id) ||
      typeof item.label !== 'string' || !item.label.trim() || item.label.length > 500 ||
      !['choice', 'number', 'scale', 'text'].includes(item.type)) {
      throw new BadRequestException('Invalid or duplicate questionnaire item');
    }
    seen.add(item.id);
    if (item.type === 'choice' && (!Array.isArray(item.options) || item.options.length < 2 ||
      item.options.length > 15 || item.options.some((option) => typeof option !== 'string' || !option || option.length > 200))) {
      throw new BadRequestException(`Invalid choices for ${item.id}`);
    }
    if ((item.type === 'number' || item.type === 'scale') &&
      (!Number.isFinite(item.min) || !Number.isFinite(item.max) || Number(item.min) >= Number(item.max))) {
      throw new BadRequestException(`Invalid numeric range for ${item.id}`);
    }
    if (item.type === 'text' && (!Number.isInteger(item.maxLength) || Number(item.maxLength) < 1 || Number(item.maxLength) > 5000)) {
      throw new BadRequestException(`Invalid text limit for ${item.id}`);
    }
  }
  return schema;
}

export function validateAnswers(schemaValue: unknown, value: unknown): Record<string, unknown> {
  const schema = validateSchema(schemaValue);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Answers must be an object');
  const answers = value as Record<string, unknown>;
  const known = new Set(schema.items.map((item) => item.id));
  for (const id of Object.keys(answers)) if (!known.has(id)) throw new BadRequestException(`Unexpected answer: ${id}`);
  for (const item of schema.items) {
    const answer = answers[item.id];
    if (answer === undefined || answer === '') {
      if (item.required) throw new BadRequestException(`Required: ${item.id}`);
      continue;
    }
    if (item.type === 'choice' && (!item.options || !item.options.includes(String(answer)))) {
      throw new BadRequestException(`Invalid choice: ${item.id}`);
    }
    if ((item.type === 'number' || item.type === 'scale') &&
      (typeof answer !== 'number' || !Number.isFinite(answer) || answer < Number(item.min) || answer > Number(item.max))) {
      throw new BadRequestException(`Invalid number: ${item.id}`);
    }
    if (item.type === 'text' && (typeof answer !== 'string' || answer.length > Number(item.maxLength))) {
      throw new BadRequestException(`Invalid text: ${item.id}`);
    }
  }
  return answers;
}
