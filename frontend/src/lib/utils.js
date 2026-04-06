export const norm = (s) => (s ?? '').toString().trim();

export const canon = (s) =>
  (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .replace(/[\s\-_()\.,"']/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
