export interface SpacePortalLink {
  id: string;
  name: string;
  category: "SpaceX" | "YouTube" | "Starlink" | "Planet Labs" | "NASA" | "Research";
  url: string;
  description: string;
  badge?: string;
  iconType: "spacex" | "youtube" | "starlink" | "planet" | "nasa";
}

export interface SpaceXLaunch {
  id: string;
  missionName: string;
  provider: "SpaceX" | "Planet Labs";
  rocket:
    | "Starship Super Heavy"
    | "Starship V2 Super Heavy"
    | "Starship V3 Super Heavy"
    | "Falcon 9 Block 5"
    | "Falcon Heavy";
  launchSite: string;
  launchDate: string;
  launchTimeUTC: string;
  targetIsoDate: string;
  payloadName: string;
  payloadMassKg: number;
  boosterSerial: string;
  boosterFlightCount: number;
  landingTarget: string;
  landingStatus: "Success" | "Pending" | "Ocean Catch" | "Tower Catch" | "RTLS";
  status: "Scheduled" | "Success" | "In-Flight" | "Countdown";
  summary: string;
  webcastUrl: string;
  sourceCitation?: string;
}

export interface PlanetLabsMission {
  id: string;
  constellationName: string;
  satelliteFamily:
    | "PlanetScope SuperDove"
    | "SkySat"
    | "Pelican"
    | "Tanager Hyperspectral";
  activeSatellites: number;
  orbitAltitudeKm: number;
  orbitInclination: string;
  imagingResolution: string;
  spectralBands: string;
  latestLaunchPartner: string;
  latestLaunchDate: string;
  nextLaunchDate?: string;
  nextLaunchIsoDate?: string;
  primaryUseCases: string[];
  description: string;
  status: "Operational" | "Expanding Fleet" | "Next Gen Deployment";
  sourceCitation?: string;
}

export interface StarlinkShell {
  id: string;
  shellName: string;
  altitudeKm: number;
  inclinationDeg: number;
  activeSatellitesCount: number;
  targetSatellitesCount: number;
  version:
    | "Starlink V1.5"
    | "Starlink V2 Mini"
    | "Direct-to-Cell V2"
    | "Polar SSO";
  laserMeshEnabled: boolean;
  latencyMs: string;
  downlinkSpeedMbps: string;
  description: string;
  sourceCitation?: string;
}

export interface DysonPowerMetric {
  title: string;
  value: string;
  change: string;
  unit: string;
  isConceptualProjection: boolean;
  description: string;
  calculationNote?: string;
}

export interface SpaceXHistoryItem {
  year: string;
  phase: string;
  title: string;
  milestone: string;
  significance: string;
  highSchoolAnalogy: string;
  techSpecs: string[];
  status: "Completed" | "Current Focus" | "Next Horizon";
}

export interface SpaceDocumentary {
  id: string;
  title: string;
  year: string;
  platform: string;
  duration: string;
  rating: string;
  summary: string;
  keyTakeaways: string[];
  whyItMattersToDysonSwarm: string;
  trailerUrl: string;
  thumbnailBadge: string;
  youtubeId: string;
}

export interface ArtemisMission {
  id: string;
  missionName: string;
  targetDate: string;
  crew: string[];
  rocketAndVehicle: string;
  objective: string;
  highSchoolBreakdown: string;
  keyTechnologies: string[];
  roleInDysonFuture: string;
  status: "Completed" | "In Preparation" | "Planned Phase";
}

export interface DysonExplainerConcept {
  id: string;
  title: string;
  subtitle: string;
  simpleAnalogy: string;
  theBigProblem: string;
  theEngineeringSolution: string;
  keyStats: { label: string; value: string }[];
  difficultyRating:
    | "Level 1: The Basics"
    | "Level 2: Orbital Physics"
    | "Level 3: Megastructure Engineering";
}

export interface SpaceGlossaryTerm {
  id: string;
  term: string;
  category:
    | "Orbital Mechanics"
    | "Propulsion & Launch"
    | "Constellation Comms"
    | "Solar & Energy"
    | "Dyson Theory";
  formulaOrMetric?: string;
  plainEnglish: string;
  technicalNote: string;
  sourceLabel: string;
  sourceUrl: string;
}

export interface OrbitalChallengeQuestion {
  id: string;
  topic: "Launch Economics" | "Orbital Physics" | "Laser Mesh" | "Space Solar (SBSP)" | "Artemis";
  question: string;
  options: string[];
  correctIndex: number;
  formulaHint: string;
  explanation: string;
}

export interface AerospacePromptTemplate {
  id: string;
  title: string;
  targetModel: string;
  category: string;
  description: string;
  promptText: string;
}

export const SPACEX_LAUNCHES: SpaceXLaunch[] = [
  {
    id: "spx-flight-15",
    missionName: "Starship Flight 15 (Ship 42 Tower Catch + 26 Starlink V3)",
    provider: "SpaceX",
    rocket: "Starship V3 Super Heavy",
    launchSite: "Starbase Pad 2, Boca Chica, TX",
    launchDate: "2026-11-13",
    launchTimeUTC: "20:00 UTC",
    targetIsoDate: "2026-11-13T20:00:00Z",
    payloadName: "26 Starlink V3 Satellites (incl. 3 optical tile-inspection units)",
    payloadMassKg: 52000,
    boosterSerial: "Booster 22 / Ship 42",
    boosterFlightCount: 1,
    landingTarget: "Mechazilla Tower 2 Catch (Ship 42 caught Nov 14; B22 Gulf splashdown)",
    landingStatus: "Tower Catch",
    status: "Success",
    summary:
      "First-ever orbital upper-stage catch in rocketry history. Ship 42 spent 22+ hours completing ~14 orbits, deployed 26 Starlink V3 satellites, and returned to Starbase where Mechazilla caught the upper stage at 3:20 PM CST on Nov 14, 2026.",
    webcastUrl: "https://www.spacex.com/vehicles/starship",
    sourceCitation: "SpaceX Flight 15 Mission Summary & Starbase Broadcast (Nov 13-14, 2026)",
  },
  {
    id: "spx-flight-14",
    missionName: "Starship Flight 14 (First Orbital Insertion + Starlink V3)",
    provider: "SpaceX",
    rocket: "Starship V3 Super Heavy",
    launchSite: "Starbase, Boca Chica, TX",
    launchDate: "2026-09-28",
    launchTimeUTC: "13:15 UTC",
    targetIsoDate: "2026-09-28T13:15:00Z",
    payloadName: "26 Full-Scale Starlink V3 Satellites",
    payloadMassKg: 52000,
    boosterSerial: "Booster 21 / Ship 41",
    boosterFlightCount: 1,
    landingTarget: "Controlled Oceanic Splashdown",
    landingStatus: "Success",
    status: "Success",
    summary:
      "Achieved Starship's first full Low Earth Orbit insertion and deployed 26 next-generation Starlink V3 broadband satellites before executing a controlled reentry and ocean splashdown.",
    webcastUrl: "https://www.spacex.com/launches",
    sourceCitation: "SpaceX Flight 14 Manifest (Sep 28, 2026)",
  },
  {
    id: "artemis-2-historic",
    missionName: "Artemis II (Crewed Lunar Flyby — SLS + Orion)",
    provider: "SpaceX",
    rocket: "Falcon 9 Block 5",
    launchSite: "Kennedy Space Center LC-39B, FL (NASA)",
    launchDate: "2026-04-01",
    launchTimeUTC: "22:24 UTC",
    targetIsoDate: "2026-04-01T22:24:00Z",
    payloadName: "Orion Spacecraft — Crew: Wiseman, Glover, Koch, Hansen",
    payloadMassKg: 26500,
    boosterSerial: "SLS Block 1 Core",
    boosterFlightCount: 1,
    landingTarget: "Pacific Ocean Splashdown (Apr 11, 2026)",
    landingStatus: "Success",
    status: "Success",
    summary:
      "Reference historical milestone: NASA's first crewed lunar flyby in over 50 years validated deep-space Orion life support and communications prior to Artemis III LEO HLS rendezvous testing in 2027.",
    webcastUrl: "https://www.nasa.gov/humans-in-space/artemis/",
    sourceCitation: "NASA Artemis II Mission Archive (Apr 2026)",
  },
];

