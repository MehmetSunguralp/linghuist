/**
 * Language utilities and constants
 */

export const LANGUAGES = [
  { name: 'English', code: 'en' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'German', code: 'de' },
  { name: 'Italian', code: 'it' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Russian', code: 'ru' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Korean', code: 'ko' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Polish', code: 'pl' },
  { name: 'Greek', code: 'el' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Norwegian', code: 'no' },
  { name: 'Danish', code: 'da' },
  { name: 'Finnish', code: 'fi' },
  { name: 'Czech', code: 'cs' },
  { name: 'Romanian', code: 'ro' },
  { name: 'Hungarian', code: 'hu' },
  { name: 'Bulgarian', code: 'bg' },
  { name: 'Croatian', code: 'hr' },
  { name: 'Serbian', code: 'sr' },
  { name: 'Slovak', code: 'sk' },
  { name: 'Slovenian', code: 'sl' },
  { name: 'Ukrainian', code: 'uk' },
  { name: 'Vietnamese', code: 'vi' },
  { name: 'Thai', code: 'th' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Malay', code: 'ms' },
  { name: 'Hebrew', code: 'he' },
  { name: 'Persian', code: 'fa' },
  { name: 'Urdu', code: 'ur' },
  { name: 'Bengali', code: 'bn' },
  { name: 'Tagalog', code: 'tl' },
];

export const LANGUAGE_LEVELS = [
  { value: 'Native', label: 'Native' },
  { value: 'Fluent', label: 'Fluent' },
  { value: 'Advanced', label: 'Advanced' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Beginner', label: 'Beginner' },
];

/**
 * Gets the language code for a language name
 */
export const getLanguageCode = (languageName: string): string => {
  const language = LANGUAGES.find(
    (lang) => lang.name.toLowerCase() === languageName.toLowerCase(),
  );
  return language?.code || languageName.toLowerCase().substring(0, 2);
};

/**
 * Maps language code to country code for flag display
 * This is a simplified mapping - some languages may not map perfectly
 */
export const languageToCountryCode = (code: string): string | undefined => {
  const mapping: Record<string, string> = {
    en: 'US',
    es: 'ES',
    fr: 'FR',
    de: 'DE',
    it: 'IT',
    pt: 'PT',
    ru: 'RU',
    zh: 'CN',
    ja: 'JP',
    ko: 'KR',
    ar: 'SA',
    hi: 'IN',
    tr: 'TR',
    nl: 'NL',
    pl: 'PL',
    el: 'GR',
    sv: 'SE',
    no: 'NO',
    da: 'DK',
    fi: 'FI',
    cs: 'CZ',
    ro: 'RO',
    hu: 'HU',
    bg: 'BG',
    hr: 'HR',
    sr: 'RS',
    sk: 'SK',
    sl: 'SI',
    uk: 'UA',
    vi: 'VN',
    th: 'TH',
    id: 'ID',
    ms: 'MY',
    he: 'IL',
    fa: 'IR',
    ur: 'PK',
    bn: 'BD',
    tl: 'PH',
  };

  return mapping[code.toLowerCase()];
};

export const COUNTRIES: string[] = [
  'TR',
  'DE',
  'US',
  'GB',
  'CA',
  'FR',
  'ES',
  'PT',
  'IT',
  'NL',
  'BE',
  'SE',
  'NO',
  'DK',
  'FI',
  'PL',
  'CZ',
  'SK',
  'SI',
  'RO',
  'HU',
  'GR',
  'UA',
  'RU',
  'IN',
  'JP',
  'CN',
  'KR',
  'BR',
  'AR',
  'MX',
  'AU',
  'NZ',
  'IE',
  'IL',
  'SA',
  'AE',
  'ZA',
  'EG',
  'PK',
  'BD',
  'VN',
  'TH',
  'ID',
  'MY',
  'PH',
];
