type OpenaiLogoProps = {
  className?: string;
};

const OpenaiLogo = ({ className }: OpenaiLogoProps) => (
  <img
    src="/provider-logos/openai.svg"
    alt="OpenAI"
    className={`object-contain dark:invert-[.9] ${className ?? ""}`}
  />
);

export default OpenaiLogo;
