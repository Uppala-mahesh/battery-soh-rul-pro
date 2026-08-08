# Voltwise — Product Design Direction

## Three possible stylistic approaches

### Theme Name: Instrument Greenroom
Very brief intro: A quiet, editorial operations interface with warm paper tones, deep graphite surfaces, and one unmistakable signal green. It makes complex battery telemetry feel legible, calm, and decision-ready.
Probability: 0.06

### Theme Name: Orbital Diagnostics
Very brief intro: A dark observatory-like interface with cool spectrum indicators, radial health rings, and dense telemetry overlays. It creates a sense of technical depth and live monitoring.
Probability: 0.03

### Theme Name: Field Manual / 2040
Very brief intro: A rugged, utilitarian system inspired by aviation checklists and industrial field equipment, using stamped labels, hard divisions, and alert-first hierarchy. It feels practical, physical, and highly operational.
Probability: 0.08

## Chosen approach: Instrument Greenroom

### Design Movement
Contemporary editorial industrialism: a fusion of scientific dashboard clarity, premium automotive instrumentation, and independent magazine art direction.

### Core Principles
1. Calm before clever: the system reduces anxiety through clear hierarchy and measured language.
2. Evidence over decoration: every visual signal maps to a metric, assumption, or confidence boundary.
3. Operational asymmetry: use a persistent left rail, offset editorial blocks, and varied card widths instead of a centered SaaS grid.
4. Safe actionability: surface risk early without telling operators to perform unsafe workarounds.

### Color Philosophy
Warm off-white acts as the analyst's paper, deep ink navy creates a confident chassis, muted slate separates evidence layers, and electric lime is reserved for healthy energy and model confidence. Amber and coral are only used for exposure and replacement risk. The palette should feel like a premium instrument panel, not a gamer dashboard.

### Layout Paradigm
A fixed navigation rail anchors the product. The main canvas uses an asymmetric 12-column composition: a high-visibility health briefing on the left, a large SoH trend field in the center, and a narrow evidence / action column on the right. Lower sections alternate wide analytical surfaces with compact evidence cards.

### Signature Elements
- A thin lime "signal rail" that shows current health state and confidence.
- Editorial eyebrow labels such as "MODEL BRIEF", "DRIVER MAP", and "SAFETY NOTE".
- Micro sparkline traces and bracketed range labels that visually reinforce uncertainty.

### Interaction Philosophy
Interactions should feel like tuning an instrument: instant feedback, subtle active states, and progressive disclosure. The user can switch fleet scenarios, generate a fresh synthetic pack, or open the model assumptions without leaving the core dashboard.

### Animation
Use 180–240ms ease-out transitions for navigation, filters, and hover states. Stagger card entrances by 50ms. Animate chart lines and confidence bands only on initial load or after a new scenario is generated. Respect reduced-motion preferences. Never use bouncing or decorative continuous movement.

### Typography System
Use Space Grotesk for display labels and important numeric readouts, paired with DM Sans for explanatory body text. Headlines use tight tracking and medium weight; metrics use tabular numerals; eyebrow labels use uppercase at 10–11px with generous tracking.

### Brand Essence
Voltwise is an explainable battery health cockpit for operators who need earlier, safer replacement decisions without waiting for a lab report. Personality: measured, incisive, protective.

### Brand Voice
Headlines are short, evidence-led, and slightly editorial. CTAs name the decision they enable, not the software action. Microcopy explains uncertainty plainly.

Example lines:
- "Your pack is aging faster than its calendar suggests."
- "See what changed before the warning light does."

### Wordmark & Logo
The wordmark is set in a custom wide grotesk treatment with a clipped V and a single lime signal notch. The symbol is a compact battery-shield form with a rising pulse cut through the center, designed to work independently as the app mark.

### Signature Brand Color
Signal Lime — #C7F36B. Use it sparingly so it remains ownable and meaningful: healthy state, model confidence, and the active path through a trend.

## Safety and modeling commitments

This is an MVP estimator, not a certified battery management or safety system. The UI must include a persistent safety disclaimer, uncertainty bands, model assumptions, and explicit language that telemetry-based estimates should be validated by qualified engineers and the battery's existing BMS / protection systems. It must never recommend bypassing safeguards or operating outside manufacturer limits.

The MVP includes synthetic telemetry generation in-browser, derived exposure features, a transparent heuristic / regression-style SoH score, a near-term projection, best/likely/worst RUL bands, driver attribution, and a safety-aware summary. AI-style narrative is grounded in the computed signals and labeled as an analyst explanation rather than a certified diagnosis.
