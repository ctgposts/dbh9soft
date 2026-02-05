import { useState, useEffect, useRef } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
  onLoad?: () => void;
  width?: string | number;
  height?: string | number;
  blur?: boolean;
}

/**
 * Lazy loading image component with blur-up effect
 * Loads low-quality placeholder first, then high-quality image
 */
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = "",
  placeholderClassName = "",
  onLoad,
  width,
  height,
  blur = true,
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Use Intersection Observer for lazy loading
    if (!imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "50px", // Start loading 50px before image comes into view
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      {/* Placeholder - blurred tiny image */}
      {isLoading && blur && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse ${placeholderClassName}`}
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23e5e7eb" width="100" height="100"/></svg>')`,
            backgroundSize: "cover",
          }}
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={handleImageLoad}
        loading="lazy"
      />
    </div>
  );
};

/**
 * Responsive lazy image with srcset support
 */
interface ResponsiveImageProps extends Omit<LazyImageProps, "src"> {
  srcSet: {
    mobile: string;
    tablet?: string;
    desktop: string;
  };
}

export const ResponsiveLazyImage: React.FC<ResponsiveImageProps> = ({
  alt,
  srcSet,
  className = "",
  ...props
}) => {
  const [screenSize, setScreenSize] = useState<"mobile" | "tablet" | "desktop">(
    "desktop"
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize("mobile");
      } else if (width < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const src =
    screenSize === "mobile"
      ? srcSet.mobile
      : screenSize === "tablet"
        ? srcSet.tablet || srcSet.desktop
        : srcSet.desktop;

  return (
    <LazyImage src={src} alt={alt} className={className} {...props} />
  );
};

/**
 * Image gallery with lazy loading
 */
interface ImageGalleryProps {
  images: Array<{ src: string; alt: string }>;
  className?: string;
  columns?: number;
}

export const LazyImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  className = "gap-4",
  columns = 3,
}) => {
  return (
    <div
      className={`grid ${`grid-cols-${columns}`} ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {images.map((image, index) => (
        <LazyImage
          key={index}
          src={image.src}
          alt={image.alt}
          className="rounded-lg overflow-hidden"
          height={300}
        />
      ))}
    </div>
  );
};

/**
 * Background image lazy loader
 */
interface LazyBackgroundProps {
  src: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export const LazyBackground: React.FC<LazyBackgroundProps> = ({
  src,
  children,
  className = "",
  isLoading = false,
}) => {
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => setBackgroundLoaded(true);
            img.src = src;
          }
        });
      },
      { rootMargin: "50px" }
    );

    observer.observe(divRef.current);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div
      ref={divRef}
      className={`transition-opacity duration-300 ${className}`}
      style={{
        backgroundImage: backgroundLoaded ? `url('${src}')` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        opacity: isLoading || !backgroundLoaded ? 0.8 : 1,
      }}
    >
      {children}
    </div>
  );
};
