import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const colors = {
  ink: "#071412",
  pine: "#102c24",
  mint: "#9bffd8",
  acid: "#d7ff5f",
  cream: "#fff9e6",
  coral: "#ff6f61",
  sky: "#87d7ff",
  slate: "rgba(255, 249, 230, 0.72)"
};

const scenes = [
  { start: 0, end: 8, eyebrow: "Hook the Future", title: "Refund Protection Hook", body: "A Uniswap v4 afterSwap hook for safer token launches on X Layer." },
  { start: 8, end: 18, eyebrow: "Problem", title: "Launch buyers need explicit downside terms", body: "Early pools often rely on social promises. This hook turns refund protection into an opt-in, capped, onchain right." },
  { start: 18, end: 31, eyebrow: "Mechanism", title: "Buyer pays premium. Vault locks coverage.", body: "The adapter reads the swap flow, records protected buys, collects a premium, and reserves the maximum payout." },
  { start: 31, end: 44, eyebrow: "Refund path", title: "Refund inside 24 hours", body: "The buyer returns launch tokens and receives the protected stable payout after a refund fee. Exposure closes immediately." },
  { start: 44, end: 56, eyebrow: "Finalize path", title: "No refund means reserve is released", body: "Expired orders finalize permissionlessly, freeing capital for the next protected launch." },
  { start: 56, end: 67, eyebrow: "Evidence", title: "Verified locally: compile, 20 tests, demo", body: "The repository includes v4 adapter deployment, CREATE2 hook mining, pool initialization, and a strict score gate." },
  { start: 67, end: 75, eyebrow: "Submission", title: "9.5+ path: add live X Layer Hook + Pool", body: "With verifiable X Layer addresses filled in, this becomes a contest-ready Uniswap v4 hook submission." }
];

const bullets = [
  "afterSwap opt-in protection",
  "premium + refund-fee economics",
  "per-order, per-user, vault exposure caps",
  "CREATE2 mined v4 hook address",
  "X Layer deployment scripts"
];

const proofLines = [
  "Compiled 24 source files",
  "20 passing tests",
  "refund path verified",
  "finalize path verified",
  "strict score gate: deployment required"
];

function fade(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
}

function useScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const second = frame / fps;
  const index = scenes.findIndex((scene) => second >= scene.start && second < scene.end);
  return { scene: scenes[index === -1 ? scenes.length - 1 : index], index: index === -1 ? scenes.length - 1 : index };
}

const Orb = ({ x, y, size, color, delay }: { x: number; y: number; size: number; color: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drift = Math.sin((frame / fps + delay) * 0.85) * 36;

  return (
    <div
      style={{
        position: "absolute",
        left: x + drift,
        top: y - drift * 0.45,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: "blur(28px)",
        opacity: 0.52
      }}
    />
  );
};

const Background = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(circle at 14% 12%, rgba(215,255,95,0.34), transparent 26%), radial-gradient(circle at 82% 8%, rgba(135,215,255,0.3), transparent 25%), linear-gradient(135deg, #071412 0%, #102c24 48%, #f0c85b 160%)",
      overflow: "hidden"
    }}
  >
    <Orb x={80} y={690} size={420} color="rgba(155,255,216,0.42)" delay={0} />
    <Orb x={1320} y={560} size={520} color="rgba(255,111,97,0.26)" delay={1.2} />
    <Orb x={1010} y={70} size={300} color="rgba(215,255,95,0.32)" delay={2.4} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage:
          "linear-gradient(rgba(255,249,230,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,249,230,0.05) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.1))"
      }}
    />
  </AbsoluteFill>
);

const SceneText = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { scene, index } = useScene();
  const localFrame = frame - scene.start * fps;
  const intro = fade(localFrame, 0, 22);
  const exit = interpolate(localFrame, [(scene.end - scene.start) * fps - 16, (scene.end - scene.start) * fps], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const opacity = intro * exit;

  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        top: 118,
        width: 920,
        opacity,
        transform: `translateY(${(1 - intro) * 34}px)`
      }}
    >
      <div
        style={{
          color: colors.acid,
          fontSize: 31,
          fontWeight: 800,
          letterSpacing: 8,
          textTransform: "uppercase"
        }}
      >
        {scene.eyebrow}
      </div>
      <div
        style={{
          color: colors.cream,
          fontSize: index === 0 ? 108 : 82,
          lineHeight: 0.95,
          fontWeight: 950,
          marginTop: 28,
          textWrap: "balance"
        }}
      >
        {scene.title}
      </div>
      <div
        style={{
          color: colors.slate,
          fontSize: 34,
          lineHeight: 1.35,
          marginTop: 32,
          maxWidth: 770
        }}
      >
        {scene.body}
      </div>
    </div>
  );
};

