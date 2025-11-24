import { Box } from '@mui/material';
import { TextField } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { Field } from 'formik';

interface NameFieldProps {
  name?: string;
  showEditIcon?: boolean;
  fullWidth?: boolean;
}

export const NameField = ({
  name = 'name',
  showEditIcon = true,
  fullWidth = true,
}: NameFieldProps) => {
  return (
    <Field name={name}>
      {({ field, meta }: any) => (
        <Box sx={{ position: 'relative' }}>
          <TextField
            {...field}
            label="Name"
            placeholder="Your full name (Only visible to you)"
            fullWidth={fullWidth}
            error={meta.touched && !!meta.error}
            helperText={meta.touched && meta.error}
          />
          {showEditIcon && (
            <EditIcon
              sx={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
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

