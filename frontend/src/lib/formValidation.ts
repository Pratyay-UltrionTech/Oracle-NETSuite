import type { CustomForm, Field } from '../types';
import { itemSublistRowKey } from './sublistSubmission';
import { itemSublistRowKey } from './sublistSubmission';

export interface MissingFieldRef {
  fieldId: string;
  label: string;
  tabId: string;
  tabName: string;
  groupName?: string;
  section: 'body' | 'line' | 'expense';
  rowIndex?: number;
  domId: string;
}

function shouldValidateField(field: Field): boolean {
  return field.mandatory && field.visible !== false && field.displayType !== 'hidden';
}

function isValueEmpty(value: unknown, fieldType: string): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (fieldType === 'checkbox') return value !== true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function expenseRowKey(rowIndex: number, fieldId: string): string {
  return `exp_${rowIndex}_${fieldId}`;
}

export function collectMissingRequiredFields(
  form: CustomForm,
  formValues: Record<string, unknown>,
  options?: {
    itemRowIndexes?: number[];
    sortLineFields?: (fields: Field[]) => Field[];
  },
): MissingFieldRef[] {
  const missing: MissingFieldRef[] = [];
  const itemRows = options?.itemRowIndexes ?? [0];
  const sortLineFields = options?.sortLineFields ?? (fields => fields);

  for (const tab of form.tabs) {
    for (const group of tab.fieldGroups) {
      for (const field of group.fields) {
        if (!shouldValidateField(field)) continue;
        if (isValueEmpty(formValues[field.id], field.type)) {
          missing.push({
            fieldId: field.id,
            label: field.label,
            tabId: tab.id,
            tabName: tab.name,
            groupName: group.name,
            section: 'body',
            domId: `field-${field.id}`,
          });
        }
      }
    }

    const lineFields = sortLineFields(tab.itemSublist ?? []);
    for (const rowIndex of itemRows) {
      for (const field of lineFields) {
        if (!shouldValidateField(field)) continue;
        const key = itemSublistRowKey(rowIndex, field.id);
        if (isValueEmpty(formValues[key], field.type)) {
          missing.push({
            fieldId: field.id,
            label: field.label,
            tabId: tab.id,
            tabName: tab.name,
            groupName: 'Line Items',
            section: 'line',
            rowIndex,
            domId: `field-${key}`,
          });
        }
      }
    }

    for (const field of tab.expenseSublist ?? []) {
      if (!shouldValidateField(field)) continue;
      const key = expenseRowKey(0, field.id);
      if (isValueEmpty(formValues[key], field.type)) {
        missing.push({
          fieldId: field.id,
          label: field.label,
          tabId: tab.id,
          tabName: tab.name,
          groupName: 'Expenses',
          section: 'expense',
          rowIndex: 0,
          domId: `field-${key}`,
        });
      }
    }
  }

  return missing;
}

export function formatMissingFieldLabel(ref: MissingFieldRef): string {
  const location = ref.groupName ? `${ref.groupName}` : ref.tabName;
  if (ref.section === 'line' && ref.rowIndex !== undefined && ref.rowIndex > 0) {
    return `${ref.label} (Line ${ref.rowIndex + 1} · ${location})`;
  }
  if (ref.section === 'line') {
    return `${ref.label} (${location})`;
  }
  return `${ref.label} (${location})`;
}

function firstPresent(values: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = values[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return undefined;
}

function hasMeaningfulItemLine(line: Record<string, unknown>): boolean {
  return Boolean(line.item);
}

function hasMeaningfulExpenseLine(line: Record<string, unknown>): boolean {
  return Boolean(line.account);
}

/** Vendor Bill NetSuite sync requirements (mirrors backend validation). */
export function collectVendorBillSyncIssues(
  form: CustomForm,
  formValues: Record<string, unknown>,
  options?: {
    itemRowIndexes?: number[];
    expenseRowIndexes?: number[];
  },
): MissingFieldRef[] {
  const issues: MissingFieldRef[] = [];
  const itemRows = options?.itemRowIndexes ?? [0];
  const expenseRows = options?.expenseRowIndexes ?? [0];

  const vendor = firstPresent(formValues, ['entity', 'vendor', 'vendorId']);
  if (!vendor) {
    const tab = form.tabs[0];
    issues.push({
      fieldId: 'entity',
      label: 'Vendor',
      tabId: tab?.id ?? 'tab_main',
      tabName: tab?.name ?? 'Main',
      groupName: 'Primary Information',
      section: 'body',
      domId: 'field-entity',
    });
  }

  const subsidiary = firstPresent(formValues, ['subsidiary', 'subsidiaryId']);
  if (!subsidiary || !/^\d+$/.test(String(subsidiary))) {
    const mainTab = form.tabs.find(t => t.fieldGroups.some(g => g.fields.some(f => f.id === 'subsidiary'))) ?? form.tabs[0];
    issues.push({
      fieldId: 'subsidiary',
      label: 'Subsidiary',
      tabId: mainTab?.id ?? 'tab_main',
      tabName: mainTab?.name ?? 'Main',
      groupName: 'Classification',
      section: 'body',
      domId: 'field-subsidiary',
    });
  }

  const trandate = formValues.trandate;
  if (trandate === undefined || trandate === null || String(trandate).trim() === '') {
    const mainTab = form.tabs[0];
    issues.push({
      fieldId: 'trandate',
      label: 'Date',
      tabId: mainTab?.id ?? 'tab_main',
      tabName: mainTab?.name ?? 'Main',
      groupName: 'Primary Information',
      section: 'body',
      domId: 'field-trandate',
    });
  }

  const itemLines: Record<string, unknown>[] = [];
  for (const rowIndex of itemRows) {
    const line: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(formValues)) {
      const match = key.match(/^item_(\d+)_(.+)$/);
      if (!match || Number.parseInt(match[1], 10) !== rowIndex) continue;
      line[match[2]] = val;
    }
    if (Object.keys(line).length > 0) itemLines.push(line);
  }

  const expenseLines: Record<string, unknown>[] = [];
  for (const rowIndex of expenseRows) {
    const line: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(formValues)) {
      const match = key.match(/^exp_(\d+)_(.+)$/);
      if (!match || Number.parseInt(match[1], 10) !== rowIndex) continue;
      line[match[2]] = val;
    }
    if (Object.keys(line).length > 0) expenseLines.push(line);
  }

  const hasItem = itemLines.some(hasMeaningfulItemLine);
  const hasExpense = expenseLines.some(hasMeaningfulExpenseLine);
  if (!hasItem && !hasExpense) {
    const itemsTab = form.tabs.find(t => t.itemSublist?.length) ?? form.tabs[0];
    issues.push({
      fieldId: 'item',
      label: 'At least one item or expense line',
      tabId: itemsTab?.id ?? 'tab_items',
      tabName: itemsTab?.name ?? 'Items',
      groupName: 'Line Items',
      section: 'line',
      rowIndex: 0,
      domId: `field-${itemSublistRowKey(0, 'item')}`,
    });
  }

  return issues;
}
