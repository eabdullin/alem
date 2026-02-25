import OpenaiLogo from "./OpenaiLogo";
import AnthropicLogo from "./AnthropicLogo";
import GoogleLogo from "./GoogleLogo";
import MoonshotaiLogo from "./MoonshotaiLogo";
import XaiLogo from "./XaiLogo";

const PROVIDER_LOGOS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  openai: OpenaiLogo,
  anthropic: AnthropicLogo,
  google: GoogleLogo,
  moonshotai: MoonshotaiLogo,
  xai: XaiLogo,
};

type ProviderLogoProps = {
  providerId: string;
  className?: string;
};

const ProviderLogo = ({ providerId, className }: ProviderLogoProps) => {
  const LogoComponent = PROVIDER_LOGOS[providerId] ?? OpenaiLogo;
  return <LogoComponent className={className} />;
};

export default ProviderLogo;
export { OpenaiLogo, AnthropicLogo, GoogleLogo, MoonshotaiLogo, XaiLogo };
