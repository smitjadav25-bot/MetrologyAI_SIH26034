import fs from 'fs';
import path from 'path';
import { Inspection } from '@/types/inspection';

const DATA_DIR = path.join(process.cwd(), 'data');
const INSPECTIONS_FILE = path.join(DATA_DIR, 'inspections.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INSPECTIONS_FILE)) {
    fs.writeFileSync(INSPECTIONS_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

export function getInspections(): Inspection[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(INSPECTIONS_FILE, 'utf-8');
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [];
  } catch (err) {
    console.error('Error reading inspections:', err);
    return [];
  }
}

export function getInspectionById(id: string): Inspection | null {
  const all = getInspections();
  return all.find(i => i.inspectionId.toLowerCase() === id.toLowerCase()) || null;
}

export function getInspectionByCertificateId(certId: string): Inspection | null {
  const all = getInspections();
  return all.find(i => i.certificateId && i.certificateId.toLowerCase() === certId.toLowerCase()) || null;
}

export function getInspectionByNoticeId(noticeId: string): Inspection | null {
  const all = getInspections();
  return all.find(i => i.noticeId && i.noticeId.toLowerCase() === noticeId.toLowerCase()) || null;
}

export function deleteInspection(id: string): boolean {
  ensureDataDir();
  const all = getInspections();
  const targetIdx = all.findIndex(
    i =>
      i.inspectionId.toLowerCase() === id.toLowerCase() ||
      (i.certificateId && i.certificateId.toLowerCase() === id.toLowerCase()) ||
      (i.noticeId && i.noticeId.toLowerCase() === id.toLowerCase())
  );

  if (targetIdx === -1) return false;

  all.splice(targetIdx, 1);
  fs.writeFileSync(INSPECTIONS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  return true;
}

export function saveInspection(inspection: Inspection): Inspection {
  ensureDataDir();
  const all = getInspections();
  const existingIdx = all.findIndex(i => i.inspectionId === inspection.inspectionId);

  if (existingIdx >= 0) {
    all[existingIdx] = {
      ...inspection,
      updatedAt: new Date().toISOString()
    };
  } else {
    all.unshift(inspection);
  }

  fs.writeFileSync(INSPECTIONS_FILE, JSON.stringify(all, null, 2), 'utf-8');
  return inspection;
}

export function generateNextId(type: 'INS' | 'CERT' | 'NOTICE'): string {
  const all = getInspections();
  const year = new Date().getFullYear();
  const prefix = `${type}-${year}-`;
  
  let maxNum = 0;
  for (const item of all) {
    const idToCheck = type === 'INS'
      ? item.inspectionId
      : type === 'CERT'
        ? item.certificateId
        : item.noticeId;
    
    if (idToCheck && idToCheck.startsWith(prefix)) {
      const numPart = parseInt(idToCheck.replace(prefix, ''), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `${prefix}${padded}`;
}
