type XaiLogoProps = {
  className?: string;
};

const XaiLogo = ({ className }: XaiLogoProps) => (
  <img
    src="./provider-logos/xai.svg"
    alt="xAI"
    className={`object-contain dark:invert-[.9] ${className ?? ""}`}
  />
);

export default XaiLogo;
