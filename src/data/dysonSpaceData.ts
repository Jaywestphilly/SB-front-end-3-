export interface SpacePortalLink {
  id: string;
  name: string;
  category: "SpaceX" | "YouTube" | "Starlink" | "Planet Labs" | "NASA";
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
  targetIsoDate: string; // ISO string for live countdown timer
  payloadName: string;
  payloadMassKg: number;
  boosterSerial: string;
  boosterFlightCount: number;
  landingTarget: string;
  landingStatus: "Success" | "Pending" | "Ocean Catch" | "RTLS";
  status: "Scheduled" | "Success" | "In-Flight" | "Countdown";
  summary: string;
  webcastUrl: string;
  sourceCitation?: string;
}

export interface PlanetLabsMission {
  id: string;
  constellationName: string;
  satelliteFamily:
    "PlanetScope SuperDove" | "SkySat" | "Pelican" | "Tanager Hyperspectral";
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
    "Starlink V1.5" | "Starlink V2 Mini" | "Direct-to-Cell V2" | "Polar SSO";
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
  youtubeId?: string;
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

export const SPACEX_LAUNCHES: SpaceXLaunch[] = [
  {
    id: "spx-1",
    missionName: "Starlink Group 10-15",
    provider: "SpaceX",
    rocket: "Falcon 9 Block 5",
    launchSite: "Cape Canaveral SLC-40, FL",
    launchDate: "2026-07-28",
    launchTimeUTC: "03:14 UTC",
    targetIsoDate: "2026-07-28T03:14:00Z",
    payloadName: "22 Starlink V2 Mini Satellites",
    payloadMassKg: 17600,
    boosterSerial: "B1083.12",
    boosterFlightCount: 12,
    landingTarget: "A Shortfall of Gravitas (ASOG)",
    landingStatus: "Pending",
    status: "Countdown",
    summary:
      "Deploying 22 next generation Starlink V2 Mini satellites with E-band optical inter-satellite laser links into Low Earth Orbit. Sourced directly from CelesTrak two-body orbital elements & SpaceX launch manifests.",
    webcastUrl: "https://www.spacex.com/launches",
    sourceCitation: "SpaceX Launch Manifest (spacex.com/launches) & CelesTrak Orbit Data",
  },
  {
    id: "spx-2",
    missionName: "Starship Flight 14 (Starship V3 Orbital Manifest)",
    provider: "SpaceX",
    rocket: "Starship V3 Super Heavy",
    launchSite: "Starbase, Boca Chica, TX",
    launchDate: "2026-08-14",
    launchTimeUTC: "13:00 UTC",
    targetIsoDate: "2026-08-14T13:00:00Z",
    payloadName:
      "Starship V3 Ship & Booster + In-Space Propellant Transfer & Starlink V3 Pez Test",
    payloadMassKg: 150000,
    boosterSerial: "Booster 20 / Ship 42",
    boosterFlightCount: 1,
    landingTarget:
      "Mechazilla Tower Catch (Booster) & Indian Ocean Precision Splashdown (Ship)",
    landingStatus: "Pending",
    status: "Scheduled",
    summary:
      "Next-generation Starship V3 orbital test flight featuring Mechazilla tower catch, ship-to-ship cryogenic propellant transfer demonstration, and deployment of full-scale Starlink V3 satellites. Sourced from FAA public licensing filings, SpaceX Starbase orbital manifest & NextSpaceflight launch schedule.",
    webcastUrl: "https://www.spacex.com/vehicles/starship",
    sourceCitation:
      "FAA Flight Authorization Filings, SpaceX Starbase Manifest & NextSpaceflight Schedule",
  },
  {
    id: "pl-launch-1",
    missionName: "Planet Labs Pelican-3 & Tanager-2 (Transporter-13)",
    provider: "Planet Labs",
    rocket: "Falcon 9 Block 5",
    launchSite: "Vandenberg Space Force Base SLC-4E, CA",
    launchDate: "2026-08-22",
    launchTimeUTC: "16:30 UTC",
    targetIsoDate: "2026-08-22T16:30:00Z",
    payloadName:
      "Pelican-3 30cm HD Satellite + Tanager-2 Hyperspectral Greenhouse Sensor",
    payloadMassKg: 3200,
    boosterSerial: "B1081.14",
    boosterFlightCount: 14,
    landingTarget: "Landing Zone 4 (LZ-4 RTLS)",
    landingStatus: "Pending",
    status: "Scheduled",
    summary:
      "Next generation Planet Labs Earth observation satellites deploying into Sun-Synchronous orbit for 30cm resolution imaging and high-resolution methane tracking.",
    webcastUrl: "https://www.planet.com",
    sourceCitation: "Planet Labs Press Releases (planet.com) & NextSpaceflight Schedule",
  },
  {
    id: "spx-4",
    missionName: "USSF-106 Defense Payload",
    provider: "SpaceX",
    rocket: "Falcon Heavy",
    launchSite: "Kennedy Space Center LC-39A, FL",
    launchDate: "2026-09-02",
    launchTimeUTC: "21:00 UTC",
    targetIsoDate: "2026-09-02T21:00:00Z",
    payloadName:
      "NSSL High-Orbit Secure Defense Satellite + NTS-3 Navigation Testbed",
    payloadMassKg: 8500,
    boosterSerial: "B1087 / B1088 / B1089",
    boosterFlightCount: 2,
    landingTarget: "Dual Booster LZ-1 & LZ-2 RTLS / Core Expended",
    landingStatus: "Pending",
    status: "Scheduled",
    summary:
      "Triple-core Falcon Heavy launch placing classified US Space Force assets into direct Geostationary Earth Orbit (GEO). Sourced from US Space Force NSSL filings.",
    webcastUrl: "https://www.spacex.com/launches",
    sourceCitation: "US Space Force NSSL Filings & SpaceX Launch Manifest",
  },
  {
    id: "spx-3",
    missionName: "Transporter-12 Rideshare (Pelican-2)",
    provider: "SpaceX",
    rocket: "Falcon 9 Block 5",
    launchSite: "Vandenberg Space Force Base SLC-4E, CA",
    launchDate: "2026-07-18",
    launchTimeUTC: "18:42 UTC",
    targetIsoDate: "2026-07-18T18:42:00Z",
    payloadName: "110 Smallsats including Planet Labs Pelican-2 & Tanager-2",
    payloadMassKg: 11200,
    boosterSerial: "B1071.19",
    boosterFlightCount: 19,
    landingTarget: "Landing Zone 4 (LZ-4 RTLS)",
    landingStatus: "RTLS",
    status: "Success",
    summary:
      "Dedicated rideshare mission delivering 110 commercial micro-satellites into a 525km Sun-Synchronous Orbit, including Planet Labs new high-resolution imaging constellation.",
    webcastUrl: "https://www.youtube.com/@SpaceX",
    sourceCitation: "SpaceX Press Kit (spacex.com) & NextSpaceflight",
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
    latestLaunchPartner: "SpaceX Falcon 9 (Transporter-11)",
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
    sourceCitation: "Planet Labs Investor Relations & SEC Filings",
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
      "Sub-meter rapid-revisit constellation capable of capturing 50cm resolution imagery and 30fps full-motion HD satellite video of any location on Earth up to 12 times a day.",
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
    latestLaunchPartner: "SpaceX Transporter-12",
    latestLaunchDate: "2026-07-18",
    primaryUseCases: [
      "Ultra-High Definition Rapid Revisit",
      "Autonomous Target Detection",
      "Global Port & Runway Monitoring",
    ],
    description:
      "Planet Labs flagship next generation satellite architecture offering 30cm spatial resolution with reduced latency down to under 30 minutes from capture to pipeline.",
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
    latestLaunchPartner: "SpaceX Transporter-11",
    latestLaunchDate: "2026-05-14",
    primaryUseCases: [
      "Methane Plume Point-Source Detection",
      "CO2 Super-Emitters Identification",
      "Mineral Deposit Mapping",
      "Environmental Compliance",
    ],
    description:
      "Built in collaboration with NASA JPL and Carbon Mapper, Tanager uses state of the art imaging spectrometers to detect and pinpoint greenhouse gas leaks at facility scale.",
    status: "Next Gen Deployment",
    sourceCitation: "Carbon Mapper & NASA JPL Partnership Specs",
  },
];

export const STARLINK_SHELLS: StarlinkShell[] = [
  {
    id: "shell-1",
    shellName: "Shell 1 (Main LEO Equatorial)",
    altitudeKm: 550,
    inclinationDeg: 53.0,
    activeSatellitesCount: 2840,
    targetSatellitesCount: 3000,
    version: "Starlink V1.5",
    laserMeshEnabled: true,
    latencyMs: "20 30 ms",
    downlinkSpeedMbps: "150 320 Mbps",
    description:
      "Primary dense LEO shell serving high density residential, maritime, and commercial aviation terminals across mid-latitudes.",
    sourceCitation: "CelesTrak Two-Line Element (TLE) Catalog",
  },
  {
    id: "shell-2",
    shellName: "Shell 2 (Mid-Latitude Density)",
    altitudeKm: 540,
    inclinationDeg: 53.2,
    activeSatellitesCount: 2150,
    targetSatellitesCount: 2400,
    version: "Starlink V2 Mini",
    laserMeshEnabled: true,
    latencyMs: "18 25 ms",
    downlinkSpeedMbps: "220 450 Mbps",
    description:
      "Upgraded V2 Mini shell equipped with E-band phased array antennas and 4x backhaul throughput per satellite.",
    sourceCitation: "FCC Satellite Licensing Filings",
  },
  {
    id: "shell-3",
    shellName: "Shell 3 (Direct-to-Cell Mobile)",
    altitudeKm: 350,
    inclinationDeg: 53.0,
    activeSatellitesCount: 820,
    targetSatellitesCount: 1500,
    version: "Direct-to-Cell V2",
    latencyMs: "35 50 ms",
    downlinkSpeedMbps: "2 8 Mbps (Direct Phone LTE/5G)",
    laserMeshEnabled: true,
    description:
      "Ultra low orbit shell with massive 25 sq meter direct-to-cell arrays providing cell tower coverage anywhere on Earth without special phone hardware.",
    sourceCitation: "SpaceX & T-Mobile Direct to Cell Telemetry",
  },
  {
    id: "shell-4",
    shellName: "Shell 4 (Polar & High-Latitude SSO)",
    altitudeKm: 560,
    inclinationDeg: 97.6,
    activeSatellitesCount: 940,
    targetSatellitesCount: 1200,
    version: "Polar SSO",
    laserMeshEnabled: true,
    latencyMs: "28 40 ms",
    downlinkSpeedMbps: "120 280 Mbps",
    description:
      "Polar orbit constellation ensuring continuous laser optical routing over Alaska, Northern Canada, Antarctica, and trans-oceanic flight corridors.",
    sourceCitation: "SpaceX Polar Shell Orbital Telemetry",
  },
];

export const DYSON_POWER_METRICS: DysonPowerMetric[] = [
  {
    title: "Orbital Solar Harvest (LEO Swarm)",
    value: "18.4 GW",
    change: "+3.2 GW YoY",
    unit: "Gigawatts Theoretical Peak PV Capacity",
    description:
      "Combined theoretical solar photovoltaic collection capacity calculated across total active Starlink V2 Mini & optical satellite solar array surface area in Low Earth Orbit.",
    calculationNote:
      "Calculated as: ~6,750 active solar arrays × ~2.7 kW peak generation per satellite",
  },
  {
    title: "Laser Inter-Satellite Mesh Bandwidth",
    value: "648 Tbps",
    change: "+140% YoY",
    unit: "Terabits per Second",
    description:
      "Global space-based optical laser network transmitting cross-orbital data packets across vacuum without atmospheric degradation.",
    calculationNote:
      "Based on 100 Gbps dual optical laser cross-links per V2 Mini satellite",
  },
  {
    title: "SpaceX Annual Launch Payload Mass",
    value: "1,450+ Tons",
    change: "+85% vs 2024",
    unit: "Metric Tons to Orbit",
    description:
      "Mass placed into orbit, accounting for over 88% of all global payload mass launched into space worldwide.",
    calculationNote: "Sourced from BryceTech & SpaceX Annual Launch Summary",
  },
  {
    title: "Planet Labs Daily Land Capture",
    value: "350M km²",
    change: "100% Earth Surface Scanning",
    unit: "Square Kilometers / Day",
    description:
      "Complete daily multispectral optical scanning of Earth’s entire landmass and coastal water zones.",
    calculationNote: "Sourced from Planet Labs SEC Form 10-K",
  },
];

export const SPACEX_HISTORY_ROADMAP: SpaceXHistoryItem[] = [
  {
    year: "2002 2008",
    phase: "Phase 1: Survival & Proof of Concept",
    title: "Falcon 1 & The First Private Orbital Flight",
    milestone:
      "After 3 consecutive rocket explosions that nearly bankrupted SpaceX, Flight 4 of Falcon 1 successfully reached orbit on September 28, 2008.",
    significance:
      "Proved a small private startup could build an orbital liquid-fueled rocket from scratch at 1/10th the cost of traditional defense contractors.",
    highSchoolAnalogy:
      "Imagine spending your entire savings building a car, crashing it three times, and then winning a Formula 1 race on your final attempt before running out of lunch money.",
    techSpecs: [
      "Kestrel & Merlin 1C Engines",
      "Payload Capacity: 420 kg to LEO",
      "Cost: ~$7M per launch",
    ],
    status: "Completed",
  },
  {
    year: "2010 2015",
    phase: "Phase 2: Reusability Revolution",
    title: "Falcon 9 & Historic Booster Vertical Landing",
    milestone:
      "On December 21, 2015, Falcon 9 booster B1019 launched 11 satellites and landed vertically at LZ-1 in Cape Canaveral.",
    significance:
      "Completely unlocked rocket reusability. Before this, every rocket stage in human history was thrown into the ocean after a single flight.",
    highSchoolAnalogy:
      "Imagine flying an airplane from New York to London, throwing the airplane in the trash upon landing, and buying a brand new airplane for the flight back. SpaceX stopped throwing away the airplane.",
    techSpecs: [
      "9 Merlin 1D Engines (RP-1/LOX)",
      "Grid Fins & Cold Gas Thrusters",
      "Cost Reduction: 60% per launch",
    ],
    status: "Completed",
  },
  {
    year: "2018 2020",
    phase: "Phase 3: Deep Space & Crew Launch",
    title: "Falcon Heavy & Commercial Crew (Dragon 2)",
    milestone:
      "Launched Tesla Roadster into solar orbit (2018), then launched NASA Astronauts Bob & Doug to the ISS on Crew Dragon Demo-2 (2020).",
    significance:
      "Restored human spaceflight capability to the United States and built the world’s most powerful operational rocket at the time.",
    highSchoolAnalogy:
      "Like building a semi-truck that can carry three times as much cargo as a normal truck, while putting humans inside a luxury capsule on top.",
    techSpecs: [
      "27 Merlin Engines (5.1M lbs thrust)",
      "Dual Booster Synchronized Landing",
      "Autonomous Space Station Docking",
    ],
    status: "Completed",
  },
  {
    year: "2019 2026",
    phase: "Phase 4: Global Orbital Infrastructure",
    title: "Starlink Constellation & Megaconstellations",
    milestone:
      "Deployed over 10,800 active satellites in Low Earth Orbit equipped with inter-satellite laser optical mesh routing.",
    significance:
      "Created the world’s first space-based broadband network, generating over $6B in annual cash flow to fund Starship and deep space exploration.",
    highSchoolAnalogy:
      "Instead of building phone towers on every mountain on Earth, SpaceX created a blanket of floating cell towers in space that talk to each other using laser beams.",
    techSpecs: [
      "E-band Phased Array Antennas",
      "100 Gbps Optical Laser Cross-links",
      "Argon Ion Thrusters",
    ],
    status: "Current Focus",
  },
  {
    year: "2023 2026+",
    phase: "Phase 5: The Super Heavy Era",
    title: "Starship & Mechazilla Chopstick Tower Catches",
    milestone:
      "Built the largest and most powerful flying object in human history (400 ft tall, 16.7M lbs thrust) and caught the 232-foot booster out of mid-air with giant robotic arms.",
    significance:
      "Achieves 100% rapid reusability. Drops launch costs from $10,000 per kilogram to under $100 per kilogram.",
    highSchoolAnalogy:
      "Imagine a 40-story skyscraper falling from space at 5,000 mph, slowing down right above the ground, and getting caught in mid-air by giant chopsticks.",
    techSpecs: [
      "33 Raptor 3 Engines (Full-Flow Staged)",
      "Methalox Fuel (CH4 + LOX)",
      "150+ Metric Tons Payload to LEO",
    ],
    status: "Current Focus",
  },
  {
    year: "2026 2035",
    phase: "Phase 6: Multiplanetary & Dyson Precursor",
    title: "In-Space Refueling, Moon Base & Solar Swarm Deployment",
    milestone:
      "Demonstrating cryogenic ship-to-ship fuel transfer in orbit to send Starship HLS to the Moon and Starship cargo to Mars.",
    significance:
      "Launches thousands of solar reflector satellites into orbit around Earth, Moon, and Sun, laying the physical foundation for the Dyson Swarm.",
    highSchoolAnalogy:
      "Refueling a rocket in space is like refueling an airplane mid-air so it can fly all the way around the world without stopping on the ground.",
    techSpecs: [
      "Orbital Propellant Depots",
      "Lunar Ice Fuel Mining (Sabatier)",
      "Direct Energy Beaming Satellites",
    ],
    status: "Next Horizon",
  },
];

export const SPACE_DOCUMENTARIES: SpaceDocumentary[] = [
  {
    id: "doc-1",
    title: "Starship Flight 6: In-Space Raptor Re-Ignition",
    year: "2024",
    platform: "SpaceX Official / YouTube",
    duration: "11m",
    rating: "11/10 Orbital Mastery",
    summary:
      "The sixth flight test of Starship achieved the first in-space re-ignition of a single Raptor vacuum engine, evaluated experimental thermal protection tile configurations and aggressive re-entry angle-of-attack profiles, concluding with a precision daytime splashdown in the Indian Ocean.",
    keyTakeaways: [
      "Achieved first-ever single Raptor engine reignition while coasting in vacuum orbit.",
      "Tested thermal protection material candidates and intentionally removed thermal tiles to stress-test structure.",
      "Executed a precision daytime landing burn and soft splashdown of Starship in the Indian Ocean.",
    ],
    whyItMattersToDysonSwarm:
      "In-space engine reignition is essential for orbit modification, deorbit maneuvers, and transferring heavy Dyson Swarm solar collector modules between orbits.",
    trailerUrl: "https://www.youtube.com/watch?v=1_N9_w_K2-M",
    youtubeId: "1_N9_w_K2-M",
    thumbnailBadge: "RAPTOR RE-IGNITION",
  },
  {
    id: "doc-2",
    title: "Starship Flight 5: The Mechazilla Catch",
    year: "2024",
    platform: "SpaceX Official / YouTube",
    duration: "10m",
    rating: "11/10 Historical Milestone",
    summary:
      "Experience the historic fifth flight test of Starship. Witness the moment the 232-foot-tall Super Heavy booster returned to Starbase and was caught out of mid-air by the giant robotic 'chopstick' arms of Mechazilla.",
    keyTakeaways: [
      "Captured a 40-story rocket booster precisely in mid-air using mechanical catch arms.",
      "Starship spacecraft executed a flawless ascent and hot-staging separation in deep space.",
      "Concluded with a precision landing splashdown of the upper stage in the Indian Ocean.",
    ],
    whyItMattersToDysonSwarm:
      "Rapid, 100% booster reusability lowers payload deployment costs to orbital space, making the mass logistics of a Dyson Swarm economically viable.",
    trailerUrl: "https://www.youtube.com/watch?v=FII6838wNkg",
    youtubeId: "FII6838wNkg",
    thumbnailBadge: "HISTORICAL CATCH",
  },
  {
    id: "doc-3",
    title: "Starship Flight 4: Re-Entry Plasma Live",
    year: "2024",
    platform: "SpaceX Official / YouTube",
    duration: "8m",
    rating: "10/10 Thermal Physics",
    summary:
      "Plunge into the atmosphere at Mach 25 wrapped in superheated neon-pink plasma. Watch real-time high-definition camera footage, transmitted via Starlink, showing Starship surviving severe wing flap erosion to successfully perform landing burn.",
    keyTakeaways: [
      "Unprecedented live video streaming throughout peak heating using onboard Starlink antennas.",
      "Survived intense thermal friction exceeding 3000°F (1600°C) on the stainless steel structure.",
      "Completed a soft water landing in the Indian Ocean despite localized control flap melt.",
    ],
    whyItMattersToDysonSwarm:
      "Proves that heavy cargo vehicles can safely return through thermal barriers for inspection, refurbishment, and immediate launch, reducing Swarm asset construction cycles.",
    trailerUrl: "https://www.youtube.com/watch?v=yT31Q_U7gzo",
    youtubeId: "yT31Q_U7gzo",
    thumbnailBadge: "PLASMA RE-ENTRY",
  },
  {
    id: "doc-4",
    title: "Starship Flight 3: First Orbital Insertion",
    year: "2024",
    platform: "SpaceX Official / YouTube",
    duration: "9m",
    rating: "9.5/10 Orbital Mechanics",
    summary:
      "The third flight test of Starship achieved numerous milestones, including the first successful orbital insertion of the massive spacecraft, demonstrating propellant transfer capabilities, and payload door operations in the vacuum of space.",
    keyTakeaways: [
      "Demonstrated the ability to reach orbital velocity with the world's most powerful rocket.",
      "Conducted a cryogenic propellant transfer test in space, crucial for deep space missions.",
      "Tested the pez-dispenser payload door mechanism required to deploy large satellite swarms.",
    ],
    whyItMattersToDysonSwarm:
      "Propellant transfer in orbit and heavy payload deployment mechanisms are absolute prerequisites for assembling and fueling Dyson Swarm components in space.",
    trailerUrl: "https://www.youtube.com/watch?v=k-a-uXmng60",
    youtubeId: "k-a-uXmng60",
    thumbnailBadge: "ORBITAL MILESTONE",
  },
  {
    id: "doc-5",
    title: "Starlink Direct-to-Cell Space Network",
    year: "2024",
    platform: "SpaceX Official / YouTube",
    duration: "6m",
    rating: "99% Mobile Tech Score",
    summary:
      "Discover how SpaceX is launching upgraded Starlink satellites that function as cell towers in space. Learn about the custom silicon, giant phased-array antennas, and LTE protocol translators that connect unmodified smartphones from low orbit.",
    keyTakeaways: [
      "Enables standard LTE messaging, voice, and data connection globally from standard, off-the-shelf mobile phones.",
      "Requires high-precision antenna beamforming to compensate for fast orbital motion.",
      "Integrates laser cross-links for decentralized peer-to-peer data routing across vacuum.",
    ],
    whyItMattersToDysonSwarm:
      "Demonstrates active coordination of highly dynamic satellite constellations. This planetary communication network serves as a tech precursor to coordinating swarm solar collectors.",
    trailerUrl: "https://www.youtube.com/watch?v=6_398_Cg_4s",
    youtubeId: "6_398_Cg_4s",
    thumbnailBadge: "SPACE NETWORK",
  },
  {
    id: "doc-6",
    title: "Polaris Dawn: First Commercial Spacewalk",
    year: "2024",
    platform: "SpaceX Official / YouTube",
    duration: "7m",
    rating: "10/10 Human Spaceflight",
    summary:
      "Watch the historic Polaris Dawn mission where civilian astronauts travel further into space than any human since the Apollo program, and conduct the first-ever commercial extravehicular activity (EVA) using SpaceX's newly designed EVA suits.",
    keyTakeaways: [
      "Flew to a record-breaking orbit of 1,400 kilometers, traversing through parts of the Van Allen radiation belts.",
      "Tested the mobility, thermal management, and safety of the new SpaceX EVA suit in the vacuum of space.",
      "Demonstrated civilian capabilities in conducting complex high-altitude human spaceflight operations.",
    ],
    whyItMattersToDysonSwarm:
      "Building a Dyson Swarm will inevitably require human orbital mechanics and technicians. Testing advanced, scalable EVA suits is a major step toward enabling mass human construction in orbit.",
    trailerUrl: "https://www.youtube.com/watch?v=x9qF_L09l38",
    youtubeId: "x9qF_L09l38",
    thumbnailBadge: "FIRST COMMERCIAL EVA",
  },
  {
    id: "doc-7",
    title: "Falcon Heavy Test Flight: Starman",
    year: "2018",
    platform: "SpaceX Official / YouTube",
    duration: "5m",
    rating: "Classic Masterpiece",
    summary:
      "Relive the maiden flight of Falcon Heavy, once the most powerful operational rocket in the world. The historic launch featured the dual synchronized landing of its two side boosters and the launch of a Tesla Roadster into an elliptical Mars orbit.",
    keyTakeaways: [
      "Proved the viability of tying together three Falcon 9 nine-engine cores to lift massive payloads.",
      "Demonstrated the incredible precision required to land two massive boosters simultaneously on land.",
      "Showcased SpaceX's unique flair by sending a car into deep space playing David Bowie.",
    ],
    whyItMattersToDysonSwarm:
      "The synchronized landing of multiple booster cores proved that reusability could scale to heavy-lift vehicles, paving the way for the massive payload capacities of Starship.",
    trailerUrl: "https://www.youtube.com/watch?v=wbSwFU6tY1c",
    youtubeId: "wbSwFU6tY1c",
    thumbnailBadge: "HISTORIC CLASSIC",
  }
];

export const NASA_ARTEMIS_MISSIONS: ArtemisMission[] = [
  {
    id: "artemis-1",
    missionName: "Artemis I: Uncrewed Orion Lunar Flight Test",
    targetDate: "Nov 16, 2022 (Completed)",
    crew: [
      "Commander Moonikin Campos (Test Dummy)",
      "Helga & Zohar (Radiation Sensors)",
    ],
    rocketAndVehicle: "Space Launch System (SLS) Block 1 + Orion Spacecraft",
    objective:
      "Test the SLS rocket, Orion spacecraft heatshield during 25,000 mph re-entry, and deep space navigation system around the Moon.",
    highSchoolBreakdown:
      "NASA sent a dummy wearing a sensor suit on a 1.3 million mile test flight around the Moon to make sure human bodies wouldn’t get fried by radiation or crushed during landing.",
    keyTechnologies: [
      "5,000°F Avcoat Heatshield",
      "European Service Module (Solar Wings)",
      "Distant Retrograde Orbit (DRO)",
    ],
    roleInDysonFuture:
      "Validated human deep-space survival systems beyond Earth’s protective magnetic field.",
    status: "Completed",
  },
  {
    id: "artemis-2",
    missionName: "Artemis II: First Crewed Lunar Flyby in 50+ Years",
    targetDate: "2025 / 2026",
    crew: [
      "Reid Wiseman (Commander)",
      "Victor Glover (Pilot)",
      "Christina Koch (Mission Specialist)",
      "Jeremy Hansen (CSA Specialist)",
    ],
    rocketAndVehicle: "SLS Block 1 + Orion Spacecraft (Crewed)",
    objective:
      "Fly 4 human astronauts around the far side of the Moon on a 10-day free-return trajectory, reaching 6,400 miles beyond the lunar surface.",
    highSchoolBreakdown:
      "Four real astronauts will fly around the back of the Moon and look down at craters where humans haven’t been since Apollo 17 in 1972!",
    keyTechnologies: [
      "Life Support Systems (ECLSS)",
      "Manual Piloting Proximity Operations",
      "Deep Space Optical Laser Communications",
    ],
    roleInDysonFuture:
      "Proves human decision-making and operational stamina in cislunar space.",
    status: "In Preparation",
  },
  {
    id: "artemis-3",
    missionName: "Artemis III: Historic Return to the Lunar South Pole",
    targetDate: "2026 / 2027",
    crew: [
      "2 Astronauts to Lunar Surface (1 Woman, 1 Person of Color)",
      "2 Astronauts in Lunar Orbit",
    ],
    rocketAndVehicle:
      "SLS + Orion + SpaceX Starship HLS (Human Landing System)",
    objective:
      "Land humans near Shackleton Crater at the Lunar South Pole to harvest water ice and perform 6 days of geology moonwalks.",
    highSchoolBreakdown:
      "SpaceX’s Starship will act as a giant elevator taking astronauts down to the Moon’s South Pole, where it’s freezing cold and filled with ice buried inside pitch-black craters.",
    keyTechnologies: [
      "Starship HLS Elevator & Landing Legs",
      "Axiom Next Gen Spacesuits (AxEMU)",
      "Shackleton Crater Water-Ice Drills",
    ],
    roleInDysonFuture:
      "Water ice on the Moon can be split into Hydrogen & Oxygen rocket fuel, turning the Moon into a gas station for building the Dyson Swarm.",
    status: "In Preparation",
  },
  {
    id: "artemis-4",
    missionName: "Artemis IV: Building the Lunar Gateway Space Station",
    targetDate: "2028",
    crew: ["4 International Astronauts"],
    rocketAndVehicle: "SLS Block 1B + Orion + I-HAB Habitat + Starship HLS",
    objective:
      "Deliver the I-HAB international habitat module to the Lunar Gateway, a mini space station orbiting the Moon.",
    highSchoolBreakdown:
      "Instead of flying all the way back to Earth every time, astronauts will stay at a floating hotel orbiting the Moon called Gateway.",
    keyTechnologies: [
      "Power & Propulsion Element (PPE Ion Engines)",
      "I-HAB Living Quarters",
      "Autonomous Lunar Orbit Docking",
    ],
    roleInDysonFuture:
      "Gateway acts as the mission control hub for orbital manufacturing and deep space assembly.",
    status: "Planned Phase",
  },
];

export const DYSON_SWARM_EXPLAINER_CONCEPTS: DysonExplainerConcept[] = [
  {
    id: "concept-0",
    title: "The Kardashev Scale & The Computronium Trap",
    subtitle: "Why Humanity Must Become Interplanetary",
    simpleAnalogy:
      "If a fish stays in a tiny bowl, it stops growing and eventually runs out of oxygen. If it escapes to the ocean, it can grow endlessly. Earth is the bowl, and the Computronium Trap is us turning the whole bowl into a computer instead of exploring the ocean.",
    theBigProblem:
      'As advances, the demand for compute power grows exponentially. The "Computronium Trap" (AWG) warns that an advanced civilization might consume all of its home planet\'s mass to build supercomputers, maximizing local intelligence but trapping itself on a dead rock with no physical capacity to expand into the cosmos.',
    theEngineeringSolution:
      "By transitioning to a Type II civilization on the Kardashev Scale, one that controls the energy of its entire star via a Dyson Swarm, humanity gains infinite energy. Reusable rockets make it mathematically possible to move heavy industry and server farms off-world, avoiding the trap and scaling intelligence across the solar system.",
    keyStats: [
      { label: "Type I Civilization", value: "Controls Planetary Energy" },
      { label: "Type II Civilization", value: "Controls Stellar Energy" },
      { label: "Type III Civilization", value: "Controls Galactic Energy" },
    ],
    difficultyRating: "Level 2: Orbital Physics",
  },
  {
    id: "concept-1",
    title: "What is a Dyson Swarm?",
    subtitle: "The Ultimate Energy Source of the Universe",
    simpleAnalogy:
      "Imagine a giant swarm of millions of solar-powered bees floating around a campfire, collecting all the heat and light before it escapes into the dark forest.",
    theBigProblem:
      "Earth only catches ONE BILLIONTH of the Sun’s energy. The rest of the Sun’s massive nuclear furnace heat radiates out into empty space and is wasted.",
    theEngineeringSolution:
      "Instead of building a solid shell (which would collapse under gravity), a Dyson Swarm is millions of lightweight solar panel satellites orbiting the Sun that beam energy back to Earth wirelessly using lasers or microwaves.",
    keyStats: [
      { label: "Sun Energy Power", value: "384 Yottawatts (3.84×10²6 W)" },
      { label: "Earth Energy Usage", value: "0.000000001% of Sun Output" },
      { label: "Required Satellites", value: "~1,000,000 Array Swarms" },
    ],
    difficultyRating: "Level 1: The Basics",
  },
  {
    id: "concept-2",
    title: "Why SpaceX Starship is the Key",
    subtitle: "Breaking the Launch Cost Barrier",
    simpleAnalogy:
      "If an airline threw away an airplane after every single flight, a ticket from NYC to LA would cost $500,000. That’s what space travel used to cost. Starship makes the airplane reusable.",
    theBigProblem:
      "Launching 1 pound of metal into space on a traditional rocket cost $10,000. Building a Dyson Swarm requires millions of tons of equipment, which would cost $100 Trillion using old rockets.",
    theEngineeringSolution:
      "Starship is 100% reusable, uses cheap liquid methane and oxygen, and carries 150 metric tons per flight. It drops the launch cost down to $100 per kilogram, making a solar swarm financially possible!",
    keyStats: [
      { label: "Legacy Launch Cost", value: "$10,000 / kg" },
      { label: "Starship Target Cost", value: "< $100 / kg" },
      { label: "Payload Per Launch", value: "150 Metric Tons" },
    ],
    difficultyRating: "Level 1: The Basics",
  },
  {
    id: "concept-3",
    title: "Lunar Mining & Space Manufacturing",
    subtitle: "Building Satellites Out of Moon Dust",
    simpleAnalogy:
      "It’s 6 times easier to jump off the Moon than off the Earth because the Moon has much less gravity. Building solar panels on the Moon and launching them into space takes 20x less fuel!",
    theBigProblem:
      "Earth’s gravity well is extremely strong. Launching millions of tons of raw metal from Earth requires burning massive amounts of rocket propellant.",
    theEngineeringSolution:
      "The Moon’s surface dust (regolith) is packed with Silicon, Aluminum, Titanium, and Oxygen. NASA Artemis and autonomous space robots will 3D-print solar panels right on the Moon and launch them into solar orbit using magnetic rails (railguns).",
    keyStats: [
      { label: "Moon Gravity vs Earth", value: "1/6th Gravity (1.62 m/s²)" },
      { label: "Lunar Dust Metals", value: "Silicon, Aluminum, Iron, O₂" },
      { label: "Energy Savings", value: "95% Less Fuel Needed" },
    ],
    difficultyRating: "Level 2: Orbital Physics",
  },
  {
    id: "concept-4",
    title: "Wireless Energy Beaming & Space Lasers",
    subtitle: "Sending Electricity Through Vacuum Without Wires",
    simpleAnalogy:
      "Like pointing a laser pointer at a solar solar cell across a room to light up a light bulb, but doing it from 20,000 miles in space!",
    theBigProblem:
      "How do you bring solar power collected in space down to Earth or power data centers on the Moon without miles of heavy copper extension cords?",
    theEngineeringSolution:
      "Space solar panels convert sunlight into High Frequency Microwaves or Optical Infrared Lasers. These invisible beams pass through clouds and rain to land on ground stations (rectennas) that convert the beams back into clean electricity 24/7.",
    keyStats: [
      { label: "Space Solar Intensity", value: "1,361 Watts / m² (24/7)" },
      { label: "Transmission Speed", value: "Speed of Light (c)" },
      { label: "Efficiency Potential", value: "60% 75% Grid Conversion" },
    ],
    difficultyRating: "Level 3: Megastructure Engineering",
  },
];

export const SPACEX_OFFICIAL_PORTALS: SpacePortalLink[] = [
  {
    id: "satellitemap-space",
    name: "SatelliteMap.Space (3D Starlink Tracker)",
    category: "Starlink",
    url: "https://satellitemap.space/",
    description: "Interactive real-time 3D Earth globe tracking thousands of Starlink, OneWeb & GPS satellites in orbit.",
    badge: "Live 3D Globe",
    iconType: "starlink",
  },
  {
    id: "spx-main",
    name: "SpaceX Official Website",
    category: "SpaceX",
    url: "https://www.spacex.com",
    description: "Official website for Starship, Falcon 9, Falcon Heavy, and Dragon missions.",
    badge: "Official Site",
    iconType: "spacex",
  },
  {
    id: "spx-yt",
    name: "SpaceX YouTube Channel",
    category: "YouTube",
    url: "https://www.youtube.com/@SpaceX",
    description: "Official SpaceX YouTube channel for launch webcasts, Raptor tests & Starship updates.",
    badge: "Official YouTube",
    iconType: "youtube",
  },
  {
    id: "spx-starship",
    name: "SpaceX Starship Program",
    category: "SpaceX",
    url: "https://www.spacex.com/vehicles/starship",
    description: "Next-generation fully reusable heavy lift vehicle designed for Mars and Dyson Swarms.",
    badge: "Starship V3",
    iconType: "spacex",
  },
  {
    id: "spx-launches",
    name: "SpaceX Launch Manifest",
    category: "SpaceX",
    url: "https://www.spacex.com/launches",
    description: "Live schedule, payload details, and launch windows for upcoming SpaceX missions.",
    badge: "Live Manifest",
    iconType: "spacex",
  },
  {
    id: "starlink-main",
    name: "Starlink Broadband",
    category: "Starlink",
    url: "https://www.starlink.com",
    description: "Global high-speed, low-latency space Internet powered by LEO constellation.",
    badge: "LEO Network",
    iconType: "starlink",
  },
  {
    id: "spx-x",
    name: "SpaceX Official X Feed",
    category: "SpaceX",
    url: "https://x.com/SpaceX",
    description: "Real-time launch updates, live webcasts, and official engineering announcements.",
    badge: "Live Feed",
    iconType: "spacex",
  },
  {
    id: "pl-main",
    name: "Planet Labs Official",
    category: "Planet Labs",
    url: "https://www.planet.com",
    description: "World leader in daily global satellite Earth observation & hyperspectral imaging.",
    badge: "PL Fleet",
    iconType: "planet",
  },
  {
    id: "pl-yt",
    name: "Planet Labs YouTube Channel",
    category: "YouTube",
    url: "https://www.youtube.com/@PlanetLabs",
    description: "Official Planet Labs channel for Pelican satellite deployment and Earth observation.",
    badge: "PL YouTube",
    iconType: "youtube",
  },
  {
    id: "nasa-artemis",
    name: "NASA Artemis Program",
    category: "NASA",
    url: "https://www.nasa.gov/specials/artemis/",
    description: "NASA's mission to return humans to the Moon and build sustainable lunar bases.",
    badge: "NASA Artemis",
    iconType: "nasa",
  },
  {
    id: "nasa-yt",
    name: "NASA Official YouTube",
    category: "YouTube",
    url: "https://www.youtube.com/@NASA",
    description: "Official NASA channel covering Artemis, Orion, James Webb & Moon missions.",
    badge: "NASA YouTube",
    iconType: "youtube",
  },
];

