import Image from "next/image";
import newLogo from "@/app/assets/logo_svg.svg";

export function Logo() {
  return (
    <div className="flex justify-center -mt-10">
      <Image
        src={newLogo}
        alt="SparkBite Logo"
        width={500} // adjust as needed
        height={200}
        priority
      />
    </div>
  );
}