export const PLANET_LABS_MISSIONS: PlanetLabsMission[] = [
  {
    id: "pl-1",
    constellationName: "PlanetScope SuperDove Fleet",
    satelliteFamily: "PlanetScope SuperDove",
    activeSatellites: 210,
    orbitAltitudeKm: 525,
    orbitInclination: "97.4° SSO",
    imagingResolution: "3.0 Meters / Pixel",
    spectralBands: "8 Bands (Coastal Blue, Green, Red, Red Edge, Near-IR)",
    latestLaunchPartner: "SpaceX Falcon 9 Transporter Rideshare",
    latestLaunchDate: "2026-05-14",
    primaryUseCases: [
      "Daily Global Landmass Scanning",
      "Precision Agricultural Yields",
      "Deforestation Monitoring",
      "Disaster Response Intelligence",
    ],
    description:
      "The world’s largest Earth-imaging fleet, capturing the entirety of Earth’s land surface every 24 hours in multi-spectral optical bands.",
    status: "Operational",
    sourceCitation: "Planet Labs SEC Form 10-K & Fleet Disclosures",
  },
  {
    id: "pl-2",
    constellationName: "SkySat High-Definition Fleet",
    satelliteFamily: "SkySat",
    activeSatellites: 21,
    orbitAltitudeKm: 450,
    orbitInclination: "53° Inclined / SSO",
    imagingResolution: "50 Centimeters Sub-Meter",
    spectralBands: "Panchromatic & 4 Multi-spectral",
    latestLaunchPartner: "SpaceX Falcon 9 Dedicated",
    latestLaunchDate: "2025-11-02",
    primaryUseCases: [
      "Sub-Meter Tactical Reconnaissance",
      "Supply Chain Vessel Tracking",
      "Infrastructure Construction Audit",
      "Rapid Revisit Target Video",
    ],
    description:
      "Sub-meter rapid-revisit constellation capable of capturing 50cm resolution imagery and full-motion HD satellite video of targeted sites.",
    status: "Operational",
    sourceCitation: "Planet Labs Constellation Architecture Doc",
  },
  {
    id: "pl-3",
    constellationName: "Pelican Next Gen High-Resolution Fleet",
    satelliteFamily: "Pelican",
    activeSatellites: 8,
    orbitAltitudeKm: 500,
    orbitInclination: "97.5° SSO",
    imagingResolution: "30 Centimeters Ultra-HD",
    spectralBands: "12 Multi-spectral Bands",
    latestLaunchPartner: "SpaceX Falcon 9 Rideshare",
    latestLaunchDate: "2026-07-18",
    primaryUseCases: [
      "Ultra-High Definition Rapid Revisit",
      "Autonomous Target Detection",
      "Global Port & Runway Monitoring",
    ],
    description:
      "Planet Labs flagship next-generation satellite architecture offering 30cm spatial resolution with reduced tasking-to-delivery latency.",
    status: "Expanding Fleet",
    sourceCitation: "Planet Labs Pelican Product Specification",
  },
  {
    id: "pl-4",
    constellationName: "Tanager Hyperspectral Gas & Climate Fleet",
    satelliteFamily: "Tanager Hyperspectral",
    activeSatellites: 2,
    orbitAltitudeKm: 520,
    orbitInclination: "97.6° SSO",
    imagingResolution: "30 Meters / 420 Bands",
    spectralBands: "420 Continuous Spectral Channels (SWIR / VNIR)",
    latestLaunchPartner: "SpaceX Falcon 9 Rideshare",
    latestLaunchDate: "2026-05-14",
    primaryUseCases: [
      "Methane Plume Point-Source Detection",
      "CO2 Super-Emitters Identification",
      "Mineral Deposit Mapping",
      "Environmental Compliance",
    ],
    description:
      "Built in collaboration with NASA JPL and Carbon Mapper, Tanager uses imaging spectrometers to detect and pinpoint facility-scale methane and CO2 emissions.",
    status: "Next Gen Deployment",
    sourceCitation: "Carbon Mapper & NASA JPL Partnership Specs",
  },
];

export const STARLINK_SHELLS: StarlinkShell[] = [
  {
    id: "shell-1",
    shellName: "Shell 1 (Main LEO Mid-Latitude)",
    altitudeKm: 550,
    inclinationDeg: 53.0,
    activeSatellitesCount: 4408,
    targetSatellitesCount: 4408,
    version: "Starlink V1.5",
    laserMeshEnabled: true,
    latencyMs: "20–30 ms",
    downlinkSpeedMbps: "150–320 Mbps",
    description:
      "Primary dense LEO shell serving high-density residential, maritime, and commercial aviation terminals across populated mid-latitudes.",
    sourceCitation: "CelesTrak NORAD GP Catalog & FCC Gen-1 Authorization",
  },
  {
    id: "shell-2",
    shellName: "Shell 2 (High-Capacity V2 Mini & V3)",
    altitudeKm: 540,
    inclinationDeg: 53.2,
    activeSatellitesCount: 3820,
    targetSatellitesCount: 7500,
    version: "Starlink V2 Mini",
    laserMeshEnabled: true,
    latencyMs: "18–25 ms",
    downlinkSpeedMbps: "220–450 Mbps",
    description:
      "Upgraded Gen-2 shell equipped with E-band phased array antennas and high-throughput optical laser links, now expanding with Starship-deployed V3 payloads.",
    sourceCitation: "FCC Part 25 Gen-2 Licensing & CelesTrak GP",
  },
  {
    id: "shell-3",
    shellName: "Shell 3 (Direct-to-Cell VLEO)",
    altitudeKm: 350,
    inclinationDeg: 53.0,
    activeSatellitesCount: 1680,
    targetSatellitesCount: 7500,
    version: "Direct-to-Cell V2",
    latencyMs: "35–50 ms",
    downlinkSpeedMbps: "2–8 Mbps (Standard Phone LTE/5G)",
    laserMeshEnabled: true,
    description:
      "Very-low-orbit shell with large phased arrays acting as cell towers in space for standard smartphones without specialized hardware.",
    sourceCitation: "FCC STA & SpaceX Direct-to-Cell Filings",
  },
  {
    id: "shell-4",
    shellName: "Shell 4 (Polar & High-Latitude SSO)",
    altitudeKm: 560,
    inclinationDeg: 97.6,
    activeSatellitesCount: 1030,
    targetSatellitesCount: 1500,
    version: "Polar SSO",
    laserMeshEnabled: true,
    latencyMs: "28–40 ms",
    downlinkSpeedMbps: "120–280 Mbps",
    description:
      "Polar constellation ensuring continuous laser optical routing over Alaska, Northern Canada, Antarctica, and trans-oceanic flight corridors.",
    sourceCitation: "CelesTrak Polar Shell Orbital Ephemeris",
  },
];

