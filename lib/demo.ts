import type { GraphData } from "./types";

/**
 * Seed content for local demo mode (no backend required). Themed around the
 * "Motor Design" board shown in the product screenshots.
 */
export const DEMO_GRAPH: GraphData = {
  nodes: [
    {
      id: "n_motor",
      type: "note",
      title: "Motor Design",
      content:
        "# Motor Design\n\nCentral hub for the brushless motor project. Targeting **2.4 kW** continuous output with field-oriented control.\n\nLinks: [[Thermal Model]] · [[Winding Layout]] · [[Controller Firmware]]",
      tags: ["hardware", "project"],
      x: 0,
      y: 0,
      w: 280,
      h: 180,
      color: "#7c6cf6",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "n_thermal",
      type: "note",
      title: "Thermal Model",
      content:
        "Steady-state thermal budget. Copper losses dominate at peak torque. Need forced-air over the stator. See [[Motor Design]].",
      tags: ["analysis"],
      x: 380,
      y: -120,
      w: 240,
      h: 150,
      color: "#7c6cf6",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "n_winding",
      type: "note",
      title: "Winding Layout",
      content:
        "Distributed 12-slot / 8-pole winding. Fill factor ~0.45. Hairpin option deferred to v2. Feeds [[Thermal Model]].",
      tags: ["hardware"],
      x: 380,
      y: 120,
      w: 240,
      h: 150,
      color: "#7c6cf6",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "n_firmware",
      type: "note",
      title: "Controller Firmware",
      content:
        "FOC loop at 20 kHz on STM32G4. SVPWM + sensorless observer below 5% speed. Depends on [[Motor Design]].",
      tags: ["software"],
      x: -360,
      y: 80,
      w: 240,
      h: 150,
      color: "#7c6cf6",
      updatedAt: new Date().toISOString(),
    },
    {
      id: "n_render",
      type: "image",
      title: "Rotor Render",
      content: "Concept render of the rotor assembly.",
      src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=70",
      tags: ["reference"],
      x: -380,
      y: -160,
      w: 220,
      h: 160,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "n_paper",
      type: "link",
      title: "FOC Reference Paper",
      content: "Field-Oriented Control of PMSM — survey.",
      src: "https://example.com/foc-survey",
      tags: ["research"],
      x: 40,
      y: 300,
      w: 240,
      h: 96,
      updatedAt: new Date().toISOString(),
    },
  ],
  edges: [
    { id: "e1", source: "n_motor", target: "n_thermal", kind: "wikilink" },
    { id: "e2", source: "n_motor", target: "n_winding", kind: "wikilink" },
    { id: "e3", source: "n_motor", target: "n_firmware", kind: "wikilink" },
    { id: "e4", source: "n_winding", target: "n_thermal", kind: "wikilink" },
    { id: "e5", source: "n_motor", target: "n_render", kind: "arrow" },
    { id: "e6", source: "n_firmware", target: "n_paper", kind: "reference" },
    {
      id: "e7",
      source: "n_thermal",
      target: "n_render",
      kind: "ai_suggested",
      confidence: 0.72,
      status: "suggested",
    },
  ],
};
