"use client";
import { useState, useRef, useCallback, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */
interface Params {
  blockSize: number;
  overlap: number;
  tolerance: number;
  outSize: number;
}


const PARAM_CONFIG = [
  { key: "blockSize", label: "Block Size", min: 20, max: 80, step: 2, unit: "px", decimals: 0, desc: "Patch dimensions" },
  { key: "overlap", label: "Overlap", min: 4, max: 20, step: 1, unit: "px", decimals: 0, desc: "Seam blend zone" },
  { key: "tolerance", label: "Tolerance", min: 0.05, max: 0.5, step: 0.05, unit: "", decimals: 2, desc: "Candidate spread" },
  { key: "outSize", label: "Output Size", min: 100, max: 400, step: 50, unit: "px", decimals: 0, desc: "Square output" },
] as const;

const STEPS = [
  { n: "01", title: "Patch Pool", body: "Every block_size² region in the source becomes a candidate patch." },
  { n: "02", title: "Overlap Match", body: "Candidates are ranked by L² error in the shared border with placed neighbors." },
  { n: "03", title: "Min-Cut Seam", body: "Dynamic programming traces the lowest-cost path through the error surface." },
  { n: "04", title: "Quilt", body: "Blocks are stitched along the seam — edges disappear, texture flows." },
];


export default function Home() {
  const [source, setSource] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [params, setParams] = useState<Params>({ blockSize: 40, overlap: 8, tolerance: 0.2, outSize: 200 });

  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const pickFile = (f: File) => {
    if (!f.type.startsWith("image/")) return;
    setFile(f); setSource(URL.createObjectURL(f));
    setResult(null); setDone(false); setError(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  const setParam = (k: keyof Params) => (v: number) =>
    setParams(p => ({ ...p, [k]: v }));

  const synthesize = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null); setDone(false);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("block_size", String(params.blockSize));
      form.append("overlap", String(params.overlap));
      form.append("tolerance", String(params.tolerance));
      form.append("out_h", String(params.outSize));
      form.append("out_w", String(params.outSize));
      const res = await fetch("https://image-quilting-lime.vercel.app/synthesize", { method: "POST", body: form });
      if (!res.ok) throw new Error("Backend error — is uvicorn running on :8000?");
      setResult(URL.createObjectURL(await res.blob()));
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (done && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [done]);

  return (
    <div style={{ position: "relative", zIndex: 1 }}>

      {/* ── MESH BACKGROUND BLOBS ── */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-10%", left: "-5%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(7,192,255,0.18) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: "-5%", right: "-8%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(103,108,213,0.15) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "45%", left: "40%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,158,232,0.1) 0%, transparent 70%)" }} />
      </div>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2.5rem", height: 58,
        background: "rgba(228,242,251,0.75)", backdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid rgba(0,158,232,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <GridMark />
          <span style={{
            fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 17,
            letterSpacing: "-0.5px", color: "var(--ink)"
          }}>
            Quilt<span style={{ color: "var(--blue)" }}>Synth</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Pill text="Efros & Freeman · 2001" />
          <Pill text="FastAPI + Next.js" accent />
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "5rem 2.5rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: "1.25rem",
            background: "var(--violet-pale)", padding: "5px 14px 5px 8px", borderRadius: 999,
            border: "1px solid rgba(103,108,213,0.2)"
          }}>
            <span style={{
              display: "inline-block", width: 7, height: 7, borderRadius: "50%",
              background: "var(--violet)", animation: "floatDot 2s ease-in-out infinite"
            }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--violet)", letterSpacing: "0.04em" }}>
              Classical Computer Vision Algorithm
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: "clamp(2.8rem,5vw,4rem)",
            lineHeight: 1.08, letterSpacing: "-2px", color: "var(--ink)", marginBottom: "1.25rem",
          }}>
            Texture synthesis<br />
            <span style={{
              background: "linear-gradient(100deg, var(--blue), var(--violet))",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "gradShift 4s ease infinite",
            }}>
              by quilting.
            </span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-3)", lineHeight: 1.75, maxWidth: 480, margin: "0 auto" }}>
            Upload any texture. The algorithm stitches overlapping patches with
            minimum-error seam cuts — producing seamless, infinite-feeling results.
            No ML. No GPU. Pure math.
          </p>
        </div>

        {/* Algorithm steps */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginTop: "3rem" }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{
              background: "var(--card)", backdropFilter: "blur(16px)",
              border: "1px solid var(--border)", borderRadius: 16,
              padding: "1.25rem", position: "relative", overflow: "hidden",
              transition: "transform .2s, box-shadow .2s",
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,120,200,0.12)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "none";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div style={{
                position: "absolute", top: 12, right: 14,
                fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 32,
                color: i % 2 === 0 ? "rgba(0,158,232,0.07)" : "rgba(103,108,213,0.07)",
                lineHeight: 1, userSelect: "none"
              }}>
                {s.n}
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 8, marginBottom: 12,
                background: i % 2 === 0
                  ? "linear-gradient(135deg, var(--blue-light), var(--blue))"
                  : "linear-gradient(135deg, #8e92e0, var(--violet))",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                <StepIcon i={i} />
              </div>
              <p style={{
                fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 13,
                color: "var(--ink)", marginBottom: 5
              }}>{s.title}</p>
              <p style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.65 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STUDIO ── */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem 6rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.5rem", alignItems: "stretch" }}>

          {/* ══ CONTROLS ══ */}
          <div style={{
            display: "flex", flexDirection: "column",
            background: "var(--card)", backdropFilter: "blur(20px)",
            border: "1px solid var(--border-md)", borderRadius: 14,
            overflow: "hidden", position: "sticky", top: 74,
            boxShadow: "0 8px 40px rgba(0,120,200,0.1)",
          }}>
            {/* Terminal titlebar — left */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              padding: "11px 16px", borderBottom: "1px solid var(--border)",
              background: "var(--bg-alt)",
            }}>
              {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.85 }} />
              ))}
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
                color: "var(--ink-4)", fontFamily: "monospace",
              }}>~ / controls</span>
            </div>
            {/* Scrollable inner content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem", overflowY: "auto" }}>

              {/* Upload */}
              <Panel>
                <SectionLabel text="Source Texture" />
                <div
                  onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onClick={() => inputRef.current?.click()}
                  style={{
                    position: "relative", borderRadius: 12, cursor: "pointer", overflow: "hidden",
                    border: `2px dashed ${drag ? "var(--blue)" : "var(--border-md)"}`,
                    background: drag ? "rgba(7,192,255,0.06)" : "rgba(255,255,255,0.5)",
                    transition: "all .15s",
                    minHeight: source ? 0 : 148,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {source ? (
                    <>
                      <img src={source} alt="src" style={{
                        width: "100%", display: "block", maxHeight: 200, objectFit: "cover",
                      }} />
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(11,34,54,0)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        opacity: 0, transition: "all .2s",
                        fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600,
                        fontSize: 13, color: "white", letterSpacing: "0.02em",
                      }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.opacity = "1";
                          (e.currentTarget as HTMLElement).style.background = "rgba(11,34,54,0.55)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.opacity = "0";
                          (e.currentTarget as HTMLElement).style.background = "rgba(11,34,54,0)";
                        }}
                      >
                        Change image
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
                      <UploadIcon />
                      <p style={{ marginTop: 10, fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>
                        Drop image <span style={{ color: "var(--ink-4)" }}>or</span>{" "}
                        <span style={{ color: "var(--blue)", fontWeight: 600 }}>browse</span>
                      </p>
                      <p style={{ marginTop: 4, fontSize: 11, color: "var(--ink-4)" }}>
                        JPG · PNG · any texture
                      </p>
                    </div>
                  )}
                </div>
                <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])} />
              </Panel>

              {/* Params */}
              <Panel>
                <SectionLabel text="Parameters" />
                <div style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}>
                  {PARAM_CONFIG.map(({ key: paramKey, ...cfg }) => (
                    <SliderRow
                      key={paramKey}
                      label={cfg.label}
                      min={cfg.min}
                      max={cfg.max}
                      step={cfg.step}
                      unit={cfg.unit}
                      decimals={cfg.decimals}
                      desc={cfg.desc}
                      value={params[paramKey as keyof Params]}
                      onChange={setParam(paramKey as keyof Params)}
                    />
                  ))}
                </div>
              </Panel>

              {/* Button */}
              <button
                onClick={synthesize}
                disabled={!file || loading}
                style={{
                  width: "100%", padding: "15px 0", borderRadius: 12, border: "none",
                  background: !file || loading
                    ? "rgba(0,0,0,0.07)"
                    : "linear-gradient(135deg, var(--blue-light) 0%, var(--blue) 45%, var(--violet) 100%)",
                  backgroundSize: !file || loading ? "auto" : "200% auto",
                  color: !file || loading ? "var(--ink-4)" : "white",
                  fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px",
                  cursor: !file || loading ? "not-allowed" : "pointer",
                  transition: "all .2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                  boxShadow: !file || loading ? "none" : "0 6px 24px rgba(0,120,200,0.35)",
                  fontFamily: "'Bricolage Grotesque',sans-serif",
                  animation: !file || loading ? "none" : "gradShift 3s ease infinite",
                }}
                onMouseEnter={e => {
                  if (!file || loading) return;
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(0,120,200,0.5)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(0,120,200,0.35)";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                {loading ? <><SpinIcon /> Quilting…</> : "Run Synthesis →"}
              </button>

              {error && (
                <div style={{
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.2)"
                }}>
                  <p style={{ fontSize: 12, color: "#b91c1c", lineHeight: 1.6 }}>{error}</p>
                </div>
              )}
            </div>{/* end inner scroll */}
          </div>{/* end terminal left */}

          {/* ══ OUTPUT ══ */}
          <div ref={resultRef} style={{
            display: "flex", flexDirection: "column",
            background: "var(--card)", backdropFilter: "blur(20px)",
            border: "1px solid var(--border-md)", borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 8px 40px rgba(0,120,200,0.1)",
          }}>
            {/* Terminal titlebar — right */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              padding: "11px 16px", borderBottom: "1px solid var(--border)",
              background: "var(--bg-alt)",
            }}>
              {["#ff5f57", "#febc2e", "#28c840"].map(c => (
                <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: 0.85 }} />
              ))}
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 500, letterSpacing: "0.04em",
                color: "var(--ink-4)", fontFamily: "monospace",
              }}>~ / canvas</span>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {loading ? (
                <LoadingState />
              ) : result ? (
                <div style={{ animation: "fadeUp .4s ease", flex: 1 }}>
                  {/* Images side by side */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", flex: 1 }}>
                    <div style={{ borderRight: "1px solid var(--border)" }}>
                      <div style={{
                        padding: "10px 16px", borderBottom: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.4)"
                      }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                          color: "var(--ink-3)", textTransform: "uppercase", fontFamily: "monospace"
                        }}>original.png</span>
                      </div>
                      <img src={source!} alt="original" style={{
                        width: "100%", display: "block",
                        maxHeight: 480, objectFit: "cover",
                      }} />
                    </div>
                    <div>
                      <div style={{
                        padding: "10px 16px", borderBottom: "1px solid rgba(0,158,232,0.2)",
                        background: "rgba(0,158,232,0.06)", display: "flex", alignItems: "center", gap: 7
                      }}>
                        <span style={{
                          display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                          background: "var(--blue)", boxShadow: "0 0 0 3px rgba(7,192,255,0.2)"
                        }} />
                        <span style={{
                          fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                          color: "var(--blue)", textTransform: "uppercase", fontFamily: "monospace"
                        }}>result.png</span>
                      </div>
                      <img src={result} alt="result" style={{
                        width: "100%", display: "block",
                        maxHeight: 480, objectFit: "cover",
                      }} />
                    </div>
                  </div>
                  {/* Meta strip */}
                  <div style={{
                    padding: "0.85rem 1.25rem", borderTop: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.4)", display: "flex",
                    alignItems: "center", gap: 8, flexWrap: "wrap",
                    justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "var(--ink-3)", marginRight: 2, fontFamily: "monospace" }}>
                        params:
                      </span>
                      {[
                        `block=${params.blockSize}px`,
                        `overlap=${params.overlap}px`,
                        `α=${params.tolerance.toFixed(2)}`,
                        `${params.outSize}×${params.outSize}`,
                      ].map(t => (
                        <span key={t} style={{
                          fontSize: 11, padding: "2px 10px", borderRadius: 6,
                          background: "var(--blue-pale)", color: "var(--ink-2)",
                          border: "1px solid rgba(0,158,232,0.2)", fontWeight: 500, fontFamily: "monospace"
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <a href={result} download="quilted-texture.png" style={{
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 12, fontWeight: 600, color: "var(--blue)",
                      textDecoration: "none", padding: "5px 12px", borderRadius: 8,
                      background: "rgba(0,158,232,0.1)", border: "1px solid rgba(0,158,232,0.25)",
                      transition: "all .15s",
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,158,232,0.2)"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(0,158,232,0.1)"}
                    >
                      <DownIcon /> Download PNG
                    </a>
                  </div>
                </div>
              ) : (
                <EmptyCanvas hasSource={!!source} />
              )}
            </div>{/* end flex wrapper */}
          </div>{/* end terminal right */}
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.6)",
      border: "1px solid var(--border)", borderRadius: 10, padding: "1.1rem",
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
      color: "var(--ink-4)", marginBottom: "0.9rem", fontFamily: "monospace"
    }}>
      {text}
    </p>
  );
}