export const DYSON_POWER_METRICS: DysonPowerMetric[] = [
  {
    title: "Solar Constant Outside Atmosphere (AM0)",
    value: "1,361 W/m²",
    change: "Empirical Constant",
    unit: "Watts per Square Meter (24/7 in Sun-Sync Orbit)",
    isConceptualProjection: false,
    description:
      "Measured total solar irradiance above Earth’s atmosphere before Rayleigh scattering, cloud attenuation, or nighttime darkness.",
    calculationNote: "NASA SORCE / TSIS-1 solar irradiance baseline constant.",
  },
  {
    title: "Theoretical LEO Fleet PV Array Analog",
    value: "~29.5 MW",
    change: "Modeled Analog",
    unit: "Cumulative Satellite Bus Solar Power (Onboard)",
    isConceptualProjection: true,
    description:
      "CONCEPTUAL / PROJECTION — NOT LIVE UTILITY INFRASTRUCTURE. Estimated aggregate solar array power across ~10,941 operational Starlink buses (~2.7 kW/sat V2 avg) used to run radios and thrusters—not beamed to Earth.",
    calculationNote:
      "Modeled as ~10,941 operational buses × ~2.7 kW spacecraft power (does not beam power to ground).",
  },
  {
    title: "Concept Dyson Type-II Benchmark",
    value: "3.84×10²⁶ W",
    change: "Unbuilt Megastructure Concept",
    unit: "Total Solar Luminosity (1 AU Capture Ceiling)",
    isConceptualProjection: true,
    description:
      "CONCEPTUAL / PROJECTION — NOT LIVE INFRASTRUCTURE. Freeman Dyson’s theoretical upper bound if autonomous collector swarms intercepted the Sun’s radiant luminosity across orbital shells.",
    calculationNote: "Astrophysics solar luminosity L☉ = 3.828 × 10²⁶ W.",
  },
  {
    title: "Planet Labs Daily Land Capture",
    value: "350M km²",
    change: "Operational Daily Cadence",
    unit: "Square Kilometers Imaged / Day",
    isConceptualProjection: false,
    description:
      "Complete daily multispectral optical scanning of Earth’s landmass via SuperDove, SkySat, Pelican, and Tanager constellations.",
    calculationNote: "Disclosed in Planet Labs public SEC Form 10-K filings.",
  },
];

export const SPACEX_HISTORY_ROADMAP: SpaceXHistoryItem[] = [
  {
    year: "2002–2008",
    phase: "Phase 1: Survival & Proof of Concept",
    title: "Falcon 1 & The First Private Orbital Flight",
    milestone:
      "After 3 consecutive rocket failures that nearly bankrupted SpaceX, Flight 4 of Falcon 1 reached orbit on September 28, 2008.",
    significance:
      "Proved a lean private company could design and reach orbit with a liquid-fueled rocket at a fraction of legacy defense contractor cost.",
    highSchoolAnalogy:
      "Spending your entire savings building a race car, crashing three prototypes, and winning on the fourth run before running out of fuel money.",
    techSpecs: [
      "Kestrel & Merlin 1C Engines",
      "Payload Capacity: 420 kg to LEO",
      "Unit Launch Price: ~$7M",
    ],
    status: "Completed",
  },
  {
    year: "2010–2015",
    phase: "Phase 2: Reusability Revolution",
    title: "Falcon 9 & Historic Booster Vertical Landing",
    milestone:
      "On December 21, 2015, Falcon 9 booster B1019 launched 11 satellites and landed vertically at Landing Zone 1 in Cape Canaveral.",
    significance:
      "Unlocked orbital rocket booster reusability, turning the primary propulsion stage from single-use hardware into fleet aviation equipment.",
    highSchoolAnalogy:
      "Instead of throwing away a $100M airliner after one New York-to-London flight, you land it, inspect it, refuel it, and fly it 20+ times.",
    techSpecs: [
      "9 Merlin 1D Engines (RP-1 / LOX)",
      "Titanium Grid Fins & Autonomous Legs",
      "Turnaround Cadence Under 21 Days",
    ],
    status: "Completed",
  },
  {
    year: "2018–2020",
    phase: "Phase 3: Heavy Lift & Commercial Crew",
    title: "Falcon Heavy & Crew Dragon Demo-2",
    milestone:
      "Launched Falcon Heavy in Feb 2018 with synchronized dual booster landings, then launched NASA astronauts Bob Behnken & Doug Hurley to the ISS in May 2020.",
    significance:
      "Restored sovereign US human orbital launch capability and demonstrated coordinated multi-core booster recovery.",
    highSchoolAnalogy:
      "Bolting three reusable engines together for deep-space cargo while certifying an autonomous space capsule for human passengers.",
    techSpecs: [
      "27 Merlin Engines (5.1M lbf thrust)",
      "Dual Booster Synchronized RTLS",
      "Autonomous ISS Docking",
    ],
    status: "Completed",
  },
  {
    year: "2019–2026",
    phase: "Phase 4: Global Orbital Infrastructure",
    title: "Starlink Constellation & Optical Laser Mesh",
    milestone:
      "Scaled beyond 10,900 operational satellites (~11,200+ on-orbit total per CelesTrak SATCAT as of November 2026) interconnected via optical laser links.",
    significance:
      "Established the largest active satellite constellation in history, proving continuous automated orbit-raising, conjunction avoidance, and Direct-to-Cell spectrum delivery.",
    highSchoolAnalogy:
      "Replacing isolated ground towers with a coordinated sky mesh of laser-linked relay satellites overhead at 7.6 km/s.",
    techSpecs: [
      "E-band & Ku/Ka Phased Arrays",
      "100+ Gbps Optical Laser Cross-Links",
      "Direct-to-Cell 1900 MHz PCS Array",
    ],
    status: "Current Focus",
  },
  {
    year: "2023–2026+",
    phase: "Phase 5: Full Rapid Reusability Era",
    title: "Starship Orbital V3 Deploy & Upper-Stage Tower Catch",
    milestone:
      "Following Booster 12's first tower catch (Flight 5, Oct 2024), Flight 14 achieved orbital insertion + 26 Starlink V3 deploys (Sep 28, 2026), and Flight 15 captured Ship 42 in mid-air with Mechazilla chopsticks after 14 orbits (Nov 13–14, 2026).",
    significance:
      "Proved both heavy orbital satellite deployment and the historic recovery of an orbital upper stage directly back onto the launch tower.",
    highSchoolAnalogy:
      "Catching a 16-story stainless steel spacecraft returning from 17,000 mph orbit right inside robotic chopsticks at the launch pad.",
    techSpecs: [
      "33 Raptor 3 Engines (Full-Flow Methalox)",
      "Ship 42 Upper-Stage Tower Catch",
      "26 Starlink V3 Pez Deployments / Flight",
    ],
    status: "Current Focus",
  },
  {
    year: "2027–2035",
    phase: "Phase 6: Cislunar Logistics & SBSP R&D",
    title: "Artemis III LEO HLS Docking, Lunar Surface & Space Solar Testbeds",
    milestone:
      "Targeting crewed LEO rendezvous and docking tests between Orion, Starship HLS, and Blue Moon in 2027 (Artemis III), paving the path toward Artemis IV (2028) and orbital power/compute platforms.",
    significance:
      "Sub-$100/kg launch scale is the mathematical prerequisite before industrial manufacturing in orbit or utility Space-Based Solar Power becomes testable.",
    highSchoolAnalogy:
      "Building orbital fuel depots and docking stations before constructing solar factories and lunar bases beyond low Earth orbit.",
    techSpecs: [
      "Orbital Cryogenic Propellant Transfer",
      "Orion + Starship HLS LEO Docking (2027)",
      "Conceptual MW-Scale SBSP Beaming R&D",
    ],
    status: "Next Horizon",
  },
];

