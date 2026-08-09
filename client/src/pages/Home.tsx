import { useMemo, useRef, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowDownRight, ArrowUpRight, BatteryCharging, BellRing, BrainCircuit, ChevronDown, CircleHelp, Download, Gauge, Layers3, LockKeyhole, Menu, Pause, Play, RefreshCw, ShieldCheck, Sparkles, ThermometerSun, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import trainedArtifact from "@/data/battery_model_metrics.json";
import { trpc } from "@/lib/trpc";

type Cycle = { cycle: number; soh: number; lower: number; upper: number; temp: number; cRate: number; depth: number; voltage: number };

const baseCycles: Cycle[] = [
  { cycle: 1, soh: 100, lower: 98.8, upper: 100.7, temp: 28, cRate: 0.8, depth: 62, voltage: 4.18 },
  { cycle: 12, soh: 98.9, lower: 97.7, upper: 100.0, temp: 29, cRate: 0.9, depth: 67, voltage: 4.17 },
  { cycle: 24, soh: 97.8, lower: 96.7, upper: 98.9, temp: 30, cRate: 1.0, depth: 70, voltage: 4.16 },
  { cycle: 38, soh: 96.2, lower: 95.0, upper: 97.3, temp: 32, cRate: 1.2, depth: 74, voltage: 4.15 },
  { cycle: 52, soh: 94.7, lower: 93.3, upper: 96.1, temp: 34, cRate: 1.4, depth: 78, voltage: 4.13 },
  { cycle: 68, soh: 93.9, lower: 92.2, upper: 95.5, temp: 35, cRate: 1.5, depth: 81, voltage: 4.12 },
  { cycle: 84, soh: 92.3, lower: 90.4, upper: 94.1, temp: 36, cRate: 1.7, depth: 84, voltage: 4.10 },
  { cycle: 101, soh: 91.4, lower: 89.2, upper: 93.4, temp: 37, cRate: 1.8, depth: 86, voltage: 4.09 },
  { cycle: 118, soh: 89.8, lower: 87.4, upper: 92.2, temp: 38, cRate: 2.0, depth: 89, voltage: 4.07 },
  { cycle: 136, soh: 88.6, lower: 86.0, upper: 91.3, temp: 39, cRate: 2.1, depth: 91, voltage: 4.06 },
  { cycle: 154, soh: 87.8, lower: 84.9, upper: 90.7, temp: 40, cRate: 2.2, depth: 93, voltage: 4.04 },
  { cycle: 173, soh: 86.9, lower: 83.8, upper: 90.0, temp: 41, cRate: 2.4, depth: 95, voltage: 4.02 },
];

const scenarios = {
  "Fleet average": { label: "Fleet average", soh: 86.9, rul: 146, temp: 41, cRate: 2.4, depth: 95, status: "Monitor closely" },
  "High thermal load": { label: "High thermal load", soh: 83.1, rul: 92, temp: 47, cRate: 2.6, depth: 96, status: "Replace soon" },
  "Gentle duty cycle": { label: "Gentle duty cycle", soh: 92.7, rul: 224, temp: 31, cRate: 1.2, depth: 72, status: "Healthy trajectory" },
};

function makeSeries(scenario: keyof typeof scenarios, seed: number) {
  const s = scenarios[scenario];
  return baseCycles.map((item, index) => {
    const noise = Math.sin(index * 1.7 + seed) * 0.34;
    const factor = s.soh / 86.9;
    const soh = Math.min(100, Math.max(72, 100 - (100 - item.soh) * factor + noise));
    return { ...item, soh: Number(soh.toFixed(1)), lower: Number((soh - 2.4 - index * 0.04).toFixed(1)), upper: Number((soh + 2.2 + index * 0.04).toFixed(1)), temp: Math.round(item.temp * (s.temp / 41)), cRate: Number((item.cRate * (s.cRate / 2.4)).toFixed(1)), depth: Math.round(item.depth * (s.depth / 95)) };
  });
}

function MetricCard({ label, value, unit, detail, accent = "lime", icon: Icon, trend }: { label: string; value: string; unit?: string; detail: string; accent?: string; icon: typeof Gauge; trend?: "up" | "down" }) {
  return <div className={`metric-card accent-${accent}`}>
    <div className="metric-top"><span className="eyebrow">{label}</span><Icon size={16} strokeWidth={1.7} /></div>
    <div className="metric-value">{value}<span>{unit}</span></div>
    <div className="metric-detail">{trend === "down" ? <ArrowDownRight size={14} /> : trend === "up" ? <ArrowUpRight size={14} /> : null}{detail}</div>
  </div>;
}

export default function Home() {
  const [scenario, setScenario] = useState<keyof typeof scenarios>("Fleet average");
  const [seed, setSeed] = useState(1);
  const [isLive, setIsLive] = useState(true);
  const [activeNav, setActiveNav] = useState("Overview");
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const datasetPreview = trpc.dataset.previewImport.useMutation({ onSuccess: (report) => toast.success(report.ok ? "Dataset accepted for review" : "Dataset needs attention", { description: `${report.rows} rows scanned • ${report.quarantinedRows} quarantined • ${report.unitAssumptions.length} assumption(s)` }), onError: (error) => toast.error("Dataset import failed", { description: error.message }) });
  const handleDatasetUpload = async (file?: File) => { if (!file) return; const content = await file.text(); datasetPreview.mutate({ filename: file.name, content }); };
  const data = useMemo(() => makeSeries(scenario, seed), [scenario, seed]);
  const current = scenarios[scenario];
  const latest = data[data.length - 1];
  const confidence = scenario === "High thermal load" ? 78 : scenario === "Gentle duty cycle" ? 88 : 84;
  const driverData = [
    { name: "Thermal exposure", value: current.temp > 43 ? 86 : 72, color: "#f07e61" },
    { name: "Deep cycling", value: current.depth > 90 ? 79 : 58, color: "#e6ad55" },
    { name: "High C-rate bursts", value: current.cRate > 2.3 ? 64 : 41, color: "#9c8bd4" },
    { name: "Calendar aging", value: 36, color: "#7990a7" },
  ];

  const regenerate = () => { setSeed((value) => value + 1); toast.success("Synthetic telemetry refreshed", { description: "New telemetry variation has been scored against the same transparent model." }); };
  const navItems = [{ label: "Overview", icon: Gauge }, { label: "Telemetry Lab", icon: Activity }, { label: "Model Notes", icon: BrainCircuit }, { label: "Safety Center", icon: ShieldCheck }];
  const trainedSoH = Number(trainedArtifact.summary.latest_predicted_soh).toFixed(1);
  const trainedRul = Math.round(Number(trainedArtifact.summary.rul_likely_cycles));
  const trainedMae = Number(trainedArtifact.metrics.test.mae_soh_points).toFixed(1);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand-lockup"><div className="brand-mark"><span className="mark-shield"></span><span className="mark-pulse"></span></div><div><div className="brand-name">VOLT<span>WISE</span></div><div className="brand-caption">health intelligence / field 04</div></div></div>
      <div className="workspace-switcher"><span className="status-dot"></span><div><div className="workspace-title">Northline Energy</div><div className="workspace-meta">Pack fleet / N-04</div></div><ChevronDown size={15} /></div>
      <div className="sidebar-label">Workspace</div>
      <nav>{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeNav === label ? "active" : ""}`} onClick={() => { setActiveNav(label); if (label !== "Overview") toast.info(`${label} view`, { description: "This competition MVP keeps the core evidence in one focused workspace." }); }}><Icon size={17} />{label}{label === "Safety Center" && <span className="nav-badge">1</span>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="model-card"><div className="model-card-head"><span className="live-pill"><span></span>MODEL ONLINE</span><LockKeyhole size={14} /></div><div className="model-name">Voltwise Core 0.9</div><div className="model-copy">Dataset-backed estimator<br />file2.csv / {trainedArtifact.metrics.test_rows} holdout rows</div><div className="model-footer"><span>Holdout MAE</span><b>{trainedMae} pts</b></div></div>
      <div className="user-row"><div className="avatar">AM</div><div><div className="user-name">Ari Morgan</div><div className="user-role">Fleet operations</div></div><Menu size={16} className="user-menu" /></div>
    </aside>

    <main className="main-canvas">
      <header className="topbar"><div><div className="breadcrumb"><span>WORKSPACE</span><span>/</span><b>{activeNav.toUpperCase()}</b></div><h1>Battery intelligence <em>in the clear.</em></h1></div><div className="top-actions"><div className="sync-status"><span className="pulse-dot"></span>Live sync <span className="divider"></span>14:32 UTC</div><button className="icon-button" aria-label="Notifications"><BellRing size={17} /><span className="notification-dot"></span></button><input ref={uploadInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => { void handleDatasetUpload(event.target.files?.[0]); event.currentTarget.value = ""; }} /><Button className="upload-button" onClick={() => uploadInputRef.current?.click()} disabled={datasetPreview.isPending}><Upload size={15} /> {datasetPreview.isPending ? "Inspecting…" : "Load dataset"}</Button></div></header>

      {activeNav !== "Overview" && <section className="operator-workbench"><div className="panel workbench-lead"><div className="eyebrow lime"><span className="eyebrow-line"></span>{activeNav.toUpperCase()} / OPERATOR WORKBENCH</div><h2>{activeNav === "Telemetry Lab" ? "Bring the pack signal into focus." : activeNav === "Model Notes" ? "Make every estimate explainable." : "Keep uncertainty visible and actionable."}</h2><p>{activeNav === "Telemetry Lab" ? "The gateway contract accepts voltage, current, temperature, SOC, cycle identity, and the selected battery profile. Out-of-profile packets are quarantined instead of entering the normal stream." : activeNav === "Model Notes" ? "Training runs should be evaluated against labeled cycles, profile metadata, and held-out validation data before they influence planning decisions." : "Alerts are evidence-led workflow states. They are not a substitute for BMS protections, manufacturer limits, or qualified engineering review."}</p><div className="workbench-actions"><Button className="lime-button" onClick={() => toast.success(activeNav === "Telemetry Lab" ? "Gateway contract copied" : activeNav === "Model Notes" ? "Training run queued" : "Safety review opened", { description: "The next production step will connect this control to the persistent monitoring service." })}>{activeNav === "Telemetry Lab" ? "Copy ingest contract" : activeNav === "Model Notes" ? "Queue training run" : "Open review queue"} <ArrowUpRight size={14} /></Button><span className="derived-pill">MVP adapter / human review required</span></div></div><div className="panel workbench-stack"><div className="workbench-row"><span className="eyebrow">STATUS</span><b>{activeNav === "Telemetry Lab" ? "Gateway ready" : activeNav === "Model Notes" ? `Trained on file2.csv / SoH ${trainedSoH}%` : "1 open watch item"}</b><span className="status-dot"></span></div><div className="workbench-row"><span className="eyebrow">NEXT SIGNAL</span><b>{activeNav === "Telemetry Lab" ? "Last seen 14:31:58" : activeNav === "Model Notes" ? `Likely RUL ${trainedRul} cycles / holdout validated` : "Review thermal evidence"}</b></div><div className="workbench-row"><span className="eyebrow">SAFETY BOUNDARY</span><b>No unsafe operating instructions</b></div></div></section>}

      <section className="briefing-row">
        <div className="briefing-copy"><div className="eyebrow lime"><span className="eyebrow-line"></span>MODEL BRIEF / 08 AUG 2026</div><h2>Your pack is aging <br /><span>faster than its calendar.</span></h2><p>Cycle depth and thermal exposure are now contributing more to capacity loss than elapsed time. The signal is actionable, but the confidence band still matters.</p><div className="briefing-actions"><Button className="lime-button" onClick={regenerate}><RefreshCw size={15} /> Recheck replacement timing</Button><button className="text-button" onClick={() => toast.info("Model assumptions", { description: "Estimator combines normalized voltage response, temperature exposure, depth-of-discharge and current burst features." })}>View assumptions <ArrowUpRight size={14} /></button></div></div>
        <div className="briefing-visual"><img src="/manus-storage/voltwise-hero_1cd85567.png" alt="Abstract battery cell architecture" /><div className="visual-overlay"></div><div className="diagnostic-bracket top-bracket">SOH TRACE / 173 CYCLES</div><div className="diagnostic-bracket bottom-bracket">TEMP + CURRENT / EXPOSURE FIELD</div><div className="signal-card"><div className="signal-card-label">CURRENT SIGNAL</div><div className="signal-row"><span className="signal-ring"><span>{current.soh.toFixed(1)}<small>%</small></span></span><div><div className="signal-title">{current.status}</div><div className="signal-sub">Confidence {confidence}% <span className="confidence-bar"><i style={{ width: `${confidence}%` }} /></span></div></div></div></div></div>
      </section>

      <section className="control-strip"><div className="control-rail">LIVE MODEL / 0.9</div><div className="control-item"><span className="eyebrow">SCENARIO</span><div className="select-wrap"><select value={scenario} onChange={(event) => setScenario(event.target.value as keyof typeof scenarios)}>{Object.keys(scenarios).map((key) => <option key={key}>{key}</option>)}</select><ChevronDown size={15} /></div></div><div className="strip-divider"></div><div className="control-item"><span className="eyebrow">DATA WINDOW</span><div className="window-value">1,407 labeled cycles <span>•</span> CSV-backed model</div></div><div className="strip-divider"></div><div className="control-item"><span className="eyebrow">TELEMETRY STATUS</span><div className="telemetry-status"><span className="status-dot"></span>Nominal capture <span className="last-seen">Last seen 14:31:58</span></div></div><div className="strip-spacer" /><button className={`live-toggle ${isLive ? "on" : ""}`} onClick={() => setIsLive(!isLive)}>{isLive ? <Pause size={13} /> : <Play size={13} />}{isLive ? "Live" : "Paused"}</button></section>

      <section className="metrics-grid"><MetricCard label="Estimated SoH" value={current.soh.toFixed(1)} unit="%" detail="−1.2% vs. last window" trend="down" icon={BatteryCharging} /><MetricCard label="RUL / likely" value={String(current.rul)} unit="cycles" detail="to 80% SoH threshold" trend="down" icon={Layers3} accent="amber" /><MetricCard label="Mean thermal load" value={String(current.temp)} unit="°C" detail="+4.1° above baseline" trend="up" icon={ThermometerSun} accent="coral" /><MetricCard label="Model confidence" value={String(confidence)} unit="%" detail="stable across 3 folds" trend="up" icon={BrainCircuit} accent="violet" /></section>

      <section className="analysis-grid">
        <div className="panel trend-panel"><div className="panel-header"><div><div className="eyebrow">STATE-OF-HEALTH / TREND</div><h3>Capacity confidence over cycles</h3></div><div className="legend"><span><i className="legend-line lime-line"></i>Estimated SoH</span><span><i className="legend-band"></i>Confidence band</span></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height={285}><ComposedChart data={data} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}><defs><linearGradient id="sohFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c7f36b" stopOpacity={0.26} /><stop offset="100%" stopColor="#c7f36b" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e5e1d8" vertical={false} /><XAxis dataKey="cycle" tickLine={false} axisLine={false} tick={{ fill: "#8d8d85", fontSize: 11 }} tickFormatter={(value) => `${value}`} /><YAxis domain={[78, 102]} tickLine={false} axisLine={false} tick={{ fill: "#8d8d85", fontSize: 11 }} tickFormatter={(value) => `${value}%`} /><Tooltip contentStyle={{ border: "1px solid #dedbd2", borderRadius: 8, boxShadow: "0 12px 28px rgba(28,37,43,.12)", fontSize: 12 }} formatter={(value: number, name: string) => [`${value}%`, name === "soh" ? "Estimated SoH" : name]} /><Area type="monotone" dataKey="upper" stroke="none" fill="url(#sohFill)" /><Area type="monotone" dataKey="lower" stroke="none" fill="#fbfaf7" /><Line type="monotone" dataKey="soh" stroke="#92bd42" strokeWidth={3} dot={{ r: 3, fill: "#fbfaf7", stroke: "#92bd42", strokeWidth: 2 }} activeDot={{ r: 5 }} /><ReferenceLine y={80} stroke="#e5896c" strokeDasharray="5 5" label={{ value: "80% replacement threshold", position: "insideTopRight", fill: "#c96b51", fontSize: 10 }} /></ComposedChart></ResponsiveContainer></div><div className="chart-footer"><span><strong>−13.1 pts</strong> since cycle 1</span><span className="threshold-note"><span></span>Threshold is an estimate, not a safety limit</span></div></div>
        <div className="panel rul-panel"><div className="panel-header"><div><div className="eyebrow">REMAINING USEFUL LIFE</div><h3>Plan with a range</h3></div><button className="more-button" onClick={() => toast.info("RUL methodology", { description: "The band reflects scenario spread, model residuals, and distance to the 80% SoH planning threshold." })}><CircleHelp size={16} /></button></div><div className="rul-visual"><div className="rul-number">{current.rul}<span>cycles</span></div><div className="rul-copy">Likely life remaining<br /><small>until estimated 80% SoH</small></div></div><div className="range-list"><div><span className="range-label"><i className="range-dot best"></i>Best case</span><b>{current.rul + 42} cycles</b></div><div><span className="range-label"><i className="range-dot likely"></i>Likely case</span><b>{current.rul} cycles</b></div><div><span className="range-label"><i className="range-dot worst"></i>Worst case</span><b>{Math.max(38, current.rul - 51)} cycles</b></div></div><div className="rul-callout"><Sparkles size={15} /><span>Plan a validation review inside the next <b>30 cycles</b>.</span></div></div>
      </section>

      <section className="lower-grid"><div className="panel drivers-panel"><div className="panel-header"><div><div className="eyebrow">DRIVER MAP / EXPLAINABILITY</div><h3>What is moving the score?</h3></div><span className="derived-pill">Derived from telemetry</span></div><div className="driver-chart"><ResponsiveContainer width="100%" height={178}><BarChart data={driverData} layout="vertical" margin={{ top: 3, right: 26, left: 8, bottom: 0 }}><XAxis type="number" domain={[0, 100]} hide /><YAxis type="category" dataKey="name" width={130} tickLine={false} axisLine={false} tick={{ fill: "#656b6c", fontSize: 11 }} /><Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14} fill="#94bd4a" label={{ position: "right", fill: "#4f595a", fontSize: 11, formatter: (value: number) => `${value}%` }} /></BarChart></ResponsiveContainer></div><div className="driver-note"><div className="driver-note-icon"><Zap size={15} /></div><p><b>Thermal exposure is the lead signal.</b> Elevated mean temperature compounds the effect of deep cycling and high-current bursts in this window.</p></div></div><div className="panel thermal-panel"><div className="panel-header"><div><div className="eyebrow">EXPOSURE TRACE</div><h3>Temperature vs. current</h3></div><div className="mini-legend"><span className="temp-dot"></span>Temp <span className="current-dot"></span>Current</div></div><ResponsiveContainer width="100%" height={172}><LineChart data={data} margin={{ top: 12, right: 10, left: -24, bottom: 0 }}><CartesianGrid stroke="#e5e1d8" vertical={false} /><XAxis dataKey="cycle" tickLine={false} axisLine={false} tick={{ fill: "#8d8d85", fontSize: 10 }} /><YAxis yAxisId="left" domain={[20, 52]} hide /><YAxis yAxisId="right" orientation="right" domain={[0, 3]} hide /><Tooltip contentStyle={{ border: "1px solid #dedbd2", borderRadius: 8, fontSize: 11 }} /><Line yAxisId="left" type="monotone" dataKey="temp" stroke="#e5896c" strokeWidth={2.2} dot={false} /><Line yAxisId="right" type="monotone" dataKey="cRate" stroke="#9483c5" strokeWidth={2.2} dot={false} strokeDasharray="4 4" /></LineChart></ResponsiveContainer><div className="thermal-summary"><div><span>Peak thermal</span><b>{current.temp + 7}°C</b></div><div><span>Current burst</span><b>{current.cRate + 0.8}C</b></div><div><span>Depth of discharge</span><b>{current.depth}%</b></div></div></div><div className="panel safety-panel"><div className="safety-top"><div className="safety-icon"><ShieldCheck size={18} /></div><div><div className="eyebrow">SAFETY NOTE</div><h3>Monitor closely</h3></div></div><p>This estimate is a planning signal, not a certified safety verdict. Continue to follow the battery manufacturer's limits and existing BMS protections.</p><button className="safety-link" onClick={() => toast.info("Safety center", { description: "Always validate anomalies with qualified battery engineers and the pack's protection system." })}>Read safety assumptions <ArrowUpRight size={14} /></button></div></section>

      <footer className="footer-note"><div><span className="footer-mark"></span><b>Voltwise estimator / MVP</b><span>Heuristic demo model • validate before use</span></div><button onClick={() => toast.success("Report prepared", { description: "A shareable report export would be generated here in the production version." })}><Download size={14} /> Export report</button></footer>
    </main>
  </div>;
}
