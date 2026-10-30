// Pure formatting and selection rules shared by both public pages.
export function escapeHTML(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function typography(value, language = 'ru') {
  // Start from normal spaces so a CMS edit cannot accumulate stale NBSP runs.
  let result = String(value ?? '').replace(/\u00a0/g, ' ');
  // Keep short conjunctions and prepositions attached to their following words.
  // Two passes also handle short adjacent words ("и в зале" => "и\u00a0в\u00a0зале").
  const ru = /(^|[\s(«])((?:[вксуаои]|на|по|за|из|от|до|об|не|но|со|во|ко|под|при|для|без)) +(?=[А-Яа-яЁёA-Za-z0-9])/giu;
  const en = /(^|[\s(“(])((?:a|an|the|of|in|on|at|to|by|for|and|or)) +(?=[A-Za-z0-9])/giu;
  const rule = language === 'ru' ? ru : language === 'en' ? en : null;
  if (!rule) return result;
  for (let i = 0; i < 2; i++) result = result.replace(rule, '$1$2\u00a0');
  return result;
}
export function cleanPhone(value) {
  return String(value).replace(/[^\d+()\s-]/g, '').replace(/(?!^)\+/g, '').slice(0, 30);
}
export function validPhone(value) {
  const text = String(value).trim(), digits = text.replace(/\D/g, '');
  return /^\+?[\d()\s-]+$/.test(text) && digits.length >= 7 && digits.length <= 15 && (!text.startsWith('+375') || digits.length === 12);
}
export function minskNow(now = Date.now()) {
  return new Date(now + 3 * 3600000).toISOString().slice(0, 16);
}
export function splitEvents(rows, now = minskNow()) {
  const valid = rows.filter(x => x.published !== false && x.published !== 0 && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(x.starts_at));
  return { upcoming: valid.filter(x => x.starts_at >= now).sort((a,b) => a.starts_at.localeCompare(b.starts_at)), past: valid.filter(x => x.starts_at < now).sort((a,b) => b.starts_at.localeCompare(a.starts_at)) };
}
export function safeURL(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
export function localImage(value) { return /^\/media\/[\w.-]+\.(?:jpg|jpeg|png|webp|avif)$/.test(value || '') ? value : ''; }
export function localizedValue(key, language, defaults, source) {
  const ru = source.content || {}, en = source.content_en || {};
  if (language === 'ru') return ru[key] ?? defaults.content[key] ?? '';
  if (Object.hasOwn(ru, key)) {
    if (!/[А-Яа-яЁё]/.test(ru[key]) || /^(phone|menu|instagram|telegram)_/.test(key) || key.endsWith('_image')) return ru[key];
    // Never mix un-translated editorial Russian into the English interface.
    return en[key] || '';
  }
  return defaults.content_en[key] ?? '';
}
