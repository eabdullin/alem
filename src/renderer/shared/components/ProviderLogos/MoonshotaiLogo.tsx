type MoonshotaiLogoProps = {
  className?: string;
};

const MoonshotaiLogo = ({ className }: MoonshotaiLogoProps) => (
  <img
    src="/provider-logos/moonshotai.png"
    alt="Moonshot AI"
    className={`object-contain invert-[.9] ${className ?? ""}`}
  />
);

export default MoonshotaiLogo;
