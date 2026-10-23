import { Composition } from "remotion";
import { TOTAL_FRAMES, VantaExplainer } from "./VantaExplainer";
import { CRYPTO_TOTAL_FRAMES, VantaCryptoDemo } from "./VantaCryptoDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VantaExplainer"
        component={VantaExplainer}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VantaCryptoDemo"
        component={VantaCryptoDemo}
        durationInFrames={CRYPTO_TOTAL_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