export const SPACE_DOCUMENTARIES: SpaceDocumentary[] = [
  {
    id: "doc-ship42-catch",
    title: "Welcome Home S42! First-Ever Starship Upper Stage Tower Catch",
    year: "2026",
    platform: "Everyday Astronaut / YouTube",
    duration: "14m",
    rating: "Flight 15 Historic Catch",
    summary:
      "Track Starship Flight 15's Ship 42 returning from over 22 hours in orbit to become the first orbital upper stage ever caught by Mechazilla's chopstick arms at Starbase on November 14, 2026.",
    keyTakeaways: [
      "First-ever catch of an orbital-class upper stage (Ship 42) in launch history.",
      "Ship 42 completed ~14 orbits and deployed 26 Starlink V3 satellites prior to reentry.",
      "Validates heat-shield tile survival + terminal flip-and-hover guidance to tower catch.",
    ],
    whyItMattersToDysonSwarm:
      "Upper-stage recovery closes the second half of full reusability—critical for high-cadence heavy lift required by mega-constellations and space infrastructure.",
    trailerUrl: "https://www.youtube.com/watch?v=SOJPPrXQ_F8",
    youtubeId: "SOJPPrXQ_F8",
    thumbnailBadge: "SHIP 42 TOWER CATCH",
  },
  {
    id: "doc-flight15-4k",
    title: "Starship Flight 15: 4K Slow-Mo Super Cut with Raw Audio",
    year: "2026",
    platform: "Everyday Astronaut / YouTube",
    duration: "12m",
    rating: "10/10 Telemetry & Acoustics",
    summary:
      "High-frame-rate engineering tracking footage of Booster 22 and Ship 42 lifting off from Starbase Orbital Launch Pad 2 with 33 Raptor engines.",
    keyTakeaways: [
      "Detailed liftoff plume dynamics and Pad 2 flame trench acoustic performance.",
      "Clean stage separation and Raptor Vacuum ignition sequence.",
      "Demonstrates heavy-lift Starship cadence entering regular Starlink V3 deployment.",
    ],
    whyItMattersToDysonSwarm:
      "Visualizes the physical scale of 16.7 million pounds of thrust required to lift 50+ tons of next-generation satellites in a single flight.",
    trailerUrl: "https://www.youtube.com/watch?v=rfiXcucN-2E",
    youtubeId: "rfiXcucN-2E",
    thumbnailBadge: "FLIGHT 15 4K PAD 2",
  },
  {
    id: "doc-tower-view",
    title: "Mechazilla Tower Perspective: Precision Booster Catch Dynamics",
    year: "2025",
    platform: "Everyday Astronaut / YouTube",
    duration: "9m",
    rating: "Engineering Breakdown",
    summary:
      "On-tower high-speed camera angle capturing how Mechazilla's carriage arms damp supersonic terminal kinetic energy during a tower catch.",
    keyTakeaways: [
      "Shows active hydraulic shock absorption along catch rails at contact.",
      "Highlights real-time closed-loop Raptor gimbal corrections in high wind.",
      "Proves tower-based catch infrastructure eliminates heavy landing legs on flight stages.",
    ],
    whyItMattersToDysonSwarm:
      "Removing landing gear mass translates directly into extra payload kilograms delivered per orbital flight.",
    trailerUrl: "https://www.youtube.com/watch?v=5e7Mr4stJf8",
    youtubeId: "5e7Mr4stJf8",
    thumbnailBadge: "TOWER MECHANICS",
  },
  {
    id: "doc-starship-orbit",
    title: "Starship: Go For Orbit",
    year: "2024",
    platform: "SpaceX Official / YouTube",
    duration: "6m",
    rating: "SpaceX Official Film",
    summary:
      "Official SpaceX overview of the Starship + Super Heavy orbital architecture, orbital propellant transfer roadmap, and deep-space cargo logistics.",
    keyTakeaways: [
      "Breaks down full-flow staged combustion methalox propulsion physics.",
      "Explains stainless steel thermal resilience across Mach 25 reentry.",
      "Connects high-frequency LEO deployment directly to deep-space propellant depots.",
    ],
    whyItMattersToDysonSwarm:
      "Demonstrates the direct link between Starlink revenue, rapid reusability, and high-tonnage orbital assembly.",
    trailerUrl: "https://www.youtube.com/watch?v=8ySMdUIF3cY",
    youtubeId: "8ySMdUIF3cY",
    thumbnailBadge: "ORBITAL ARCHITECTURE",
  },
  {
    id: "doc-holy-grail",
    title: "Starship: The Holy Grail of Rocketry",
    year: "2024",
    platform: "SpaceX Official / YouTube",
    duration: "8m",
    rating: "Reusability Thesis",
    summary:
      "SpaceX engineering film examining why complete rapid reusability cuts $/kg launch costs by orders of magnitude compared to expendable vehicles.",
    keyTakeaways: [
      "Quantifies propellant cost fraction (<$2M) versus total rocket build amortization.",
      "Illustrates factory-rate Raptor production alongside heatshield durability tests.",
      "Links orbital cadence directly to telecommunications and space power viability.",
    ],
    whyItMattersToDysonSwarm:
      "Explains the economic threshold equation driving every $/kg slider on the Orbital Launch Economics module.",
    trailerUrl: "https://www.youtube.com/watch?v=EthkNLasUa8",
    youtubeId: "EthkNLasUa8",
    thumbnailBadge: "REUSABILITY THESIS",
  },
  {
    id: "doc-nasa-moon-nov26",
    title: "NASA Moon Base: November 2026 Artemis Architecture Update",
    year: "2026",
    platform: "NASA Official / YouTube",
    duration: "10m",
    rating: "Artemis Nov 2026",
    summary:
      "Official NASA briefing covering post-Artemis II findings, the updated 2027 Artemis III crewed LEO docking test with Starship/Blue Moon HLS, and Artemis IV 2028 lunar surface logistics.",
    keyTakeaways: [
      "Reviews Orion performance and crew telemetry from April 2026's Artemis II lunar flyby.",
      "Details Artemis III LEO rendezvous & docking rehearsal scheduled for summer 2027.",
      "Connects sustainable cislunar power & propellant production to long-term space industry.",
    ],
    whyItMattersToDysonSwarm:
      "Lunar regolith aluminum, silicon, and water-ice propellant lower long-term delta-V costs for deep-space solar reflectors.",
    trailerUrl: "https://www.youtube.com/watch?v=MRg4uIpJ3xE",
    youtubeId: "MRg4uIpJ3xE",
    thumbnailBadge: "NASA NOV 2026 UPDATE",
  },
  {
    id: "doc-kurzgesagt-dyson",
    title: "How to Build a Dyson Sphere — The Ultimate Megastructure",
    year: "2019",
    platform: "Kurzgesagt / YouTube",
    duration: "11m",
    rating: "Conceptual Physics",
    summary:
      "Physics-grounded visual explainer showing why solid shells are mechanically impossible and why an orbital swarm of solar reflectors—possibly bootstrapped from low-gravity bodies like Mercury or the Moon—is the plausible Type-II architecture.",
    keyTakeaways: [
      "Proves orbital Dyson Swarms avoid the structural collapse of rigid spheres.",
      "Calculates exponential manufacturing loops using robotic asteroid/planetary mining.",
      "Bridges theoretical astrophysics with tangible space solar and laser propulsion engineering.",
    ],
    whyItMattersToDysonSwarm:
      "Clearly separates near-term Starlink/SBSP economics from long-horizon Kardashev Type-II physics.",
    trailerUrl: "https://www.youtube.com/watch?v=pP44EPBMb8A",
    youtubeId: "pP44EPBMb8A",
    thumbnailBadge: "DYSON PHYSICS",
  },
  {
    id: "doc-falcon-heavy",
    title: "Falcon Heavy Test Flight: Dual Synchronized Booster Landing",
    year: "2018",
    platform: "SpaceX Official / YouTube",
    duration: "5m",
    rating: "Milestone Classic",
    summary:
      "Maiden flight of Falcon Heavy featuring dual side boosters returning to Cape Canaveral landing pads in unison after lofting payload toward Mars heliocentric orbit.",
    keyTakeaways: [
      "Proved synchronized autonomous multi-booster recovery at supersonic speeds.",
      "Validated heavy-lift commercial launch competitiveness.",
      "Set operational groundwork for triple-core national security & deep-space missions.",
    ],
    whyItMattersToDysonSwarm:
      "Marked the moment heavy-lift rocketry crossed from single-use government rockets into reusable commercial logistics.",
    trailerUrl: "https://www.youtube.com/watch?v=wbSwFU6tY1c",
    youtubeId: "wbSwFU6tY1c",
    thumbnailBadge: "HISTORIC CLASSIC",
  },
];

