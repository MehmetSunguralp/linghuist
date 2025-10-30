export const LANGUAGE_LEVELS = [
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Fluent', label: 'Fluent' },
  { value: 'Native', label: 'Native' },
];

export const LANGUAGES = [
  { name: 'Afrikaans', code: 'af' },
  { name: 'Albanian', code: 'sq' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Armenian', code: 'hy' },
  { name: 'Basque', code: 'eu' },
  { name: 'Bengali', code: 'bn' },
  { name: 'Bulgarian', code: 'bg' },
  { name: 'Catalan', code: 'ca' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Croatian', code: 'hr' },
  { name: 'Czech', code: 'cs' },
  { name: 'Danish', code: 'da' },
  { name: 'Dutch', code: 'nl' },
  { name: 'English', code: 'en' },
  { name: 'Estonian', code: 'et' },
  { name: 'Filipino', code: 'fil' },
  { name: 'Finnish', code: 'fi' },
  { name: 'French', code: 'fr' },
  { name: 'Georgian', code: 'ka' },
  { name: 'German', code: 'de' },
  { name: 'Greek', code: 'el' },
  { name: 'Gujarati', code: 'gu' },
  { name: 'Hebrew', code: 'he' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Hungarian', code: 'hu' },
  { name: 'Icelandic', code: 'is' },
  { name: 'Indonesian', code: 'id' },
  { name: 'Irish', code: 'ga' },
  { name: 'Italian', code: 'it' },
  { name: 'Japanese', code: 'ja' },
  { name: 'Kannada', code: 'kn' },
  { name: 'Korean', code: 'ko' },
  { name: 'Latvian', code: 'lv' },
  { name: 'Lithuanian', code: 'lt' },
  { name: 'Malay', code: 'ms' },
  { name: 'Malayalam', code: 'ml' },
  { name: 'Marathi', code: 'mr' },
  { name: 'Norwegian', code: 'no' },
  { name: 'Persian', code: 'fa' },
  { name: 'Polish', code: 'pl' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Punjabi', code: 'pa' },
  { name: 'Romanian', code: 'ro' },
  { name: 'Russian', code: 'ru' },
  { name: 'Serbian', code: 'sr' },
  { name: 'Slovak', code: 'sk' },
  { name: 'Slovenian', code: 'sl' },
  { name: 'Spanish', code: 'es' },
  { name: 'Swahili', code: 'sw' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Tagalog', code: 'tl' },
  { name: 'Tamil', code: 'ta' },
  { name: 'Telugu', code: 'te' },
  { name: 'Thai', code: 'th' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Ukrainian', code: 'uk' },
  { name: 'Urdu', code: 'ur' },
  { name: 'Vietnamese', code: 'vi' },
  { name: 'Welsh', code: 'cy' },
];

export const getLanguageCode = (languageName: string): string => {
  const language = LANGUAGES.find(
    (lang) => lang.name.toLowerCase() === languageName.toLowerCase(),
  );
  return language?.code || languageName.toLowerCase().substring(0, 2);
};

export const getLanguageName = (code: string): string => {
  const language = LANGUAGES.find(
    (lang) => lang.code.toLowerCase() === code.toLowerCase(),
  );
  return language?.name || code;
};

// Map language codes (ISO 639) to representative country codes (ISO 3166) for flags
export const languageToCountryCode = (languageCode: string): string => {
  const code = (languageCode || '').toLowerCase();
  const mapping: Record<string, string> = {
    en: 'GB', // English
    es: 'ES', // Spanish
    pt: 'PT', // Portuguese
    fr: 'FR', // French
    de: 'DE', // German
    it: 'IT', // Italian
    tr: 'TR', // Turkish
    ru: 'RU', // Russian
    zh: 'CN', // Chinese (Simplified)
    ja: 'JP', // Japanese
    ko: 'KR', // Korean
    ar: 'SA', // Arabic (Saudi Arabia)
    hi: 'IN', // Hindi
    bn: 'BD', // Bengali
    ur: 'PK', // Urdu
    fa: 'IR', // Persian
    he: 'IL', // Hebrew
    nl: 'NL', // Dutch
    sv: 'SE', // Swedish
    no: 'NO', // Norwegian
    da: 'DK', // Danish
    fi: 'FI', // Finnish
    pl: 'PL', // Polish
    cs: 'CZ', // Czech
    sk: 'SK', // Slovak
    sl: 'SI', // Slovenian
    ro: 'RO', // Romanian
    hu: 'HU', // Hungarian
    el: 'GR', // Greek
    uk: 'UA', // Ukrainian
    vi: 'VN', // Vietnamese
    th: 'TH', // Thai
    id: 'ID', // Indonesian
    ms: 'MY', // Malay
    fil: 'PH', // Filipino
    tl: 'PH', // Tagalog
    sw: 'TZ', // Swahili
    af: 'ZA', // Afrikaans
    sq: 'AL', // Albanian
    hy: 'AM', // Armenian
    eu: 'ES', // Basque (Spain)
    ca: 'ES', // Catalan (Spain)
    hr: 'HR', // Croatian
    et: 'EE', // Estonian
    ka: 'GE', // Georgian
    is: 'IS', // Icelandic
    ga: 'IE', // Irish
    lv: 'LV', // Latvian
    lt: 'LT', // Lithuanian
    ml: 'IN', // Malayalam
    mr: 'IN', // Marathi
    pa: 'IN', // Punjabi
    ta: 'IN', // Tamil
    te: 'IN', // Telugu
    cy: 'GB', // Welsh (UK)
  };

  const country = mapping[code] || code.substring(0, 2).toUpperCase();
  return country;
};
