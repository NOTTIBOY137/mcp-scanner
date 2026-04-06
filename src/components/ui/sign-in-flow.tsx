"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: Uniforms;
  maxFps?: number;
}

interface SignInPageProps {
  className?: string;
}

export const CanvasRevealEffect = ({
  animationSpeed = 10,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[0, 255, 255]],
  containerClassName,
  dotSize,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[0, 255, 255]]}
          dotSize={dotSize ?? 3}
          opacities={opacities ?? [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1]}
          shader={`${reverse ? "u_reverse_active" : "false"}_;animation_speed_factor_${animationSpeed.toFixed(1)}_;`}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      )}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[0, 0, 0]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [colors[0], colors[0], colors[0], colors[0], colors[0], colors[0]];
    if (colors.length === 2) {
      colorsArray = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];
    } else if (colors.length === 3) {
      colorsArray = [colors[0], colors[0], colors[1], colors[1], colors[2], colors[2]];
    }
    return {
      u_colors: { value: colorsArray.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]), type: "uniform3fv" },
      u_opacities: { value: opacities, type: "uniform1fv" },
      u_total_size: { value: totalSize, type: "uniform1f" },
      u_dot_size: { value: dotSize, type: "uniform1f" },
      u_reverse: { value: shader.includes("u_reverse_active") ? 1 : 0, type: "uniform1i" },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;
        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;
        out vec4 fragColor;
        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) { return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }
        void main() {
          vec2 st = fragCoord.xy;
          ${center.includes("x") ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));" : ""}
          ${center.includes("y") ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));" : ""}
          float opacity = step(0.0, st.x);
          opacity *= step(0.0, st.y);
          vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));
          float frequency = 5.0;
          float show_offset = random(st2);
          float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
          opacity *= u_opacities[int(rand * 10.0)];
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
          opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));
          vec3 color = u_colors[int(show_offset * 6.0)];
          float animation_speed_factor = 0.5;
          vec2 center_grid = u_resolution / 2.0 / u_total_size;
          float dist_from_center = distance(center_grid, st2);
          float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
          float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
          float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);
          float current_timing_offset;
          if (u_reverse == 1) {
            current_timing_offset = timing_offset_outro;
            opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
            opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
          } else {
            current_timing_offset = timing_offset_intro;
            opacity *= step(current_timing_offset, u_time * animation_speed_factor);
            opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
          }
          fragColor = vec4(color, opacity);
          fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

