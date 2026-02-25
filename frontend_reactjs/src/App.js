import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

function parseJsonEnv(envValue, fallback) {
  try {
    if (!envValue) return fallback;
    return JSON.parse(envValue);
  } catch {
    return fallback;
  }
}

function safeUrl(value, fallback) {
  if (!value) return fallback;
  try {
    // Ensure it's a valid absolute URL; if not, just return fallback.
    // This prevents the UI from rendering broken anchors.
    // eslint-disable-next-line no-new
    new URL(value);
    return value;
  } catch {
    return fallback;
  }
}

/**
 * PUBLIC_INTERFACE
 * Main application component.
 * Renders a step-by-step wizard UI for generating a TEEOS-enabled Raspberry Pi 4 image,
 * with a step navigation sidebar and a content area showing instructions and status.
 */
function App() {
  const [activeStepId, setActiveStepId] = useState("overview");
  const [completed, setCompleted] = useState(() => new Set());

  const featureFlags = useMemo(() => {
    // Optional: allow the backend/orchestrator to toggle UI features via JSON.
    // Example: REACT_APP_FEATURE_FLAGS='{"showAdvanced":true}'
    return parseJsonEnv(process.env.REACT_APP_FEATURE_FLAGS, {});
  }, []);

  const experimentsEnabled = useMemo(() => {
    return String(process.env.REACT_APP_EXPERIMENTS_ENABLED || "").toLowerCase() === "true";
  }, []);

  const steps = useMemo(() => {
    const backendUrl = safeUrl(process.env.REACT_APP_BACKEND_URL, "");
    const apiBase = safeUrl(process.env.REACT_APP_API_BASE, "");
    const wsUrl = safeUrl(process.env.REACT_APP_WS_URL, "");
    const frontendUrl = safeUrl(process.env.REACT_APP_FRONTEND_URL, "");

    const baseSteps = [
      {
        id: "overview",
        title: "Overview",
        badge: "Start",
        description: "What you’ll build and what you’ll need.",
        sections: [
          {
            heading: "Goal",
            body: (
              <>
                <p>
                  This wizard guides you through generating a <strong>TEEOS-enabled Raspberry Pi 4 image</strong>.
                  You’ll prepare a build environment, fetch sources, build the image, then flash and validate it on
                  hardware.
                </p>
              </>
            ),
          },
          {
            heading: "Recommended prerequisites",
            body: (
              <ul className="List">
                <li>Raspberry Pi 4 (2GB+ recommended), power supply, and microSD card (16GB+).</li>
                <li>A Linux workstation (or WSL2) with Git, Docker (optional), and sufficient disk space (20GB+).</li>
                <li>Stable internet connection for source downloads.</li>
              </ul>
            ),
          },
        ],
        tips: [
          "If you’re new to Pi imaging, read the “Flash & boot” step first so you know what the output should look like.",
          "Keep your microSD card reader handy; you’ll use it near the end.",
        ],
        links: [
          frontendUrl
            ? { label: "Frontend URL", href: frontendUrl }
            : null,
          backendUrl
            ? { label: "Backend URL", href: backendUrl }
            : null,
        ].filter(Boolean),
      },
      {
        id: "setup",
        title: "Set up environment",
        description: "Prepare your build machine for image generation.",
        sections: [
          {
            heading: "Install base tools",
            body: (
              <>
                <p>Ensure the following are installed:</p>
                <ul className="List">
                  <li>git</li>
                  <li>build-essential / make</li>
                  <li>Python 3</li>
                  <li>curl / wget</li>
                </ul>
                <div className="CodeBlock" role="region" aria-label="Example commands">
                  <pre>
                    <code>{`# Example (Debian/Ubuntu)
sudo apt update
sudo apt install -y git build-essential python3 curl`}</code>
                  </pre>
                </div>
              </>
            ),
          },
          {
            heading: "Directory layout",
            body: (
              <>
                <p>Create a dedicated workspace directory for reproducibility:</p>
                <div className="CodeBlock" role="region" aria-label="Workspace commands">
                  <pre>
                    <code>{`mkdir -p ~/teeos-rpi4
cd ~/teeos-rpi4`}</code>
                  </pre>
                </div>
              </>
            ),
          },
        ],
        tips: ["Avoid building on low-storage devices; compilation and artifacts can grow quickly."],
        links: apiBase ? [{ label: "API Base", href: apiBase }] : [],
      },
      {
        id: "sources",
        title: "Get sources",
        description: "Clone repositories and fetch dependencies.",
        sections: [
          {
            heading: "Clone the image builder repo",
            body: (
              <>
                <p>Clone your TEEOS-enabled image builder sources:</p>
                <div className="CodeBlock" role="region" aria-label="Clone commands">
                  <pre>
                    <code>{`git clone <YOUR_REPO_URL_HERE> teeos-image-builder
cd teeos-image-builder`}</code>
                  </pre>
                </div>
                <p className="Muted">
                  Replace <code>&lt;YOUR_REPO_URL_HERE&gt;</code> with the correct repository URL.
                </p>
              </>
            ),
          },
          {
            heading: "Sync dependencies",
            body: (
              <>
                <p>Follow the repository’s instructions to fetch submodules/dependencies:</p>
                <div className="CodeBlock" role="region" aria-label="Dependencies commands">
                  <pre>
                    <code>{`git submodule update --init --recursive
# or follow the repo's dependency bootstrap script`}</code>
                  </pre>
                </div>
              </>
            ),
          },
        ],
        tips: ["If a fetch fails, retry after checking connectivity and proxy settings."],
      },
      {
        id: "configure",
        title: "Configure build",
        description: "Select Pi 4 target options and TEEOS settings.",
        sections: [
          {
            heading: "Choose target: Raspberry Pi 4",
            body: (
              <>
                <p>
                  Confirm the build configuration is targeting <strong>Raspberry Pi 4 (arm64)</strong> and that TEEOS
                  components are enabled.
                </p>
                <div className="InfoBanner">
                  <div className="InfoBannerIcon" aria-hidden="true">
                    i
                  </div>
                  <div>
                    <div className="InfoBannerTitle">Tip</div>
                    <div className="InfoBannerText">
                      Prefer config files committed to source control so the build is reproducible.
                    </div>
                  </div>
                </div>
              </>
            ),
          },
          ...(featureFlags.showAdvanced || experimentsEnabled
            ? [
                {
                  heading: "Advanced options (optional)",
                  body: (
                    <>
                      <ul className="List">
                        <li>Enable verbose logs for debugging</li>
                        <li>Pin exact dependency versions</li>
                        <li>Configure a local cache for downloads</li>
                      </ul>
                    </>
                  ),
                },
              ]
            : []),
        ],
        tips: ["If available, use a config preset for 'rpi4-teeos' to avoid manual mistakes."],
      },
      {
        id: "build",
        title: "Build image",
        badge: "Core",
        description: "Run the build and watch progress.",
        sections: [
          {
            heading: "Run the build command",
            body: (
              <>
                <p>
                  Start the image build process using your project’s documented build entrypoint (Makefile, script, or
                  container build).
                </p>
                <div className="CodeBlock" role="region" aria-label="Build commands">
                  <pre>
                    <code>{`# Example patterns (choose the one your repo supports)
make image
# or
./build.sh --target rpi4 --enable-teeos`}</code>
                  </pre>
                </div>
              </>
            ),
          },
          {
            heading: "Expected output",
            body: (
              <ul className="List">
                <li>A final disk image file (e.g., <code>.img</code> or compressed <code>.img.xz</code>)</li>
                <li>Build logs (save them for debugging)</li>
              </ul>
            ),
          },
        ],
        tips: ["First build can take a while. Avoid interrupting unless stuck for a long time."],
      },
      {
        id: "flash",
        title: "Flash & boot",
        description: "Write the image to microSD and boot your Pi.",
        sections: [
          {
            heading: "Flash the image",
            body: (
              <>
                <p>
                  Use Raspberry Pi Imager, balenaEtcher, or <code>dd</code> to write the image to your microSD card.
                </p>
                <div className="CodeBlock" role="region" aria-label="dd example">
                  <pre>
                    <code>{`# Example (be careful to use the correct device path!)
xz -d -c teeos-rpi4.img.xz | sudo dd of=/dev/sdX bs=4M conv=fsync status=progress`}</code>
                  </pre>
                </div>
                <p className="Muted">
                  Replace <code>/dev/sdX</code> with your microSD device. Double-check to avoid overwriting a disk.
                </p>
              </>
            ),
          },
          {
            heading: "Boot checklist",
            body: (
              <ul className="List">
                <li>Insert microSD into Pi 4</li>
                <li>Connect HDMI/keyboard or prepare serial/SSH if supported</li>
                <li>Power on and watch boot logs</li>
              </ul>
            ),
          },
        ],
        tips: ["If boot fails, confirm you used the right image and that the card is healthy."],
      },
      {
        id: "verify",
        title: "Verify TEEOS",
        badge: "Finish",
        description: "Confirm TEEOS services and hardware behavior.",
        sections: [
          {
            heading: "Validate at runtime",
            body: (
              <>
                <p>After boot, confirm TEEOS is active and expected services are running.</p>
                <div className="CodeBlock" role="region" aria-label="Verification commands">
                  <pre>
                    <code>{`# Examples:
uname -a
systemctl status teeos.service
journalctl -u teeos.service --no-pager -n 100`}</code>
                  </pre>
                </div>
              </>
            ),
          },
          ...(wsUrl
            ? [
                {
                  heading: "Optional: Live status endpoint",
                  body: (
                    <>
                      <p>
                        A WebSocket URL is configured via <code>REACT_APP_WS_URL</code>. If your backend provides live
                        build/runtime status, this app can surface it in the future.
                      </p>
                      <p className="Muted">
                        Current value: <code>{wsUrl}</code>
                      </p>
                    </>
                  ),
                },
              ]
            : []),
        ],
        tips: ["Capture logs if you need support—include both boot logs and service logs."],
      },
    ];

    return baseSteps;
  }, [experimentsEnabled, featureFlags]);

  const activeIndex = Math.max(
    0,
    steps.findIndex((s) => s.id === activeStepId)
  );
  const activeStep = steps[activeIndex] || steps[0];

  useEffect(() => {
    // Keep activeStepId valid if steps change due to flags.
    if (!steps.some((s) => s.id === activeStepId)) {
      setActiveStepId(steps[0]?.id || "overview");
    }
  }, [steps, activeStepId]);

  const progressPct = Math.round((completed.size / steps.length) * 100);

  // PUBLIC_INTERFACE
  const goNext = () => {
    const next = steps[Math.min(steps.length - 1, activeIndex + 1)];
    if (next) setActiveStepId(next.id);
  };

  // PUBLIC_INTERFACE
  const goBack = () => {
    const prev = steps[Math.max(0, activeIndex - 1)];
    if (prev) setActiveStepId(prev.id);
  };

  // PUBLIC_INTERFACE
  const toggleComplete = () => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(activeStep.id)) next.delete(activeStep.id);
      else next.add(activeStep.id);
      return next;
    });
  };

  const isComplete = completed.has(activeStep.id);

  return (
    <div className="App" data-app-theme="ocean-professional">
      <div className="BackgroundGlow" aria-hidden="true" />

      <header className="TopBar">
        <div className="Brand">
          <div className="BrandMark" aria-hidden="true" />
          <div>
            <div className="BrandTitle">TEEOS RPi4 Image Builder</div>
            <div className="BrandSubtitle">Step-by-step wizard</div>
          </div>
        </div>

        <div className="TopBarMeta">
          <div className="Pill" title="Environment">
            <span className="PillDot" aria-hidden="true" />
            {process.env.REACT_APP_NODE_ENV || "development"}
          </div>
          <div className="Pill" title="Progress">
            {progressPct}% complete
          </div>
        </div>
      </header>

      <main className="Layout" aria-label="Wizard layout">
        <aside className="Sidebar" aria-label="Steps navigation">
          <div className="SidebarHeader">
            <div className="SidebarTitle">Steps</div>
            <div className="SidebarHint">Select a step to view instructions</div>
          </div>

          <nav className="StepList" aria-label="Step list">
            {steps.map((step, idx) => {
              const isActive = step.id === activeStep.id;
              const done = completed.has(step.id);

              return (
                <button
                  key={step.id}
                  type="button"
                  className={`StepItem ${isActive ? "isActive" : ""}`}
                  onClick={() => setActiveStepId(step.id)}
                  aria-current={isActive ? "step" : undefined}
                >
                  <div className="StepIndex" aria-hidden="true">
                    {done ? "✓" : idx + 1}
                  </div>
                  <div className="StepText">
                    <div className="StepRow">
                      <div className="StepTitle">{step.title}</div>
                      {step.badge ? <span className="Badge">{step.badge}</span> : null}
                    </div>
                    <div className="StepDesc">{step.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="SidebarFooter">
            <div className="MiniCard">
              <div className="MiniCardTitle">Status</div>
              <div className="MiniCardBody">
                <div className="StatusRow">
                  <span className="StatusLabel">Completed</span>
                  <span className="StatusValue">
                    {completed.size}/{steps.length}
                  </span>
                </div>
                <div className="ProgressBar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="ProgressFill" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            </div>

            <div className="FooterNote">
              {process.env.REACT_APP_ENABLE_SOURCE_MAPS ? (
                <span className="Muted">Source maps enabled</span>
              ) : (
                <span className="Muted">Source maps disabled</span>
              )}
            </div>
          </div>
        </aside>

        <section className="Content" aria-label="Step content">
          <div className="Card">
            <div className="CardHeader">
              <div>
                <h1 className="H1">{activeStep.title}</h1>
                <p className="Lead">{activeStep.description}</p>
              </div>

              <div className="CardHeaderActions">
                <button
                  type="button"
                  className={`Btn ${isComplete ? "BtnSecondary" : "BtnPrimary"}`}
                  onClick={toggleComplete}
                >
                  {isComplete ? "Mark incomplete" : "Mark complete"}
                </button>
              </div>
            </div>

            <div className="CardBody">
              {activeStep.sections?.map((section) => (
                <div className="Section" key={section.heading}>
                  <h2 className="H2">{section.heading}</h2>
                  <div className="SectionBody">{section.body}</div>
                </div>
              ))}

              {activeStep.tips?.length ? (
                <div className="Callout">
                  <div className="CalloutTitle">Tips</div>
                  <ul className="List">
                    {activeStep.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {activeStep.links?.length ? (
                <div className="Links">
                  <div className="LinksTitle">Resources</div>
                  <div className="LinksGrid">
                    {activeStep.links.map((l) => (
                      <a key={l.href} className="LinkCard" href={l.href} target="_blank" rel="noreferrer">
                        <div className="LinkLabel">{l.label}</div>
                        <div className="LinkHref">{l.href}</div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="CardFooter">
              <button type="button" className="Btn BtnGhost" onClick={goBack} disabled={activeIndex === 0}>
                Back
              </button>
              <div className="StepCounter" aria-label="Current step">
                Step <strong>{activeIndex + 1}</strong> of <strong>{steps.length}</strong>
              </div>
              <button
                type="button"
                className="Btn BtnPrimary"
                onClick={goNext}
                disabled={activeIndex === steps.length - 1}
              >
                Next
              </button>
            </div>
          </div>

          <div className="SubtleNote">
            <span className="Muted">
              This UI is a guide. Use your project’s repository docs as the source of truth for exact commands and
              configuration.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
