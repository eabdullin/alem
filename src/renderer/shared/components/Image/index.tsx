import { useState, ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};

const Image = ({ className, fill, priority, style, ...props }: ImageProps) => {
  const [loaded, setLoaded] = useState(false);

  const fillStyles: React.CSSProperties = fill
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }
    : {};

  return (
    <img
      className={`inline-block align-top opacity-0 transition-opacity ${
        loaded && "opacity-100"
      } ${className}`}
      onLoad={() => setLoaded(true)}
      loading={priority ? "eager" : "lazy"}
      style={{ ...fillStyles, ...style }}
      {...props}
    />
  );
};

export default Image;