export const NASA_ARTEMIS_MISSIONS: ArtemisMission[] = [
  {
    id: "artemis-1",
    missionName: "Artemis I: Uncrewed Orion Lunar Flight Test",
    targetDate: "Nov 16 – Dec 11, 2022 (Completed)",
    crew: [
      "Commander Moonikin Campos (Test Manikin)",
      "Helga & Zohar (Radiation Phantoms)",
    ],
    rocketAndVehicle: "Space Launch System (SLS) Block 1 + Orion Spacecraft",
    objective:
      "Test the SLS rocket, Orion Avcoat heatshield during Mach 32 return re-entry, and Distant Retrograde Orbit navigation around the Moon.",
    highSchoolBreakdown:
      "An uncrewed 1.3-million-mile dress rehearsal around the Moon to test Orion's heat shield and radiation sensors before astronauts climbed aboard.",
    keyTechnologies: [
      "5,000°F Avcoat Heatshield",
      "European Service Module Solar Wings",
      "Distant Retrograde Lunar Orbit (DRO)",
    ],
    roleInDysonFuture:
      "Validated human-rated deep-space hardware beyond Earth’s protective magnetosphere.",
    status: "Completed",
  },
  {
    id: "artemis-2",
    missionName: "Artemis II: Crewed Lunar Flyby Return",
    targetDate: "Apr 1 – Apr 11, 2026 (Completed)",
    crew: [
      "Reid Wiseman (Commander)",
      "Victor Glover (Pilot)",
      "Christina Koch (Mission Specialist)",
      "Jeremy Hansen (CSA Specialist)",
    ],
    rocketAndVehicle: "SLS Block 1 + Orion Spacecraft (Crewed)",
    objective:
      "Flew four astronauts on a 10-day free-return trajectory around the Moon, testing deep-space life support, manual proximity handling, and optical laser comms.",
    highSchoolBreakdown:
      "Four astronauts flew around the far side of the Moon in April 2026 and returned safely to Earth—humanity's farthest crewed voyage in 50+ years.",
    keyTechnologies: [
      "Closed-Loop Life Support (ECLSS)",
      "Deep Space Optical Communications (O2O)",
      "Manual Proximity Operations",
    ],
    roleInDysonFuture:
      "Verified human deep-space communications, radiation shielding, and crew endurance in cislunar flight.",
    status: "Completed",
  },
  {
    id: "artemis-3",
    missionName: "Artemis III: Crewed LEO HLS Rendezvous & Docking Rehearsal",
    targetDate: "NET Summer 2027 (In Preparation)",
    crew: [
      "Randy Bresnik (NASA)",
      "Frank Rubio (NASA)",
      "Andre Douglas (NASA)",
      "Luca Parmitano (ESA)",
    ],
    rocketAndVehicle:
      "SLS + Orion + Commercial HLS Test Articles (SpaceX Starship / Blue Moon)",
    objective:
      "Redesigned 14-day crewed test mission in Low Earth Orbit to validate autonomous rendezvous, docking, EVA suits, and habitation systems with commercial lander prototypes before attempting a Moon touchdown.",
    highSchoolBreakdown:
      "Before landing astronauts on the Moon, NASA will dock Orion directly with SpaceX Starship and Blue Origin lander test vehicles in Earth orbit during summer 2027 to retire docking and life-support risk.",
    keyTechnologies: [
      "Orion-to-HLS Automated Docking",
      "Axiom Next-Gen AxEMU Suits",
      "Orbital Cryogenic Boil-Off Control",
    ],
    roleInDysonFuture:
      "Proves multi-vehicle orbital assembly and pressurized transfer mechanics needed to construct large orbital platforms.",
    status: "In Preparation",
  },
  {
    id: "artemis-4",
    missionName: "Artemis IV: Lunar South Pole Touchdown & Gateway",
    targetDate: "NET 2028 (Planned Phase)",
    crew: ["4 Crew Members (Surface + Lunar Orbit Split)"],
    rocketAndVehicle: "SLS + Orion + Human Landing System + Gateway Elements",
    objective:
      "Execute humanity's next crewed landing near the Lunar South Pole to inspect permanently shadowed craters and advance sustainable cislunar surface infrastructure.",
    highSchoolBreakdown:
      "Once 2027's Earth-orbit docking dress rehearsal checks out, astronauts take the commercial lander down to the Moon's South Pole to study water ice.",
    keyTechnologies: [
      "Lunar South Pole Precision Landing",
      "Cryogenic Water-Ice Prospecting",
      "Cislunar Power & Comms Relays",
    ],
    roleInDysonFuture:
      "South Pole water ice can be electrolyzed into hydrogen and oxygen rocket propellant—reducing fuel dependency on Earth's deep gravity well.",
    status: "Planned Phase",
  },
];

