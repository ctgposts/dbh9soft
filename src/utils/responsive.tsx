import { ReactNode, useEffect, useState } from "react";

/**
 * Responsive utilities and components for better mobile UX
 */

// Hook to detect screen size
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    width: windowSize.width,
    height: windowSize.height,
  };
}

// Responsive container component
interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveContainer({
  children,
  className = "",
}: ResponsiveContainerProps) {
  return (
    <div
      className={`
        w-full
        px-3 sm:px-4 md:px-6 lg:px-8
        py-2 sm:py-3 md:py-4 lg:py-6
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Responsive grid component
interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: string;
  className?: string;
}

export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "gap-3 sm:gap-4 md:gap-6",
  className = "",
}: ResponsiveGridProps) {
  const gridColsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  };

  return (
    <div
      className={`
        grid
        ${gridColsMap[columns.mobile] || "grid-cols-1"}
        sm:${gridColsMap[columns.tablet] || "grid-cols-2"}
        md:${gridColsMap[columns.desktop] || "grid-cols-3"}
        ${gap}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Responsive text component
interface ResponsiveTextProps {
  children: ReactNode;
  sizes?: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  className?: string;
}

export function ResponsiveText({
  children,
  sizes = {
    mobile: "text-sm",
    tablet: "sm:text-base",
    desktop: "md:text-lg",
  },
  className = "",
}: ResponsiveTextProps) {
  return (
    <p className={`${sizes.mobile} ${sizes.tablet} ${sizes.desktop} ${className}`}>
      {children}
    </p>
  );
}
