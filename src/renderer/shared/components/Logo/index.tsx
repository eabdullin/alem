import { Link } from "react-router-dom";

type LogoProps = {
  className?: string;
  dark?: boolean;
};

const Logo = ({ className, dark }: LogoProps) => (
  <Link className={`flex items-center gap-2 ${className}`} to="/">
    <img
      src="/icon.png"
      alt="Alem"
      className="w-8 h-8 rounded-lg object-contain shrink-0"
    />
    <span className="font-inter text-xl font-bold tracking-tight text-n-1">
      ALEM
    </span>
  </Link>
);

export default Logo;
