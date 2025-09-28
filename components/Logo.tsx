import Image from "next/image";
import GlareHover from "./GlareHover";

export function Logo() {
  return (
    <div className="flex justify-center -mt-10">
      <GlareHover
        width="auto"
        height="auto"
        background="transparent"
        borderRadius="0px"
        borderColor="transparent"
        glareColor="#FFF6DF"
        glareOpacity={0.4}
        glareAngle={-28}
        glareSize={280}
        transitionDuration={700}
        className="p-0"
        style={{ border: "0" }}
      >
        <Image
          src={"logo_svg.svg"}
          alt="SparkBite Logo"
          width={500}
          height={200}
          priority
        />
      </GlareHover>
    </div>
  );
}