export const DYSON_SWARM_EXPLAINER_CONCEPTS: DysonExplainerConcept[] = [
  {
    id: "concept-0",
    title: "The Kardashev Scale & Off-World Energy Scaling",
    subtitle: "Why Civilizations Hit Planetary Energy Ceilings",
    simpleAnalogy:
      "A single room only holds so much electricity and heat. Scaling industrial compute or clean baseload energy indefinitely forces engineers to look at abundant solar flux outside Earth’s atmosphere.",
    theBigProblem:
      "Global AI clusters already face 44+ month utility grid interconnection queues and thermal/water limits. Capturing energy inside Earth’s thick atmosphere loses solar flux to night cycles, weather, and atmospheric absorption.",
    theEngineeringSolution:
      "In the long run, high-cadence reusable lift turns orbit from a luxury science arena into an energy and communications workspace—starting today with Starlink constellations and advancing toward R&D Space-Based Solar Power.",
    keyStats: [
      { label: "Type I Civilization", value: "Controls Planetary Energy (~10¹⁶ W)" },
      { label: "Type II Civilization", value: "Controls Stellar Energy (~10²⁶ W)" },
      { label: "Type III Civilization", value: "Controls Galactic Energy (~10³⁶ W)" },
    ],
    difficultyRating: "Level 2: Orbital Physics",
  },
  {
    id: "concept-1",
    title: "Swarm vs Solid Sphere (Why Satellites Win)",
    subtitle: "Real Engineering vs Sci-Fi Misconceptions",
    simpleAnalogy:
      "Building a single hollow shell around a star would tear itself apart like a giant eggshell with no gravity support. A swarm of millions of independent orbital satellites moves stably under Kepler's laws.",
    theBigProblem:
      "A rigid spherical shell around the Sun has zero net gravitational attraction to the star and experiences extreme compressive stress that no known material can survive.",
    theEngineeringSolution:
      "Freeman Dyson’s actual 1960 paper envisioned a loose swarm of independent solar-collecting objects in staggered non-colliding Keplerian orbits. Every satellite balances gravity naturally via orbital velocity.",
    keyStats: [
      { label: "AM0 Solar Constant (1 AU)", value: "1,361 W/m²" },
      { label: "Earth Capture Share", value: "~1 part in 2 Billion" },
      { label: "Current Reality Check", value: "Pure Concept (0 MW Built)" },
    ],
    difficultyRating: "Level 1: The Basics",
  },
  {
    id: "concept-2",
    title: "Why Full Rapid Reusability Is the Precondition",
    subtitle: "Breaking the Rocket Equation Cost Wall",
    simpleAnalogy:
      "If every FedEx cargo plane crashed after a single flight, overnight shipping would cost $50,000 a box. Reusing both stages turns launch cost from factory metal into fuel + maintenance.",
    theBigProblem:
      "Putting 1 kg into Low Earth Orbit historically cost $5,000–$50,000/kg because rockets were thrown into the ocean every flight.",
    theEngineeringSolution:
      "Catching both the Super Heavy booster (Flight 5+) and the Starship upper stage (Ship 42 on Flight 15, Nov 2026) demonstrates path-to-airline turnaround. Modeled high-cadence flights target <$100/kg.",
    keyStats: [
      { label: "Space Shuttle Historical", value: "~$54,500 / kg" },
      { label: "Falcon 9 Internal Marginal", value: "~$1,450 / kg" },
      { label: "Starship V3 Modeled Target", value: "< $100 / kg (Projected)" },
    ],
    difficultyRating: "Level 1: The Basics",
  },
  {
    id: "concept-3",
    title: "Lunar Mining & In-Space Propellant Economics",
    subtitle: "Escaping Earth's Gravity Well at 1/6th Gravity",
    simpleAnalogy:
      "Throwing a baseball off a small trampoline takes tiny effort compared to climbing out of a steep canyon. Earth's gravity well is deep (~9.4 km/s Δv); the Moon's is shallow (~2.4 km/s Δv).",
    theBigProblem:
      "Roughly 85–90% of a terrestrial rocket's liftoff mass is fuel just to escape Earth's atmosphere and steep gravity well.",
    theEngineeringSolution:
      "Water ice confirmed in permanently shadowed Lunar South Pole craters can be split into liquid hydrogen/oxygen, while regolith contains silicon, iron, aluminum, and oxygen for future orbital construction.",
    keyStats: [
      { label: "Lunar Surface Gravity", value: "1.62 m/s² (16.5% Earth)" },
      { label: "LEO Delta-V Penalty", value: "~9.4 km/s from Earth" },
      { label: "Lunar Escape Speed", value: "2.38 km/s vs 11.2 km/s" },
    ],
    difficultyRating: "Level 2: Orbital Physics",
  },
  {
    id: "concept-4",
    title: "Wireless Power Beaming & Ground Rectennas (SBSP)",
    subtitle: "Closing the Orbital-to-Grid Circuit (R&D Phase)",
    simpleAnalogy:
      "Converting orbital sunlight into microwave beams aimed at a ground antenna field (rectenna) that turns radio energy into grid AC power without clouds blocking the source.",
    theBigProblem:
      "High-frequency microwave beams diffract over 36,000 km geostationary distance, requiring kilometer-scale phased arrays in space and square-kilometer rectenna farms on the ground.",
    theEngineeringSolution:
      "Initiatives like Caltech SSPP (MAPLE in-orbit beam demo), NASA OTPS, and ESA SOLARIS study lightweight deployable PV transmitters—still in R&D and not yet commercially competitive vs terrestrial power.",
    keyStats: [
      { label: "Caltech MAPLE Demo", value: "Milliwatt In-Space Proof" },
      { label: "RF Atmospheric Window", value: "2.45 GHz or 5.8 GHz" },
      { label: "Commercial Grid Status", value: "Unproven / Long-Term R&D" },
    ],
    difficultyRating: "Level 3: Megastructure Engineering",
  },
];

export const SPACE_ACADEMY_GLOSSARY: SpaceGlossaryTerm[] = [
  {
    id: "term-am0",
    term: "AM0 Solar Irradiance Constant",
    category: "Solar & Energy",
    formulaOrMetric: "G_sc ≈ 1,361 W/m²",
    plainEnglish:
      "The raw amount of sunlight hitting one square meter right outside Earth's atmosphere—roughly 36% higher at noon and available ~24/7 in Sun-Synchronous or GEO orbit without clouds.",
    technicalNote:
      "Air Mass Zero (AM0) skips atmospheric scattering and nighttime dark hours, letting orbital arrays achieve >99% capacity factor in dawn-dusk orbits vs 15–25% for Earth ground solar.",
    sourceLabel: "NASA OTPS Space-Based Solar Report",
    sourceUrl: "https://www.nasa.gov/organizations/otps/space-based-solar-power-report/",
  },
  {
    id: "term-deltav",
    term: "Delta-V (Δv) & Tsiolkovsky Rocket Equation",
    category: "Propulsion & Launch",
    formulaOrMetric: "Δv = Isp · g₀ · ln(m₀ / mf)",
    plainEnglish:
      "The total 'change in velocity budget' required to maneuver in space. Reaching Low Earth Orbit takes ~9.4 km/s including atmospheric drag and gravity losses.",
    technicalNote:
      "Because mass grows exponentially inside ln(m0/mf), reusable orbital refueling dramatically multiplies payload deliverable to the Moon (Artemis HLS) or Mars.",
    sourceLabel: "NASA Orbital Mechanics Basics",
    sourceUrl: "https://www.nasa.gov/humans-in-space/artemis/",
  },
  {
    id: "term-celestrak-gp",
    term: "NORAD GP Ephemeris & OPS_STATUS_CODE",
    category: "Constellation Comms",
    formulaOrMetric: "SGP4 Orbital Elements / SATCAT",
    plainEnglish:
      "The public catalog published by US Space Force tracking every operational and tumbling satellite in orbit—including whether a Starlink satellite is operational ('+') or still raising/testing.",
    technicalNote:
      "Stock Bloc polls CelesTrak's official SATCAT Starlink group rather than hardcoding stale figures, filtering operational '+' spacecraft separately from newly deployed orbit-raising stacks.",
    sourceLabel: "CelesTrak Starlink Catalog",
    sourceUrl: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink",
  },
  {
    id: "term-sso",
    term: "Sun-Synchronous Orbit (SSO)",
    category: "Orbital Mechanics",
    formulaOrMetric: "i ≈ 97.4° – 98.6° @ 500–1,150 km",
    plainEnglish:
      "A polar-tilted orbit whose plane precesses 360° per year so satellites always pass over a given latitude at the exact same local solar time (or surf perpetual sunlight along the dawn-dusk terminator).",
    technicalNote:
      "Planet Labs SuperDoves use ~97.4° SSO for uniform shadows during daily Earth scans, while dawn-dusk SSO keeps hypothetical solar arrays pointed continuously at the Sun.",
    sourceLabel: "ESA SOLARIS Initiative",
    sourceUrl: "https://www.esa.int/Enabling_Support/Space_Engineering_Technology/SOLARIS",
  },
  {
    id: "term-vacuum-laser",
    term: "Inter-Satellite Optical Laser Links (ISLL)",
    category: "Constellation Comms",
    formulaOrMetric: "c = 299,792 km/s vs c/1.468 in silica fiber",
    plainEnglish:
      "Photons move ~47% faster in orbital vacuum than through undersea glass fiber cables, letting laser-linked satellites bridge trans-oceanic financial routes faster than terrestrial subsea fiber.",
    technicalNote:
      "V2 Mini and V3 satellites deploy coherent optical transceivers (>100 Gbps per link) using precision pointing, acquisition, and tracking (PAT) across LEO shells.",
    sourceLabel: "FCC Space Bureau Filings",
    sourceUrl: "https://www.fcc.gov/space-bureau",
  },
  {
    id: "term-rectenna",
    term: "Rectenna & Microwave Power Beaming",
    category: "Dyson Theory",
    formulaOrMetric: "f = 2.45 GHz or 5.8 GHz RF → DC",
    plainEnglish:
      "A ground field of dipole antennas wired to rectifying diodes that catch harmless low-density microwave beams from space solar satellites and convert them straight into grid electricity.",
    technicalNote:
      "Caltech's SSPP MAPLE instrument demonstrated wireless RF beam steering in LEO in 2023; scaling to utility gigawatts still requires multi-kilometer arrays and far lower $/kg launch cost.",
    sourceLabel: "Caltech Space Solar Power Project",
    sourceUrl: "https://www.sspp.caltech.edu/",
  },
];

