type GoogleLogoProps = {
  className?: string;
};

const GoogleLogo = ({ className }: GoogleLogoProps) => (
  <img
    src="/provider-logos/google.svg"
    alt="Google"
    className={`object-contain dark:invert-[.9] ${className ?? ""}`}
  />
);

export default GoogleLogo;
