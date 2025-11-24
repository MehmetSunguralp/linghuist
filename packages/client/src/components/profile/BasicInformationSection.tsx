import { Box, Paper, Typography } from '@mui/material';
import { InfoOutline as InfoOutlineIcon } from '@mui/icons-material';
import { NameField } from './NameField';
import { UsernameField } from './UsernameField';
import { BioField } from './BioField';
import { CountryField } from './CountryField';
import { AgeField } from './AgeField';

interface BasicInformationSectionProps {
  showPaper?: boolean;
  showEditIcons?: boolean;
  gap?: number;
}

export const BasicInformationSection = ({
  showPaper = true,
  showEditIcons = true,
  gap = 3,
}: BasicInformationSectionProps) => {
  const content = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <InfoOutlineIcon color="primary" />
        <Typography variant="h5">Basic Information</Typography>
      </Box>
      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: gap, mt: 2 }}
      >
        <NameField showEditIcon={showEditIcons} />
        <UsernameField showEditIcon={showEditIcons} />
        <BioField showEditIcon={showEditIcons} />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <CountryField />
          <AgeField width={200} />
        </Box>
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