export const ORBITAL_CHALLENGES: OrbitalChallengeQuestion[] = [
  {
    id: "q1-delta-v",
    topic: "Launch Economics",
    question:
      "Why did Ship 42's successful Mechazilla tower catch on Flight 15 (Nov 14, 2026) matter so dramatically for orbital $/kg cost modeling?",
    options: [
      "It doubled rocket exhaust speed beyond physical Raptor Isp limits.",
      "Recovering both booster and orbital upper stage amortizes vehicle capex over many flights so launch cost approaches propellant + pad operations.",
      "It eliminated the need for liquid oxygen in spaceflight.",
      "It allowed Falcon 9 to reach Geostationary Orbit without a second stage.",
    ],
    correctIndex: 1,
    formulaHint: "Marginal Cost = (StackCapex / Reuses) + Propellant + PadOps",
    explanation:
      "When hardware isn't thrown into the ocean every flight, amortization per flight shrinks proportionally with reuse count—dropping modeled cost toward ~$2M–$10M per flight across 100–200 metric tons.",
  },
  {
    id: "q2-vacuum-light",
    topic: "Laser Mesh",
    question:
      "Why can Starlink optical laser links beat subsea fiber cables across London ↔ Singapore or New York ↔ Tokyo?",
    options: [
      "Satellites fly lower underground where gravity bends radio waves faster.",
      "Silica optical fiber has refractive index n ≈ 1.468, slowing light by ~31% compared to c = 299,792 km/s in orbital vacuum, and follows longer trench detours.",
      "Subsea cables only transmit data once per minute due to ocean salinity.",
      "Laser beams exceed the vacuum speed of light inside the ionosphere.",
    ],
    correctIndex: 1,
    formulaHint: "v_fiber = c / n ≈ 204,200 km/s vs v_vacuum = 299,792 km/s",
    explanation:
      "Light propagates through vacuum at pure c (299,792 km/s) along great-circle arcs, whereas subsea glass fiber bends around coastlines/trenches and slows photons by the silica refractive index n = 1.468.",
  },
  {
    id: "q3-am0-flux",
    topic: "Space Solar (SBSP)",
    question:
      "Approximately how strong is solar irradiance outside Earth's atmosphere (AM0) compared to typical sea-level noon sunlight (~1,000 W/m²), and why does orbital capacity factor rise?",
    options: [
      "~500 W/m² because space is cold; uptime stays ~25%.",
      "~1,361 W/m² continuously (~99% capacity factor in dawn-dusk Sun-Synchronous or GEO orbits with zero cloud cover).",
      "~10,000 W/m² because Earth's atmosphere blocks 90% of visible light.",
      "Identical to desert solar farms at ~22% annual capacity factor.",
    ],
    correctIndex: 1,
    formulaHint: "Solar Constant AM0 = 1,361 W/m² · No weather / minimal eclipse in GEO/SSO",
    explanation:
      "Above atmospheric Rayleigh scattering and clouds, solar irradiance sits at 1,361 W/m² year-round. Combined with near-continuous illumination in GEO or dawn-dusk SSO, energy yield per m² of cell far exceeds terrestrial PV—though launch mass and RF conversion losses remain tough hurdles.",
  },
  {
    id: "q4-dyson-swarm",
    topic: "Orbital Physics",
    question:
      "Why did physicist Freeman Dyson propose an orbital 'swarm' of independent collectors rather than a solid rigid sphere enclosing a star?",
    options: [
      "Solid spheres reflect too much starlight back into Earth's oceans.",
      "A rigid shell suffers immense gravitational compressive instability and feels zero net attraction to keep centered around the star, whereas independent collectors ride stable Keplerian orbits.",
      "A solid sphere violates Einstein's speed of light inside a vacuum.",
      "Swarms do not require solar panels to capture energy.",
    ],
    correctIndex: 1,
    formulaHint: "Newton Shell Theorem: Net gravity inside a hollow sphere = 0",
    explanation:
      "By Newton's Shell Theorem, a solid rigid Dyson sphere experiences zero net restoring gravitational force toward its host star and would tear apart under colossal structural stress. Individual satellites remain stably suspended in elliptical orbits.",
  },
  {
    id: "q5-artemis",
    topic: "Artemis",
    question:
      "Following Artemis II's April 2026 crewed lunar flyby, what is NASA's updated primary objective for Artemis III (scheduled NET summer 2027)?",
    options: [
      "Launching uncrewed probes to Jupiter's moon Europa.",
      "A 14-day crewed Low Earth Orbit rendezvous, docking, and EVA habitation test with commercial Human Landing System test articles (Starship & Blue Moon) ahead of a 2028 lunar landing.",
      "Deploying 1,000 Starlink satellites from SLS Block 1.",
      "Retiring the Orion capsule permanently after April 2026.",
    ],
    correctIndex: 1,
    formulaHint: "Artemis II (Apr 2026) → Artemis III LEO HLS Docking (2027) → Artemis IV Landing (2028)",
    explanation:
      "After Artemis II's successful April 2026 lunar flyby, NASA updated Artemis III into a critical Low Earth Orbit rendezvous and docking testbed in 2027 to retire operational risk before attempting the lunar South Pole touchdown in 2028.",
  },
  {
    id: "q6-celestrak",
    topic: "Orbital Physics",
    question:
      "When evaluating CelesTrak's public Starlink catalog (11,208 total objects vs 10,941 marked operational '+' in Nov 2026), why do total cataloged satellites exceed active service nodes?",
    options: [
      "The difference represents newly launched satellites still orbit-raising via ion thrusters or undergoing on-orbit checkout.",
      "CelesTrak counts commercial airliners flying above 35,000 feet.",
      "Starlink satellites shrink by 50% after 30 days in orbit.",
      "Each Starlink satellite splits into 4 pieces during solar flares.",
    ],
    correctIndex: 0,
    formulaHint: "Total On-Orbit = Operational ('+') + Raising / Checkout / Partial Status",
    explanation:
      "Falcon 9 and Starship insert satellites into an injection parking orbit (~250–350 km), after which spacecraft use onboard electric thrusters over weeks to climb into their operational 540–560 km shell.",
  },
];

