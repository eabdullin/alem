type AnthropicLogoProps = {
  className?: string;
};

const AnthropicLogo = ({ className }: AnthropicLogoProps) => (
  <img
    src="/provider-logos/anthropic.svg"
    alt="Anthropic"
    className={`object-contain dark:invert-[.9] ${className ?? ""}`}
  />
);

export default AnthropicLogo;
