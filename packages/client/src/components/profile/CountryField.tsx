import { Box, Typography, FormControl, InputLabel, MenuItem } from '@mui/material';
import { OutlinedInput } from '@mui/material';
import { Field } from 'formik';
import { Select } from '@mui/material';
import FlagIcon from '@/components/FlagIcon';
import { COUNTRIES } from '@/utils/languages';

interface CountryFieldProps {
  name?: string;
  fullWidth?: boolean;
}

export const CountryField = ({
  name = 'country',
  fullWidth = true,
}: CountryFieldProps) => {
  return (
    <Field name={name}>
      {({ field, meta }: any) => (
        <FormControl fullWidth={fullWidth} error={meta.touched && !!meta.error}>
          <InputLabel>Country</InputLabel>
          <Select
            {...field}
            label="Country"
            input={<OutlinedInput label="Country" />}
          >
            {COUNTRIES.map((code: string) => (
              <MenuItem key={code} value={code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FlagIcon countryCode={code} size={16} />
                  <Typography>
                    {typeof window !== 'undefined'
                      ? new Intl.DisplayNames(['en'], {
                          type: 'region',
                        }).of(code)
                      : code}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Field>
  );
};

