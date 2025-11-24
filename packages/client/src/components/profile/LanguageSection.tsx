import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  OutlinedInput,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import FlagIcon from '@/components/FlagIcon';
import {
  LANGUAGES,
  LANGUAGE_LEVELS,
  getLanguageCode,
  languageToCountryCode,
} from '@/utils/languages';

export interface LanguageInput {
  name: string;
  level: string;
  code: string;
}

interface LanguageSectionProps {
  title: string;
  languages: LanguageInput[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, key: keyof LanguageInput, value: string) => void;
  excludedLanguages: string[];
  allowNative: boolean;
  showPaper?: boolean;
}

export const LanguageSection = ({
  title,
  languages,
  onAdd,
  onRemove,
  onUpdate,
  excludedLanguages,
  allowNative,
  showPaper = true,
}: LanguageSectionProps) => {
  const getAvailableLanguages = (currentIndex: number) => {
    const selectedLanguages = languages
      .map((lang, idx) => (idx !== currentIndex ? lang.name : ''))
      .filter((name) => name.trim() !== '');
    return LANGUAGES.filter(
      (lang) =>
        !selectedLanguages.includes(lang.name) &&
        !excludedLanguages.includes(lang.name),
    );
  };

  const content = (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {title === 'Languages I Know' ? (
            <RecordVoiceOverIcon color="primary" />
          ) : (
            <TranslateIcon color="primary" />
          )}
          <Typography
            variant="h5"
            fontSize={{
              xs: '1rem',
              sm: '1.2rem',
              md: '1.5rem',
              lg: '2rem',
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        {languages.map((lang, index) => (
          <Box
            key={lang.code || index}
            sx={{
              display: 'flex',
              gap: { xs: 0.5, sm: 1, md: 2 },
              alignItems: 'center',
              flexWrap: 'nowrap',
            }}
          >
            <FormControl
              size="small"
              sx={{
                flex: 1,
                minWidth: { xs: 100, sm: 150 },
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              <InputLabel size="small">Language</InputLabel>
              <Select
                size="small"
                value={lang.name}
                onChange={(e) => onUpdate(index, 'name', e.target.value)}
                input={<OutlinedInput label="Language" />}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: 300, sm: 400 },
                      '& .MuiMenuItem-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        py: { xs: 0.5, sm: 1 },
                      },
                    },
                  },
                }}
              >
                {getAvailableLanguages(index).map((language) => (
                  <MenuItem key={language.code} value={language.name}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: { xs: 0.5, sm: 1 },
                      }}
                    >
                      <FlagIcon
                        countryCode={languageToCountryCode(language.code)}
                        size={14}
                      />
                      <Typography
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {language.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              size="small"
              sx={{
                width: { xs: 100, sm: 130, md: 160 },
                flexShrink: 0,
                '& .MuiInputLabel-root': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                },
                '& .MuiSelect-select': {
                  fontSize: { xs: '0.875rem', sm: '0.875rem', md: '1rem' },
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              <InputLabel size="small">Level</InputLabel>
              <Select
                size="small"
                value={lang.level}
                onChange={(e) => onUpdate(index, 'level', e.target.value)}
                input={<OutlinedInput label="Level" />}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: { xs: 300, sm: 400 },
                      '& .MuiMenuItem-root': {
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        py: { xs: 0.5, sm: 1 },
                      },
                    },
                  },
                }}
              >
                {LANGUAGE_LEVELS.filter(
                  (level) => allowNative || level.value !== 'Native',
                ).map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    <Typography
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {level.label}
                    </Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              color="error"
              onClick={() => onRemove(index)}
              disabled={languages.length === 1}
              size="small"
              sx={{
                flexShrink: 0,
                width: { xs: 16, sm: 36, md: 40 },
                height: { xs: 16, sm: 36, md: 40 },
                minWidth: { xs: 16, sm: 36, md: 40 },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAdd}
        >
          Add Language
        </Button>
      </Box>
    </>
  );

  if (showPaper) {
    return (
      <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: { xs: 2, sm: 3, md: 4 } }}>
        {content}
      </Paper>
    );
  }

  return <Box>{content}</Box>;
};

