export interface CountryOption {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  flag: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', flag: '🇵🇦' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'DO', name: 'Rep. Dominicana', flag: '🇩🇴' },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'VA', name: 'Vaticano', flag: '🇻🇦' },
];

export function getCountryByCode(code?: string | null): CountryOption | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return COUNTRY_OPTIONS.find((c) => c.code === upper) ?? null;
}

export function getCountryFlag(code?: string | null): string {
  return getCountryByCode(code)?.flag ?? '';
}
