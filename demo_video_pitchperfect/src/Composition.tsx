import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { AbsoluteFill } from "remotion";
import { TitleCard } from "./components/TitleCard";
import { DashboardScene } from "./components/DashboardScene";
import { ChatScene } from "./components/ChatScene";
import { ScorecardScene } from "./components/ScorecardScene";
import { ReviewScene } from "./components/ReviewScene";
import { ShareScene } from "./components/ShareScene";
import { OutroScene } from "./components/OutroScene";

const fadeTransition = springTiming({ config: { damping: 200 }, durationInFrames: 20 });
const slideTransition = springTiming({ config: { damping: 200 }, durationInFrames: 22 });
const wipeTransition = springTiming({ config: { damping: 200 }, durationInFrames: 22 });

export const PitchPerfectDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a1628" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={150}>
          <TitleCard />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={fadeTransition} />

        <TransitionSeries.Sequence durationInFrames={300}>
          <DashboardScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={slideTransition} />

        <TransitionSeries.Sequence durationInFrames={360}>
          <ChatScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={wipe({ direction: "from-left" })} timing={wipeTransition} />

        <TransitionSeries.Sequence durationInFrames={300}>
          <ScorecardScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={slideTransition} />

        <TransitionSeries.Sequence durationInFrames={360}>
          <ReviewScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={fadeTransition} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <ShareScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition presentation={fade()} timing={fadeTransition} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
