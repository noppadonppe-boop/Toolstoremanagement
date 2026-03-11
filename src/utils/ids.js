/** สร้าง ID ไม่ซ้ำ (ลดโอกาสบันทึกซ้ำเมื่อกดหลายครั้งหรือหลายคนบันทึกพร้อมกัน) */
export function uniqueId(prefix = '') {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
