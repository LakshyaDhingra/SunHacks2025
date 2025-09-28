export function Logo() {
  return (
    <div className="flex justify-center">
      <img
        src="/logo_svg.svg"
        alt="SparkBite Logo"
        className="h-24 md:h-32 lg:h-40 w-auto select-none"
        decoding="async"
        loading="eager"
      />
    </div>
  );
}
