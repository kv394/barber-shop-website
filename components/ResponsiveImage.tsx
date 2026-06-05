// components/ResponsiveImage.tsx
import Image, { ImageProps } from "next/image";

/**
 * Wrapper around Next.js Image that enforces explicit width/height (or fill)
 * and forwards any Tailwind / custom classes.
 *
 * Usage example:
 *   <ResponsiveImage
 *     src="/hero.jpg"
 *     alt="Hero background"
 *     width={1200}
 *     height={800}
 *     className="object-cover w-full h-full"
 *   />
 */
export const ResponsiveImage = ({
  src,
  alt,
  width,
  height,
  className,
  ...rest
}: ImageProps & { className?: string }) => {
  const fill = width === undefined && height === undefined;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={
        fill
          ? { objectFit: "cover", width: "100%", height: "100%" }
          : undefined
      }
      {...(fill ? { fill: true } : {})}
      {...rest}
    />
  );
};

export default ResponsiveImage;
