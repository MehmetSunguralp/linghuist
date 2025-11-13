import ReactCountryFlag from 'react-country-flag';

interface FlagIconProps {
  countryCode: string | undefined;
  size?: number;
}

const FlagIcon: React.FC<FlagIconProps> = ({ countryCode, size = 20 }) => {
  if (!countryCode) {
    return null;
  }

  return (
    <ReactCountryFlag
      countryCode={countryCode}
      svg
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      title={countryCode}
    />
  );
};

export default FlagIcon;

