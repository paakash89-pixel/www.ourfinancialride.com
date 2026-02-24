import Image from "next/image";

export function BrandMark({
  compact = false,
  showDescriptor = true,
  iconSrc = "/brand/ofr-mark-square.png"
}: {
  compact?: boolean;
  showDescriptor?: boolean;
  iconSrc?: string;
}) {
  const logoSize = compact ? 32 : 40;

  return (
    <div className={`flex items-center ${compact ? "gap-2" : "gap-2.5"}`}>
      <Image
        src={iconSrc}
        alt="OFR — Our Financial Ride"
        width={logoSize}
        height={logoSize}
        className={compact ? "h-8 w-8" : "h-10 w-10"}
      />
      <div className="leading-none">
        <p
          className={`font-semibold uppercase tracking-[0.22em] text-slateBlue-800 ${
            compact ? "text-[11px]" : "text-sm"
          }`}
        >
          OFR
        </p>
        {showDescriptor ? (
          <p
            className={`mt-1 uppercase tracking-[0.14em] text-slateBlue-500 ${
              compact ? "text-[7px]" : "text-[9px]"
            }`}
          >
            Our Financial Ride
          </p>
        ) : null}
      </div>
    </div>
  );
}
