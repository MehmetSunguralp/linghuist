import { Box, TextField } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { Field, useFormikContext } from 'formik';

interface AgeFieldProps {
  name?: string;
  showEditIcon?: boolean;
  fullWidth?: boolean;
  width?: number | string;
}

export const AgeField = ({
  name = 'age',
  showEditIcon = true,
  fullWidth = true,
  width,
}: AgeFieldProps) => {
  const { setFieldValue } = useFormikContext();

  return (
    <Field name={name}>
      {({ field, meta }: any) => (
        <Box
          sx={{
            position: 'relative',
            width: width || (fullWidth ? '100%' : 200),
          }}
        >
          <TextField
            {...field}
            label="Age"
            type="text"
            fullWidth={fullWidth}
            error={meta.touched && !!meta.error}
            helperText={meta.touched && meta.error}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              // Only allow digits
              if (value === '' || /^\d+$/.test(value)) {
                setFieldValue(name, value);
              }
            }}
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