export const AEROSPACE_RESEARCH_PROMPTS: AerospacePromptTemplate[] = [
  {
    id: "space_10k_comparator",
    title: "SPACE & POWER EQUITY 10-K / 8-K SCREENER",
    targetModel: "Gemini 2.5 Pro / Claude / DeepSeek-R1",
    category: "Public Equities",
    description:
      "Compare cash runway, backlog conversion, launch/launch-cadence exposure, and behind-the-meter power margins across RKLB, ASTS, LUNR, PL, BE, CEG, and TLN.",
    promptText: `[SYSTEM PROMPT - AEROSPACE & DATA-CENTER POWER EQUITY ANALYST]
Using recent SEC 10-K / 10-Q / 8-K filings (available via Stock Bloc /api/v1/sec/data and /api/v1/sec/8k-events):
1. Compare Revenue Backlog, Free Cash Flow burn/yield, and Net Debt for RKLB, ASTS, LUNR, and PL.
2. Contrast SpaceX Starship V3 cadence (~26 V3 Starlink/flight) impact on Rocket Lab Neutron ($RKLB) vs smallsat rideshare competition.
3. Compare Behind-the-Meter Data Center Power economics ($BE Solid-Oxide Fuel Cells vs $CEG / $TLN Nuclear PPAs) on LCOE, time-to-megawatt, and interconnection queue risk.
4. Separate verified reported metrics from modeled multi-year projections in your final markdown table.`,
  },
  {
    id: "starlink_celestrak_audit",
    title: "CELESTRAK STARLINK SHELL & CONJUNCTION AUDITOR",
    targetModel: "Claude / GPT-4o / Autonomous Quant Agents",
    category: "Orbital Telemetry",
    description:
      "Analyze live CelesTrak SATCAT operational counts, orbit-raising batches, and Starship V3 replenishment cadence.",
    promptText: `[SYSTEM PROMPT - LEO CONSTELLATION CAPACITY ANALYST]
Ingest live Stock Bloc /api/v1/space/telemetry and /api/space/starlink-status payloads:
1. Report exact operational vs orbit-raising vs decayed Starlink satellite counts from CelesTrak SATCAT.
2. Calculate effective global downlink bandwidth addition assuming 26 V3 satellites per Starship orbital flight (Flight 14 & Flight 15 Ship 42 baseline).
3. Assess shell fill percentages across 550 km Mid-Latitude, 350 km Direct-to-Cell, and 97.6° Polar SSO inclination bands.
4. Output JSON capacity delta suitable for telecom ARPU and latency sensitivity models.`,
  },
  {
    id: "sbsp_vs_terrestrial_memo",
    title: "ORBITAL SBSP VS HYPERSCALE POWER FEASIBILITY MEMO",
    targetModel: "DeepSeek-R1 / Gemini / Investment Committee",
    category: "Energy Arbitrage",
    description:
      "Stress-test Space-Based Solar Power LCOE assumptions against PJM/ERCOT grid queues, natural gas turbines, and nuclear SMR timelines.",
    promptText: `[SYSTEM PROMPT - ENERGY INFRASTRUCTURE & SBSP RISK AUDITOR]
Critically evaluate Space-Based Solar Power (SBSP) against terrestrial AI data center power alternatives:
1. Start from the 1,361 W/m² AM0 solar constant and apply realistic PV conversion (~28%), DC-to-RF conversion (~65%), beam collection (~75%), and rectenna DC-grid (~85%) end-to-end chain efficiency.
2. Calculate the break-even $/kg launch cost required to beat behind-the-meter Bloom SOFC ($88/MWh, 6-month deploy) and Nuclear PPAs ($105/MWh).
3. Explicitly tag all SBSP numbers as unbuilt R&D projections vs verified empirical Lazard/EIA terrestrial benchmarks.`,
  },
  {
    id: "artemis_cislunar_roadmap",
    title: "NASA ARTEMIS & COMMERCIAL HLS MILESTONE TRACKER",
    targetModel: "Claude / Gemini / Aerospace Research",
    category: "Cislunar Exploration",
    description:
      "Track Artemis II post-flight telemetry, Artemis III 2027 LEO HLS docking criteria, and contractor exposure.",
    promptText: `[SYSTEM PROMPT - ARTEMIS & CISLUNAR PROGRAM ANALYST]
Review current NASA Artemis mission gates after Artemis II (April 2026) and Starship Flight 15 (November 2026):
1. Summarize key risk-retirement milestones for Artemis III's 14-day Low Earth Orbit docking rehearsal (NET Summer 2027).
2. Map critical-path hardware dependencies across SLS, Orion, SpaceX Starship HLS, Blue Origin Blue Moon, Axiom AxEMU suits, and Intuitive Machines ($LUNR) CLPS.
3. Highlight schedule-slip risks vs contract award catalysts for public supply-chain equities.`,
  },
];

export const SPACEX_OFFICIAL_PORTALS: SpacePortalLink[] = [
  {
    id: "celestrak-starlink",
    name: "CelesTrak NORAD Starlink Catalog",
    category: "Research",
    url: "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink",
    description:
      "Authoritative NORAD GP orbital elements and operational status tracking for every Starlink satellite on orbit.",
    badge: "Live Ephemeris",
    iconType: "starlink",
  },
  {
    id: "satellitemap-space",
    name: "SatelliteMap.Space (3D Starlink Tracker)",
    category: "Starlink",
    url: "https://satellitemap.space/",
    description:
      "Interactive external 3D Earth globe tracking active Starlink, OneWeb & GPS constellations.",
    badge: "External 3D Map",
    iconType: "starlink",
  },
  {
    id: "spx-main",
    name: "SpaceX Official Website",
    category: "SpaceX",
    url: "https://www.spacex.com",
    description: "Official portal for Starship, Falcon 9, Falcon Heavy, and Dragon missions.",
    badge: "Official Site",
    iconType: "spacex",
  },
  {
    id: "spx-yt",
    name: "SpaceX YouTube Channel",
    category: "YouTube",
    url: "https://www.youtube.com/@SpaceX",
    description: "Official SpaceX YouTube channel for launch webcasts and engineering updates.",
    badge: "Official YouTube",
    iconType: "youtube",
  },
  {
    id: "spx-starship",
    name: "SpaceX Starship Program",
    category: "SpaceX",
    url: "https://www.spacex.com/vehicles/starship",
    description: "Fully reusable heavy-lift vehicle documentation including orbital recovery updates.",
    badge: "Starship V3",
    iconType: "spacex",
  },
  {
    id: "spx-launches",
    name: "SpaceX Launch Manifest",
    category: "SpaceX",
    url: "https://www.spacex.com/launches",
    description: "Official schedule and mission summaries for upcoming SpaceX launches.",
    badge: "Live Manifest",
    iconType: "spacex",
  },
  {
    id: "starlink-main",
    name: "Starlink Broadband",
    category: "Starlink",
    url: "https://www.starlink.com",
    description: "Global high-speed, low-latency LEO broadband and Direct-to-Cell network.",
    badge: "LEO Network",
    iconType: "starlink",
  },
  {
    id: "pl-main",
    name: "Planet Labs Official",
    category: "Planet Labs",
    url: "https://www.planet.com",
    description: "Daily global satellite Earth observation & Tanager hyperspectral imaging.",
    badge: "PL Fleet",
    iconType: "planet",
  },
  {
    id: "nasa-artemis",
    name: "NASA Artemis Program",
    category: "NASA",
    url: "https://www.nasa.gov/humans-in-space/artemis/",
    description:
      "Official NASA portal for Artemis II archive, Artemis III 2027 LEO HLS docking test, and 2028 lunar plans.",
    badge: "NASA Artemis",
    iconType: "nasa",
  },
  {
    id: "nasa-otps-sbsp",
    name: "NASA OTPS Space-Based Solar Report",
    category: "Research",
    url: "https://www.nasa.gov/organizations/otps/space-based-solar-power-report/",
    description:
      "NASA Office of Technology, Policy, and Strategy engineering and cost evaluation of SBSP.",
    badge: "SBSP Study",
    iconType: "nasa",
  },
  {
    id: "caltech-sspp",
    name: "Caltech Space Solar Power Project (SSPP)",
    category: "Research",
    url: "https://www.sspp.caltech.edu/",
    description:
      "Academic research initiative behind the SSPD-1 and MAPLE wireless space power beaming demonstrator.",
    badge: "Caltech R&D",
    iconType: "nasa",
  },
  {
    id: "fcc-space-bureau",
    name: "FCC Space Bureau Licensing",
    category: "Research",
    url: "https://www.fcc.gov/space-bureau",
    description:
      "US Federal Communications Commission orbital shell and spectrum licensing filings.",
    badge: "FCC Filings",
    iconType: "starlink",
  },
  {
    id: "esa-solaris",
    name: "ESA SOLARIS Initiative",
    category: "Research",
    url: "https://www.esa.int/Enabling_Support/Space_Engineering_Technology/SOLARIS",
    description:
      "European Space Agency preparatory program studying commercial feasibility of space-based solar power.",
    badge: "ESA R&D",
    iconType: "nasa",
  },
];
