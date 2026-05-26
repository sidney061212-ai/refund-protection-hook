import { Composition } from "remotion";
import { RefundProtectionDemo } from "./RefundProtectionDemo";

export const RemotionRoot = () => {
  return (
    <Composition
      id="RefundProtectionDemo"
      component={RefundProtectionDemo}
      durationInFrames={2250}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