const MechanismCard = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = fade(frame, 14 * fps, 18 * fps);
  const progress = interpolate(frame, [18 * fps, 55 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  const steps = ["Swap", "Premium", "Coverage", "Refund", "Finalize"];

  return (
    <div
      style={{
        position: "absolute",
        right: 95,
        top: 138,
        width: 660,
        height: 680,
        borderRadius: 42,
        padding: 42,
        background: "rgba(7, 20, 18, 0.76)",
        border: "1px solid rgba(255,249,230,0.16)",
        boxShadow: "0 40px 120px rgba(0,0,0,0.34)",
        opacity: appear
      }}
    >
      <div style={{ color: colors.mint, fontSize: 31, fontWeight: 900 }}>Onchain flow</div>
      <div style={{ height: 460, position: "relative", marginTop: 34 }}>
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 26,
            bottom: 26,
            width: 5,
            borderRadius: 99,
            background: "rgba(255,249,230,0.16)"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 28,
            top: 26,
            height: 408 * progress,
            width: 5,
            borderRadius: 99,
            background: colors.acid
          }}
        />
        {steps.map((step, i) => {
          const active = progress >= i / (steps.length - 1) - 0.02;
          return (
            <div key={step} style={{ position: "absolute", top: i * 102, left: 0, display: "flex", alignItems: "center", gap: 28 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: active ? colors.acid : "rgba(255,249,230,0.13)",
                  color: colors.ink,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 950,
                  fontSize: 24
                }}
              >
                {i + 1}
              </div>
              <div>
                <div style={{ color: colors.cream, fontSize: 34, fontWeight: 850 }}>{step}</div>
                <div style={{ color: colors.slate, fontSize: 21, marginTop: 4 }}>{["afterSwap intent", "buyer pays reserve", "vault locks max payout", "tokens back, stable out", "unused exposure released"][i]}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProofPanel = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = fade(frame, 55 * fps, 58 * fps);

  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        bottom: 72,
        right: 95,
        height: 185,
        borderRadius: 34,
        background: "rgba(255,249,230,0.1)",
        border: "1px solid rgba(255,249,230,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        opacity
      }}
    >
      {proofLines.map((line, i) => (
        <div key={line} style={{ width: 300 }}>
          <div style={{ color: i === 4 ? colors.coral : colors.acid, fontSize: 42, fontWeight: 950 }}>{i === 4 ? "Gate" : "OK"}</div>
          <div style={{ color: colors.cream, fontSize: 25, lineHeight: 1.15, marginTop: 9 }}>{line}</div>
        </div>
      ))}
    </div>
  );
};

const BulletRail = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <div style={{ position: "absolute", left: 110, bottom: 96, display: "flex", gap: 18 }}>
      {bullets.map((bullet, i) => {
        const opacity = fade(frame, (3 + i * 0.45) * fps, (4 + i * 0.45) * fps);
        return (
          <div
            key={bullet}
            style={{
              opacity,
              borderRadius: 999,
              color: colors.cream,
              background: "rgba(255,249,230,0.12)",
              border: "1px solid rgba(255,249,230,0.18)",
              padding: "16px 22px",
              fontSize: 22,
              fontWeight: 750
            }}
          >
            {bullet}
          </div>
        );
      })}
    </div>
  );
};

const ScoreBadge = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = interpolate(frame, [66 * fps, 68 * fps], [0.86, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 96,
        bottom: 84,
        width: 420,
        height: 170,
        borderRadius: 38,
        background: colors.acid,
        color: colors.ink,
        padding: 30,
        transform: `scale(${scale})`,
        boxShadow: "0 30px 90px rgba(215,255,95,0.25)"
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3 }}>TARGET SCORE</div>
      <div style={{ fontSize: 74, fontWeight: 1000, lineHeight: 0.98 }}>9.5+</div>
      <div style={{ fontSize: 22, fontWeight: 760 }}>Requires live Hook + Pool links</div>
    </div>
  );
};

export const RefundProtectionDemo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const showProof = frame >= 55 * fps;
  const showScore = frame >= 66 * fps;

  return (
    <AbsoluteFill style={{ fontFamily: "Avenir Next, Trebuchet MS, sans-serif" }}>
      <Background />
      <Audio src={staticFile("narration.mp3")} volume={0.92} />
      <SceneText />
      <MechanismCard />
      {!showProof && <BulletRail />}
      {showProof && <ProofPanel />}
      {showScore && <ScoreBadge />}
      <div style={{ position: "absolute", top: 42, right: 84, color: colors.slate, fontSize: 24, fontWeight: 800 }}>
        X Layer Build X Hackathon
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, background: colors.acid, transform: `scaleX(${frame / (75 * fps)})`, transformOrigin: "left" }} />
    </AbsoluteFill>
  );
};
