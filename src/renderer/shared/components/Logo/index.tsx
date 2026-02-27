import { Link } from "react-router-dom";

type LogoProps = {
  className?: string;
  dark?: boolean;
};

const Logo = ({ className, dark }: LogoProps) => (
  <Link className={`flex items-center gap-2 ${className}`} to="/">
    <img
      src="./logo.horiz.png"
      alt="Qurt"
      className="h-14 w-auto rounded-lg object-contain shrink-0"
    />
  </Link>
);

export default Logo;
