import Image from "next/image";

export function Logo() {
  return (
    <div className="flex justify-center -mt-15">
      <Image
        src="/sparkbite-logo.svg"
        alt="SparkBite Logo"
        width={600} // adjust as needed
        height={620}
        priority
      />
    </div>
  );
}