const ShaderMaterial = ({ source, uniforms, maxFps = 60 }: { source: string; hovered?: boolean; maxFps?: number; uniforms: Uniforms }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.ShaderMaterial;
    material.uniforms.u_time.value = clock.getElapsedTime();
  });

  const getUniforms = () => {
    const prepared: Record<string, { value: unknown; type?: string }> = {};
    for (const name in uniforms) {
      const u = uniforms[name];
      switch (u.type) {
        case "uniform1f": prepared[name] = { value: u.value, type: "1f" }; break;
        case "uniform1i": prepared[name] = { value: u.value, type: "1i" }; break;
        case "uniform3f": prepared[name] = { value: new THREE.Vector3().fromArray(u.value as number[]), type: "3f" }; break;
        case "uniform1fv": prepared[name] = { value: u.value, type: "1fv" }; break;
        case "uniform3fv": prepared[name] = { value: (u.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)), type: "3fv" }; break;
        case "uniform2f": prepared[name] = { value: new THREE.Vector2().fromArray(u.value as number[]), type: "2f" }; break;
      }
    }
    prepared["u_time"] = { value: 0, type: "1f" };
    prepared["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };
    return prepared;
  };

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        in vec2 coordinates;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main(){
          float x = position.x;
          float y = position.y;
          gl_Position = vec4(x, y, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }`,
      fragmentShader: source,
      uniforms: getUniforms() as Record<string, THREE.IUniform>,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, source]);

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

export const SignInPage = ({ className }: SignInPageProps) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setStep("code");
  };

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => codeInputRefs.current[0]?.focus(), 500);
    }
  }, [step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) codeInputRefs.current[index + 1]?.focus();
      if (index === 5 && value) {
        const isComplete = newCode.every((d) => d.length === 1);
        if (isComplete) {
          setReverseCanvasVisible(true);
          setTimeout(() => setInitialCanvasVisible(false), 50);
          setTimeout(() => setStep("success"), 2000);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  return (
    <div className={cn("flex w-full flex-col min-h-screen bg-black relative", className)}>
      {/* Background Canvas */}
      <div className="absolute inset-0 z-0">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-black"
              colors={[[255, 255, 255], [255, 255, 255]]}
              dotSize={6}
              reverse={false}
            />
          </div>
        )}
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-black"
              colors={[[255, 255, 255], [255, 255, 255]]}
              dotSize={6}
              reverse={true}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,1)_0%,_transparent_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Welcome</h1>
                  <p className="text-xl text-white/50 font-light">Sign in to MCP Scanner</p>
                </div>

                <div className="space-y-4">
                  <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full py-3 px-4 transition-colors backdrop-blur-sm cursor-pointer">
                    <span className="text-lg font-semibold">G</span>
                    <span>Sign in with Google</span>
                  </button>

                  <div className="flex items-center gap-4">
                    <div className="h-px bg-white/10 flex-1" />
                    <span className="text-white/40 text-sm">or</span>
                    <div className="h-px bg-white/10 flex-1" />
                  </div>

                  <form onSubmit={handleEmailSubmit}>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full backdrop-blur-sm text-white border border-white/10 rounded-full py-3 px-4 bg-transparent focus:outline-none focus:border-white/30 text-center"
                        required
                      />
                      <button
                        type="submit"
                        className="absolute right-1.5 top-1.5 text-white size-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                        aria-label="Submit email"
                      >
                        <span>→</span>
                      </button>
                    </div>
                  </form>
                </div>

                <p className="text-xs text-white/30 pt-8">
                  By signing in, you agree to our{" "}
                  <Link href="#" className="underline hover:text-white/50 transition-colors">Terms</Link> and{" "}
                  <Link href="#" className="underline hover:text-white/50 transition-colors">Privacy Policy</Link>.
                </p>
              </motion.div>
            ) : step === "code" ? (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.4 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold tracking-tight text-white">Check your email</h1>
                  <p className="text-lg text-white/50 font-light">Enter the verification code</p>
                </div>

                <div className="relative rounded-full py-4 px-5 border border-white/10">
                  <div className="flex items-center justify-center">
                    {code.map((digit, i) => (
                      <div key={i} className="flex items-center">
                        <div className="relative">
                          <input
                            ref={(el) => { codeInputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleCodeChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className="w-8 text-center text-xl bg-transparent text-white border-none focus:outline-none"
                            style={{ caretColor: "transparent" }}
                          />
                          {!digit && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className="text-xl text-white/20">0</span>
                            </div>
                          )}
                        </div>
                        {i < 5 && <span className="text-white/20 text-xl">|</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-white/40 hover:text-white/60 transition-colors cursor-pointer text-sm">
                  Resend code
                </p>

                <div className="flex w-full gap-3">
                  <button
                    onClick={handleBackClick}
                    className="rounded-full bg-white text-black font-medium px-6 py-3 hover:bg-white/90 transition-colors w-[30%] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    className={cn(
                      "flex-1 rounded-full font-medium py-3 border transition-all duration-300",
                      code.every((d) => d !== "")
                        ? "bg-white text-black border-transparent hover:bg-white/90 cursor-pointer"
                        : "bg-zinc-900 text-white/50 border-white/10 cursor-not-allowed"
                    )}
                    disabled={!code.every((d) => d !== "")}
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="space-y-6 text-center"
              >
                <div className="space-y-1">
                  <h1 className="text-4xl font-bold tracking-tight text-white">You&apos;re in!</h1>
                  <p className="text-lg text-white/50 font-light">Welcome to MCP Scanner</p>
                </div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="py-10"
                >
                  <div className="mx-auto size-16 rounded-full bg-gradient-to-br from-white to-white/70 flex items-center justify-center">
                    <svg className="size-8 text-black" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </motion.div>

                <Link
                  href="/dashboard"
                  className="block w-full rounded-full bg-white text-black font-medium py-3 hover:bg-white/90 transition-colors text-center"
                >
                  Continue to Dashboard
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
