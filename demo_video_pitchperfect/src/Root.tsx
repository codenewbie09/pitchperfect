import "./index.css";
import { Composition } from "remotion";
import { PitchPerfectDemo } from "./Composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PitchPerfectDemo"
      component={PitchPerfectDemo}
      durationInFrames={1698}
      fps={30}
      width={1280}
      height={720}
    />
  );
};
