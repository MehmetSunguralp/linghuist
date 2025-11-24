import { Box } from '@mui/material';
import { TextField } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { Field } from 'formik';

interface BioFieldProps {
  name?: string;
  showEditIcon?: boolean;
  fullWidth?: boolean;
  rows?: number;
}

export const BioField = ({
  name = 'bio',
  showEditIcon = true,
  fullWidth = true,
  rows = 4,
}: BioFieldProps) => {
  return (
    <Field name={name}>
      {({ field, meta }: any) => (
        <Box sx={{ position: 'relative' }}>
          <TextField
            {...field}
            label="Bio"
            placeholder="Tell us about yourself..."
            fullWidth={fullWidth}
            multiline
            rows={rows}
            error={meta.touched && !!meta.error}
            helperText={meta.touched && meta.error}
          />
          {showEditIcon && (
            <EditIcon
              sx={{
                position: 'absolute',
                right: 12,
                top: 24,
                fontSize: 18,
                color: 'action.active',
                pointerEvents: 'none',
              }}
            />
          )}
        </Box>
      )}
    </Field>
  );
};

