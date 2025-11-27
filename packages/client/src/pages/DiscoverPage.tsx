import { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Explore as ExploreIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAppSelector } from '@/store/hooks';
import { DISCOVER_USERS_QUERY } from '@/api/queries';
import { getSupabaseStorageUrl } from '@/utils/supabaseStorage';
import FlagIcon from '@/components/FlagIcon';
import {
  languageToCountryCode,
  LANGUAGES,
  LANGUAGE_LEVELS,
  COUNTRIES,
} from '@/utils/languages';
import type { User } from '@/types';

interface LanguageFilter {
  name: string;
  level: string;
}

const DiscoverPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, accessToken } = useAppSelector(
    (state) => state.auth,
  );
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false);

  // Active filters (used for query)
  const [ageRange, setAgeRange] = useState<[number, number]>([17, 99]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [knownLanguage, setKnownLanguage] = useState<LanguageFilter>({
    name: '',
    level: '',
  });
  const [learningLanguage, setLearningLanguage] = useState<LanguageFilter>({
    name: '',
    level: '',
  });

  // Local filter state (for dialog, not applied until Apply is clicked)
  const [localAgeRange, setLocalAgeRange] = useState<[number, number]>([
    17, 99,
  ]);
  const [localSelectedCountries, setLocalSelectedCountries] = useState<
    string[]
  >([]);
  const [localKnownLanguage, setLocalKnownLanguage] = useState<LanguageFilter>({
    name: '',
    level: '',
  });
  const [localLearningLanguage, setLocalLearningLanguage] =
    useState<LanguageFilter>({ name: '', level: '' });

  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});
  const [loadedAvatars, setLoadedAvatars] = useState<Record<string, boolean>>(
    {},
  );

  // Build filter object from active filters
  const filter = {
    ...(selectedCountries.length > 0 && { countries: selectedCountries }),
    ...(ageRange[0] > 17 && { minAge: ageRange[0] }),
    ...(ageRange[1] < 99 && { maxAge: ageRange[1] }),
    ...(knownLanguage.name.trim() !== '' && {
      knownLanguages: [knownLanguage.name],
      knownLanguageLevels:
        knownLanguage.level.trim() !== '' ? [knownLanguage.level] : [],
    }),
    ...(learningLanguage.name.trim() !== '' && {
      learningLanguages: [learningLanguage.name],
      learningLanguageLevels:
        learningLanguage.level.trim() !== '' ? [learningLanguage.level] : [],
    }),
  };

  const hasActiveFilters = Object.keys(filter).length > 0;
  const { data, loading, error } = useQuery(DISCOVER_USERS_QUERY, {
    variables: { filter: hasActiveFilters ? filter : null },
    skip: !currentUser,
    fetchPolicy: 'network-only',
  });

  // Initialize local filters when dialog opens
  const handleOpenFiltersDialog = () => {
    setLocalAgeRange(ageRange);
    setLocalSelectedCountries(selectedCountries);
    setLocalKnownLanguage(knownLanguage);
    setLocalLearningLanguage(learningLanguage);
    setFiltersDialogOpen(true);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setAgeRange(localAgeRange);
    setSelectedCountries(localSelectedCountries);
    setKnownLanguage(localKnownLanguage);
    setLearningLanguage(localLearningLanguage);
    setFiltersDialogOpen(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    const defaultAgeRange: [number, number] = [17, 99];
    setLocalAgeRange(defaultAgeRange);
    setLocalSelectedCountries([]);
    setLocalKnownLanguage({ name: '', level: '' });
    setLocalLearningLanguage({ name: '', level: '' });
  };

  // Fetch avatars for users (always use thumbnails)
  useEffect(() => {
    const fetchAvatars = async () => {
      if (!accessToken || !data?.discoverUsers) return;

      const avatarPromises = data.discoverUsers.map(async (user: User) => {
        // Always use thumbnail URL - thumbnails always exist
        const imagePath = user.userThumbnailUrl;
        if (!imagePath || imagePath.trim() === '') return null;

        try {
          // Path format: userThumbnails/{userId}/profile/{timestamp}.webp
          const url = await getSupabaseStorageUrl(
            imagePath,
            'userThumbnails',
            accessToken,
          );
          return { id: user.id, url: url || '' };
        } catch (error) {
          console.error(`Failed to get thumbnail for user ${user.id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(avatarPromises);
      const avatarMap: Record<string, string> = {};
      for (const result of results) {
        if (result?.url) {
          avatarMap[result.id] = result.url;
        }
      }
      setUserAvatars(avatarMap);
      setLoadedAvatars({});
    };

    if (data?.discoverUsers) {
      fetchAvatars();
    }
  }, [data?.discoverUsers, accessToken]);

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info">Please log in to discover users</Alert>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExploreIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1">
            Discover Users
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={handleOpenFiltersDialog}
        >
          Filters
        </Button>
      </Box>

      {/* Filters Dialog */}
      <Dialog
        open={filtersDialogOpen}
        onClose={() => setFiltersDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterListIcon color="primary" />
              <Typography variant="h6">Filters</Typography>
            </Box>
            <IconButton
              onClick={() => setFiltersDialogOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {/* Age Range Filter */}
            <Box>
              <Typography gutterBottom>
                Age Range: {localAgeRange[0]} - {localAgeRange[1]}
              </Typography>
              <Slider
                value={localAgeRange}
                onChange={(_, newValue) =>
                  setLocalAgeRange(newValue as [number, number])
                }
                valueLabelDisplay="auto"
                min={17}
                max={99}
                marks={[
                  { value: 17, label: '17' },
                  { value: 50, label: '50' },
                  { value: 99, label: '99' },
                ]}
              />
            </Box>

            {/* Country Filter */}
            <FormControl fullWidth>
              <InputLabel>Countries</InputLabel>
              <Select
                multiple
                value={localSelectedCountries}
                onChange={(e) =>
                  setLocalSelectedCountries(
                    typeof e.target.value === 'string'
                      ? e.target.value.split(',')
                      : e.target.value,
                  )
                }
                input={<OutlinedInput label="Countries" />}
                renderValue={(selected) => {
                  const getCountryName = (code: string) => {
                    if (globalThis.window === undefined) return code;
                    return (
                      new Intl.DisplayNames(['en'], {
                        type: 'region',
                      }).of(code) || code
                    );
                  };

                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip
                          key={value}
                          label={getCountryName(value)}
                          size="small"
                          onDelete={() =>
                            setLocalSelectedCountries(
                              localSelectedCountries.filter((c) => c !== value),
                            )
                          }
                        />
                      ))}
                    </Box>
                  );
                }}
              >
                {COUNTRIES.map((country) => (
                  <MenuItem key={country} value={country}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FlagIcon countryCode={country} size={16} />
                      <Typography>
                        {globalThis.window !== undefined
                          ? new Intl.DisplayNames(['en'], {
                              type: 'region',
                            }).of(country) || country
                          : country}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Known Language Filter */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Known Language
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={localKnownLanguage.name}
                    onChange={(e) =>
                      setLocalKnownLanguage({
                        ...localKnownLanguage,
                        name: e.target.value,
                      })
                    }
                    input={<OutlinedInput label="Language" />}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {LANGUAGES.map((language) => (
                      <MenuItem key={language.code} value={language.name}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <FlagIcon
                            countryCode={
                              languageToCountryCode(language.code) || 'US'
                            }
                            size={14}
                          />
                          <Typography>{language.name}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ width: 180 }}>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={localKnownLanguage.level}
                    onChange={(e) =>
                      setLocalKnownLanguage({
                        ...localKnownLanguage,
                        level: e.target.value,
                      })
                    }
                    input={<OutlinedInput label="Level" />}
                    disabled={localKnownLanguage.name === ''}
                  >
                    <MenuItem value="">
                      <em>Any</em>
                    </MenuItem>
                    {LANGUAGE_LEVELS.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Learning Language Filter */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Learning Language
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ flex: 1 }}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={localLearningLanguage.name}
                    onChange={(e) =>
                      setLocalLearningLanguage({
                        ...localLearningLanguage,
                        name: e.target.value,
                      })
                    }
                    input={<OutlinedInput label="Language" />}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {LANGUAGES.map((language) => (
                      <MenuItem key={language.code} value={language.name}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <FlagIcon
                            countryCode={
                              languageToCountryCode(language.code) || 'US'
                            }
                            size={14}
                          />
                          <Typography>{language.name}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl sx={{ width: 180 }}>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={localLearningLanguage.level}
                    onChange={(e) =>
                      setLocalLearningLanguage({
                        ...localLearningLanguage,
                        level: e.target.value,
                      })
                    }
                    input={<OutlinedInput label="Level" />}
                    disabled={localLearningLanguage.name === ''}
                  >
                    <MenuItem value="">
                      <em>Any</em>
                    </MenuItem>
                    {LANGUAGE_LEVELS.filter(
                      (level) => level.value !== 'Native',
                    ).map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResetFilters} color="inherit">
            Reset
          </Button>
          <Button
            onClick={handleApplyFilters}
            variant="contained"
            color="primary"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Results Section */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">
          {error.message || 'Failed to load users'}
        </Alert>
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Found {data?.discoverUsers?.length ?? 0} users
          </Typography>
          {(() => {
            const userCount = data?.discoverUsers?.length ?? 0;
            if (userCount === 0) {
              return (
                <Alert severity="info">
                  No users found matching your filters
                </Alert>
              );
            }
            return (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {data?.discoverUsers?.map((user: User) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={user.id}>
                    <Paper
                      sx={{
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s',
                        },
                      }}
                      onClick={() => {
                        if (user.username) {
                          navigate(`/profile/${user.username}`);
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative' }}>
                        <Avatar
                          src={userAvatars[user.id]}
                          sx={{
                            width: 80,
                            height: 80,
                            bgcolor: 'primary.main',
                            opacity:
                              userAvatars[user.id] && !loadedAvatars[user.id]
                                ? 0
                                : 1,
                            transition: 'opacity 0.3s ease-in-out',
                          }}
                          slotProps={{
                            img: {
                              onLoad: () => {
                                if (userAvatars[user.id]) {
                                  setLoadedAvatars((prev) => ({
                                    ...prev,
                                    [user.id]: true,
                                  }));
                                }
                              },
                            },
                          }}
                        >
                          {(user.username || user.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>
                        {user.country && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden',
                              borderRadius: '50%',
                              bgcolor: 'background.paper',
                              border: '2px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <FlagIcon countryCode={user.country} size={18} />
                          </Box>
                        )}
                      </Box>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        noWrap
                        sx={{ width: '100%', textAlign: 'center' }}
                      >
                        {user.username || user.email}
                      </Typography>

                      {/* Language Flags */}
                      {(() => {
                        const hasKnownLanguages =
                          user.languagesKnown && user.languagesKnown.length > 0;
                        const hasLearningLanguages =
                          user.languagesLearn && user.languagesLearn.length > 0;

                        if (!hasKnownLanguages && !hasLearningLanguages) {
                          return null;
                        }

                        return (
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                              width: '100%',
                              mt: 0.5,
                            }}
                          >
                            {/* Known Languages */}
                            {hasKnownLanguages && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  justifyContent: 'center',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: '0.7rem' }}
                                >
                                  Speaks:
                                </Typography>
                                {(user.languagesKnown ?? [])
                                  .slice(0, 2)
                                  .map((lang, idx) => {
                                    const countryCode =
                                      languageToCountryCode(lang.code) || 'US';
                                    return (
                                      <Box
                                        key={`known-${lang.code}-${idx}`}
                                        sx={{
                                          width: 20,
                                          height: 20,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          overflow: 'hidden',
                                          borderRadius: '2px',
                                        }}
                                      >
                                        <FlagIcon
                                          countryCode={countryCode}
                                          size={18}
                                        />
                                      </Box>
                                    );
                                  })}
                                {(user.languagesKnown?.length ?? 0) > 2 && (
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '2px',
                                      bgcolor: 'action.hover',
                                    }}
                                  >
                                    <AddIcon
                                      sx={{
                                        fontSize: 14,
                                        color: 'text.secondary',
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>
                            )}

                            {/* Learning Languages */}
                            {hasLearningLanguages && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  justifyContent: 'center',
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontSize: '0.7rem' }}
                                >
                                  Learns:
                                </Typography>
                                {(user.languagesLearn ?? [])
                                  .slice(0, 2)
                                  .map((lang, idx) => {
                                    const countryCode =
                                      languageToCountryCode(lang.code) || 'US';
                                    return (
                                      <Box
                                        key={`learn-${lang.code}-${idx}`}
                                        sx={{
                                          width: 20,
                                          height: 20,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          overflow: 'hidden',
                                          borderRadius: '2px',
                                        }}
                                      >
                                        <FlagIcon
                                          countryCode={countryCode}
                                          size={18}
                                        />
                                      </Box>
                                    );
                                  })}
                                {(user.languagesLearn?.length ?? 0) > 2 && (
                                  <Box
                                    sx={{
                                      width: 20,
                                      height: 20,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '2px',
                                      bgcolor: 'action.hover',
                                    }}
                                  >
                                    <AddIcon
                                      sx={{
                                        fontSize: 14,
                                        color: 'text.secondary',
                                      }}
                                    />
                                  </Box>
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      })()}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            );
          })()}
        </Box>
      )}
    </Container>
  );
};

export default DiscoverPage;