function SliderRow({ label, value, min, max, step, unit, decimals, desc, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; decimals: number; desc: string; onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", display: "block", lineHeight: 1 }}>
            {label}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2, display: "block" }}>{desc}</span>
        </div>
        <span style={{
          fontSize: 13, fontWeight: 600, color: "var(--blue)",
          background: "rgba(0,158,232,0.08)", padding: "2px 10px", borderRadius: 6,
          fontVariantNumeric: "tabular-nums", border: "1px solid rgba(0,158,232,0.15)",
          minWidth: 52, textAlign: "center",
        }}>
          {value.toFixed(decimals)}{unit}
        </span>
      </div>
      <div style={{ position: "relative", height: 3 }}>
        <div style={{ position: "absolute", inset: 0, background: "var(--blue-pale)", borderRadius: 2 }} />
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`,
          background: `linear-gradient(90deg, var(--blue-light), var(--blue))`,
          borderRadius: 2, transition: "width .1s"
        }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute", inset: 0, opacity: 0, width: "100%",
            height: "100%", cursor: "pointer", margin: 0
          }} />
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: 16, height: 16, borderRadius: "50%",
          background: "white", border: "2.5px solid var(--blue)",
          boxShadow: "0 2px 8px rgba(0,120,200,0.3)",
          pointerEvents: "none", transition: "left .1s",
        }} />
      </div>
    </div>
  );
}

function EmptyCanvas({ hasSource }: { hasSource: boolean }) {
  return (
    <div style={{
      flex: 1, minHeight: 480, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      {/* Quilt grid illustration */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, opacity: 0.35 }}>
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} style={{
            width: 44, height: 44, borderRadius: 6,
            background: [
              "linear-gradient(135deg,var(--blue-light),var(--blue))",
              "linear-gradient(135deg,#8e92e0,var(--violet))",
              "linear-gradient(135deg,var(--blue-pale),var(--blue-light))",
              "linear-gradient(135deg,var(--violet-pale),#8e92e0)",
              "rgba(0,158,232,0.15)",
            ][i % 5],
            animation: `floatDot ${1.5 + (i % 5) * 0.15}s ease-in-out infinite`,
            animationDelay: `${(i * 0.08).toFixed(2)}s`,
          }} />
        ))}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontWeight: 600, fontSize: 15,
          color: "var(--ink-2)", marginBottom: 6
        }}>
          {hasSource ? "Ready to synthesize" : "Your canvas awaits"}
        </p>
        <p style={{ fontSize: 12, color: "var(--ink-4)", lineHeight: 1.6, fontFamily: "monospace" }}>
          {hasSource
            ? "$ run synthesis →"
            : "$ upload texture to begin"}
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{
      background: "var(--card)", backdropFilter: "blur(20px)",
      border: "1px solid rgba(0,158,232,0.2)", borderRadius: 20, overflow: "hidden",
    }}>
      {/* Fake header */}
      <div style={{
        padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)",
        background: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 10
      }}>
        {["#ff5f57", "#febc2e", "#28c840"].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
        ))}
        <div style={{
          height: 10, width: 120, borderRadius: 5,
          background: "linear-gradient(90deg, var(--bg-alt) 25%, var(--blue-pale) 50%, var(--bg-alt) 75%)",
          backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite"
        }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 440 }}>
        {[0, 1].map(i => (
          <div key={i} style={{ borderRight: i === 0 ? "1px solid var(--border)" : "none" }}>
            <div style={{
              height: 36, borderBottom: "1px solid var(--border)",
              background: "rgba(255,255,255,0.3)"
            }} />
            <div style={{
              position: "relative", overflow: "hidden", height: 404,
              background: "linear-gradient(90deg, var(--bg-alt) 25%, var(--blue-pale) 50%, var(--bg-alt) 75%)",
              backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite",
              animationDelay: i === 1 ? ".2s" : "0s"
            }}>
              {i === 1 && (
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: "rgba(0,158,232,0.12)", display: "flex",
                    alignItems: "center", justifyContent: "center"
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"
                      style={{ animation: "spin 1.2s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                  </div>
                  <p style={{
                    fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 600, fontSize: 13,
                    color: "var(--blue)"
                  }}>Quilting patches…</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */
function GridMark() {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: "linear-gradient(135deg,var(--blue-light),var(--blue))",
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5px", padding: 6
    }}>
      {[1, .5, .5, 1].map((o, i) => (
        <div key={i} style={{ background: "white", borderRadius: 1, opacity: o }} />
      ))}
    </div>
  );
}
function Pill({ text, accent = false }: { text: string; accent?: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: "4px 12px", borderRadius: 999,
      color: accent ? "var(--blue)" : "var(--ink-3)",
      background: accent ? "rgba(7,192,255,0.1)" : "rgba(255,255,255,0.6)",
      border: `1px solid ${accent ? "rgba(0,158,232,0.25)" : "var(--border)"}`,
      letterSpacing: "0.02em",
    }}>{text}</span>
  );
}
function UploadIcon() {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12, margin: "0 auto",
      background: "linear-gradient(135deg,rgba(7,192,255,0.15),rgba(0,158,232,0.08))",
      display: "flex", alignItems: "center", justifyContent: "center",
      border: "1px solid rgba(0,158,232,0.2)"
    }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    </div>
  );
}
function DownIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
function SpinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: "spin .8s linear infinite" }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
function StepIcon({ i }: { i: number }) {
  const icons = [
    <><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></>,
    <><path d="M3 12h18M3 6h18M3 18h18" /></>,
    <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></>,
    <><polyline points="20 6 9 17 4 12" /></>,
  ];
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[i]}
    </svg>
  );
}