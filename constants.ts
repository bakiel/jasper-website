
import { Factory, Landmark, Sprout, Cpu, Zap, Globe, Leaf, HardHat, Ban, Ship, Syringe, Home, Battery, Wind, Sun, Droplets, Anchor, Wifi, Server, Activity } from 'lucide-react';
import { Feature, Package, ProcessStep, AddOn, FAQItem } from './types';

// ... (Existing exports remain, adding SECTOR_FULL_CONTENT below)

export const SECTORS: Feature[] = [
  {
    id: 'renewable-energy',
    title: 'Renewable Energy',
    description: 'Solar, wind, biogas, battery storage. PPA modelling, tariff escalation, LCOE analysis.',
    icon: Zap,
    image: '/images/sectors/renewable-energy.jpg',
  },
  {
    id: 'data-centres',
    title: 'Data Centres & Digital',
    description: 'Hyperscale facilities, power & cooling economics, heat reuse, uptime guarantees.',
    icon: Cpu,
    image: '/images/sectors/data-centres.jpg',
  },
  {
    id: 'agri-industrial',
    title: 'Agri-Industrial',
    description: 'Food processing, biogas feedstock, value chains. Yield curves, commodity pricing.',
    icon: Sprout,
    image: '/images/sectors/agri-industrial.jpg',
  },
  {
    id: 'climate-finance',
    title: 'Climate & Green Finance',
    description: 'Carbon credits, green bonds, adaptation. GCF, SEFA, GEF requirements.',
    icon: Leaf,
    image: '/images/sectors/climate-finance.jpg',
  },
  {
    id: 'technology',
    title: 'Technology & Platforms',
    description: 'Fintech, AgTech, SaaS, digital marketplaces. Unit economics, ARR/MRR, cohort analysis.',
    icon: Activity,
    image: '/images/sectors/technology.jpg',
  },
  {
    id: 'manufacturing',
    title: 'Manufacturing & Processing',
    description: 'Food & beverage, FMCG, industrial production. Capacity modelling, BOM integration.',
    icon: Factory,
    image: '/images/sectors/technology.jpg',
  },
];

export const SECTOR_FULL_CONTENT: Record<string, any> = {
    'renewable-energy': {
        title: "Renewable Energy & Power",
        subtitle: "From 1 MW pilots to 1,300 MW integrated complexes.",
        heroImage: "/images/sectors/renewable-energy.jpg",
        whatWeModel: [
            {
                category: "Generation",
                items: ["Solar PV (utility-scale, rooftop, hybrid)", "Wind (onshore, offshore)", "Biogas and biomass", "Small hydro", "Waste-to-energy"]
            },
            {
                category: "Storage & Grid",
                items: ["Battery storage (lithium-ion, flow)", "Smart grid infrastructure", "Grid stabilisation", "Peak shaving systems", "Microgrids"]
            },
            {
                category: "Integration",
                items: ["Hydrogen production (green H2)", "Heat reuse systems", "EV charging networks", "Industrial decarbonisation"]
            }
        ],
        economics: [
            {
                title: "Generation Economics",
                points: ["Capacity factor modelling by technology", "Degradation curves (solar: 0.5%/year)", "Curtailment risk assessment", "P50/P90 yield analysis"]
            },
            {
                title: "PPA Structures",
                points: ["Fixed price vs. indexed PPAs", "Tariff escalation modelling", "Take-or-pay obligations", "Merchant tail risk", "Corporate PPA vs. utility offtake"]
            },
            {
                title: "Financing Structures",
                points: ["Project finance vs. corporate", "Construction period modelling", "IDC (interest during construction)", "Debt sculpting", "DSCR profiles"]
            }
        ],
        scale: {
            title: "1,300 MW Integrated Complex",
            description: "This wasn't just modelled. It was designed. That's why our models reflect how these systems actually operate.",
            breakdown: [
                { val: "300 MW", label: "Solar PV" },
                { val: "300 MW", label: "Wind" },
                { val: "600 MW", label: "Battery Storage" },
                { val: "Grid", label: "Smart Architecture" }
            ]
        },
        dfis: ["IFC (Scaling Solar)", "AfDB (Desert to Power)", "DBSA (Renewable Energy)", "IDC (Green Industries)", "GCF (Green Climate Fund)"]
    },
    'data-centres': {
        title: "Data Centres & Digital Infra",
        subtitle: "Hyperscale economics, cooling physics, and power engineering.",
        heroImage: "/images/sectors/data-centres.jpg",
        whatWeModel: [
            {
                category: "Facility Types",
                items: ["Hyperscale data centres (100MW+)", "Colocation facilities", "Edge data centres", "Enterprise data centres", "Modular/container units"]
            },
            {
                category: "Infrastructure",
                items: ["Power supply systems", "Cooling infrastructure", "Fibre connectivity", "Backup generation", "UPS systems"]
            },
            {
                category: "Revenue",
                items: ["Colocation pricing", "Wholesale vs retail mix", "Cross-connect revenue", "Managed services"]
            }
        ],
        economics: [
            {
                title: "Power Economics",
                points: ["IT load vs. total facility load", "PUE (Power Usage Effectiveness) modelling", "Cooling load profiles by climate", "Redundancy tier costing (Tier II-IV)"]
            },
            {
                title: "Cooling Systems",
                points: ["Air cooling economics", "Liquid cooling transition curves", "Free cooling utilisation hours", "Water consumption modelling", "Heat reuse revenue streams"]
            },
            {
                title: "Capacity Planning",
                points: ["Rack density evolution", "Power density per cabinet", "Whitespace utilisation", "Expansion phasing", "Technology refresh cycles"]
            }
        ],
        scale: {
            title: "700 MW Hyperscale Complex",
            description: "We understand why PUE matters more than headline capacity and how cooling load changes revenue economics.",
            breakdown: [
                { val: "700 MW", label: "Total Load" },
                { val: "1.2", label: "Target PUE" },
                { val: "Liquid", label: "Cooling Tech" },
                { val: "Tier IV", label: "Redundancy" }
            ]
        },
        dfis: ["IFC (Digital Infrastructure)", "AfDB (Digital Africa)", "DFC (Digital Connectivity)", "EBRD (Tech Infra)"]
    },
    'agri-industrial': {
        title: "Agri-Industrial & Food Systems",
        subtitle: "Value chains, processing economics, and food security.",
        heroImage: "/images/sectors/agri-industrial.jpg",
        whatWeModel: [
            {
                category: "Production",
                items: ["Commercial farming", "Controlled environment (greenhouse)", "Hydroponic/vertical farming", "Livestock operations", "Aquaculture"]
            },
            {
                category: "Processing",
                items: ["Food processing facilities", "Cold chain infrastructure", "Packaging operations", "Commodity processing"]
            },
            {
                category: "Distribution",
                items: ["Agricultural trading platforms", "Smallholder aggregation", "Input supply businesses", "Last-mile distribution"]
            }
        ],
        economics: [
            {
                title: "Yield & Production",
                points: ["Crop yield curves by season", "Multi-year maturity profiles", "Climate scenario adjustments", "Irrigation and input sensitivity"]
            },
            {
                title: "Commodity Pricing",
                points: ["Price volatility modelling", "Hedging strategies", "Export currency exposure (export crops)", "Contract vs. spot pricing"]
            },
            {
                title: "Working Capital",
                points: ["Seasonal cash flow cycles", "Harvest timing sensitivity", "Input financing requirements", "Storage and carry costs"]
            }
        ],
        scale: {
            title: "R60M Integrated Agri-Hub",
            description: "Four separate DFI submission packages from a single core model, integrating smallholder outgrowers.",
            breakdown: [
                { val: "4", label: "DFI Packages" },
                { val: "300+", label: "Smallholders" },
                { val: "Biogas", label: "Energy Source" },
                { val: "Export", label: "Focus Market" }
            ]
        },
        dfis: ["Land Bank (SA)", "AfDB (Feed Africa)", "IDC (Agro-processing)", "IFC (Agribusiness)", "IFAD"]
    },
    'climate-finance': {
        title: "Climate & Green Finance",
        subtitle: "Carbon credits, bonds, and adaptation.",
        heroImage: "/images/sectors/climate-finance.jpg",
        whatWeModel: [
            {
                category: "Mitigation",
                items: ["Carbon credit projects", "Emission reduction initiatives", "Industrial decarbonisation", "Clean tech deployment"]
            },
            {
                category: "Adaptation",
                items: ["Climate-resilient agriculture", "Water management infrastructure", "Coastal protection", "Urban resilience"]
            },
            {
                category: "Instruments",
                items: ["Green bonds", "Sustainability-linked loans", "Climate funds allocation", "Blended finance"]
            }
        ],
        economics: [
            {
                title: "Carbon Economics",
                points: ["Carbon credit pricing scenarios", "Verification costs", "Registry and transaction fees", "Permanence and leakage factors", "Additionality"]
            },
            {
                title: "Fund Metrics",
                points: ["Paradigm shift indicators", "Mitigation tonnes CO2e", "Co-benefit monetisation", "Adaptation benefit quantification"]
            },
            {
                title: "Compliance",
                points: ["Use of proceeds tracking", "Green bond framework alignment", "Impact measurement", "Reporting and disclosure"]
            }
        ],
        scale: {
            title: "Green Climate Fund (GCF) Alignment",
            description: "We build additionality, paradigm shift, and country ownership narratives directly into the financial structure.",
            breakdown: [
                { val: "GCF", label: "Standards" },
                { val: "tCO2e", label: "Metric Tracked" },
                { val: "ESG", label: "Integrated" },
                { val: "Impact", label: "Quantified" }
            ]
        },
        dfis: ["GCF (Green Climate Fund)", "SEFA (Sustainable Energy)", "GEF (Global Environment Facility)", "CIF (Climate Investment Funds)"]
    },
    'technology': {
        title: "Technology & Digital Platforms",
        subtitle: "Fintech, AgTech, SaaS, and impact tech.",
        heroImage: "/images/sectors/technology.jpg",
        whatWeModel: [
            {
                category: "Platform Businesses",
                items: ["Fintech platforms", "AgTech solutions", "SaaS businesses", "Digital marketplaces", "E-commerce platforms"]
            },
            {
                category: "Impact Tech",
                items: ["EdTech ventures", "HealthTech applications", "CleanTech solutions", "Financial inclusion platforms", "Last-mile service delivery"]
            }
        ],
        economics: [
            {
                title: "Revenue Metrics",
                points: ["MRR/ARR projections", "Cohort-based forecasting", "Churn and retention modelling", "ARPU growth trajectories"]
            },
            {
                title: "Unit Economics",
                points: ["CAC (Customer Acquisition Cost)", "LTV (Lifetime Value)", "Payback period analysis", "Cohort economics by channel"]
            },
            {
                title: "Scaling Dynamics",
                points: ["Network effect modelling", "Viral coefficient integration", "Infrastructure scaling", "Marginal cost curves"]
            }
        ],
        scale: {
            title: "DFI Tech Funding",
            description: "DFIs increasingly fund tech, but their metrics differ from VC. We model both commercial and development impact.",
            breakdown: [
                { val: "ARR", label: "Revenue Metric" },
                { val: "LTV:CAC", label: "Unit Economics" },
                { val: "Impact", label: "Quantified" },
                { val: "Dual", label: "Lens Approach" }
            ]
        },
        dfis: ["IFC Tech Emerging", "AfDB Digital Fund", "CDC Group", "TIA (SA)"]
    },
    'manufacturing': {
        title: "Manufacturing & Processing",
        subtitle: "Industrial production and value-addition.",
        heroImage: "/images/sectors/technology.jpg",
        whatWeModel: [
            {
                category: "Production Types",
                items: ["Food and beverage processing", "FMCG production", "Industrial manufacturing", "Packaging and materials", "Pharmaceutical production", "Textile and apparel"]
            },
            {
                category: "Operations",
                items: ["Assembly operations", "Quality control systems", "Maintenance schedules", "Shift optimisation"]
            }
        ],
        economics: [
            {
                title: "Capacity Modelling",
                points: ["Production line economics", "Shift optimisation", "Capacity utilisation curves", "Expansion phasing"]
            },
            {
                title: "Unit Economics",
                points: ["Bill of materials integration", "Yield and waste factors", "Quality cost allocation", "Volume-based pricing tiers"]
            },
            {
                title: "Working Capital",
                points: ["Raw material inventory", "WIP (Work in Progress)", "Finished goods holding", "Supplier payment terms", "Customer collection cycles"]
            }
        ],
        scale: {
            title: "Industrial Development",
            description: "Manufacturing projects that create jobs and build local capacity for import substitution.",
            breakdown: [
                { val: "Jobs", label: "Direct Impact" },
                { val: "Import", label: "Substitution" },
                { val: "Value", label: "Addition" },
                { val: "Skills", label: "Transfer" }
            ]
        },
        dfis: ["IDC (Industrial Development)", "IFC Manufacturing", "AfDB Industrialisation", "ECIC (Export Credit)"]
    }
};

export const SECTOR_DETAILS = [
  {
    id: 'renewable-energy',
    title: 'Renewable Energy & Power',
    subtitle: 'From 1 MW pilots to 1,300 MW complexes',
    icon: Zap,
    color: 'emerald',
    stats: [
        { label: 'Generation', value: 'Solar/Wind/Bio' },
        { label: 'Storage', value: 'BESS/Grid' },
        { label: 'Complexity', value: 'High' }
    ],
    tabs: [
        {
            id: 'model',
            label: 'What We Model',
            content: [
                { title: 'Generation', items: ['Solar PV (Utility/Rooftop)', 'Wind (Onshore/Offshore)', 'Biogas & Biomass', 'Waste-to-energy', 'Hybrid Systems'] },
                { title: 'Storage & Grid', items: ['Battery Storage (BESS)', 'Smart Grid Infrastructure', 'Peak Shaving', 'Microgrids'] },
                { title: 'Integration', items: ['Green Hydrogen (H2)', 'Heat Reuse', 'EV Charging Networks', 'Industrial Decarbonisation'] }
            ]
        },
        {
            id: 'economics',
            label: 'Sector Economics',
            content: [
                { title: 'Generation Economics', items: ['Degradation curves (0.5%/yr)', 'Curtailment risk assessment', 'P50/P90 yield analysis', 'Resource variability'] },
                { title: 'PPA Structures', items: ['Fixed vs Indexed PPAs', 'Take-or-pay obligations', 'Merchant tail risk', 'Corporate vs Utility offtake'] },
                { title: 'Financing', items: ['Construction period modelling', 'IDC (Interest During Construction)', 'Debt sculpting', 'DSCR profiles'] }
            ]
        },
        {
            id: 'dfi',
            label: 'Relevant DFIs',
            content: [
                { title: 'Institutions', items: ['IFC (Scaling Solar)', 'AfDB (Desert to Power)', 'DBSA (Renewable Energy)', 'GCF (Green Climate Fund)', 'SEFA (Sustainable Energy)'] }
            ]
        }
    ]
  },
  {
    id: 'data-centres',
    title: 'Data Centres & Digital',
    subtitle: 'Hyperscale economics and power engineering',
    icon: Cpu,
    color: 'blue',
    stats: [
        { label: 'Type', value: 'Hyperscale/Edge' },
        { label: 'Focus', value: 'Power/Cooling' },
        { label: 'Metric', value: 'PUE/Kw' }
    ],
    tabs: [
        {
            id: 'model',
            label: 'What We Model',
            content: [
                { title: 'Facility Types', items: ['Hyperscale (100MW+)', 'Colocation Facilities', 'Edge Data Centres', 'Modular Units'] },
                { title: 'Infrastructure', items: ['Power Supply Systems', 'Cooling Infrastructure', 'Fibre Connectivity', 'Backup Generation'] }
            ]
        },
        {
            id: 'economics',
            label: 'Sector Economics',
            content: [
                { title: 'Power Economics', items: ['PUE Modelling', 'Cooling load by climate', 'Redundancy tier costing (Tier II-IV)', 'Utility vs Captive power'] },
                { title: 'Revenue', items: ['Colocation pricing (per kW)', 'Wholesale vs Retail mix', 'SLA penalty modelling', 'Churn & renewal rates'] },
                { title: 'Capacity', items: ['Rack density evolution', 'Whitespace utilisation', 'Technology refresh cycles'] }
            ]
        },
        {
            id: 'dfi',
            label: 'Relevant DFIs',
            content: [
                { title: 'Institutions', items: ['IFC (Digital Infra)', 'AfDB (Digital Africa)', 'DFC (Connectivity)', 'EBRD (Tech Infra)'] }
            ]
        }
    ]
  },
  {
    id: 'agri-industrial',
    title: 'Agri-Industrial',
    subtitle: 'Food security and value chain transformation',
    icon: Sprout,
    color: 'yellow',
    stats: [
        { label: 'Focus', value: 'Processing' },
        { label: 'Metric', value: 'Yield/Ha' },
        { label: 'Impact', value: 'Rural Jobs' }
    ],
    tabs: [
        {
            id: 'model',
            label: 'What We Model',
            content: [
                { title: 'Production', items: ['Commercial Farming', 'Controlled Environment (Greenhouse)', 'Livestock & Aquaculture'] },
                { title: 'Processing', items: ['Food Processing Facilities', 'Cold Chain Infrastructure', 'Commodity Processing'] },
                { title: 'Distribution', items: ['Trading Platforms', 'Smallholder Aggregation', 'Last-mile Distribution'] }
            ]
        },
        {
            id: 'economics',
            label: 'Sector Economics',
            content: [
                { title: 'Yield & Production', items: ['Crop yield curves', 'Biological asset maturity', 'Climate scenario adjustments'] },
                { title: 'Commodity Pricing', items: ['Price volatility modelling', 'Hedging strategies', 'Export currency exposure'] },
                { title: 'Working Capital', items: ['Seasonal cash flow cycles', 'Harvest timing sensitivity', 'Input financing'] }
            ]
        },
        {
            id: 'dfi',
            label: 'Relevant DFIs',
            content: [
                { title: 'Institutions', items: ['Land Bank (SA)', 'AfDB (Feed Africa)', 'IDC (Agro-processing)', 'IFAD (Smallholder)'] }
            ]
        }
    ]
  },
  {
    id: 'climate-finance',
    title: 'Climate & Green Finance',
    subtitle: 'Carbon credits, bonds, and adaptation',
    icon: Globe,
    color: 'teal',
    stats: [
        { label: 'Focus', value: 'Carbon/ESG' },
        { label: 'Metric', value: 'tCO2e' },
        { label: 'Type', value: 'Adaptation' }
    ],
    tabs: [
        {
            id: 'model',
            label: 'What We Model',
            content: [
                { title: 'Mitigation', items: ['Carbon Credit Projects', 'Emission Reduction', 'Industrial Decarbonisation'] },
                { title: 'Adaptation', items: ['Climate-resilient Agri', 'Water Management', 'Coastal Protection'] },
                { title: 'Instruments', items: ['Green Bonds', 'Sustainability-linked Loans', 'Blended Finance'] }
            ]
        },
        {
            id: 'economics',
            label: 'Sector Economics',
            content: [
                { title: 'Carbon Economics', items: ['Credit pricing scenarios', 'Verification costs', 'Additionality factors', 'Leakage factors'] },
                { title: 'Fund Metrics', items: ['Paradigm shift indicators', 'Mitigation tonnes CO2e', 'Co-benefit monetisation'] },
                { title: 'Compliance', items: ['Green Bond Frameworks', 'Use of Proceeds tracking', 'Impact reporting'] }
            ]
        },
        {
            id: 'dfi',
            label: 'Relevant DFIs',
            content: [
                { title: 'Institutions', items: ['GCF (Green Climate Fund)', 'GEF', 'CIF (Climate Investment Funds)', 'AfDB Climate'] }
            ]
        }
    ]
  }
];

export const ANTI_PORTFOLIO = [
    { title: 'Real Estate', desc: 'Residential/Commercial', icon: Home },
    { title: 'Mining', desc: 'Extractive Industries', icon: HardHat },
    { title: 'Oil & Gas', desc: 'Fossil Exploration', icon: Factory },
    { title: 'Shipping', desc: 'Maritime Logistics', icon: Ship },
    { title: 'Healthcare', desc: 'Hospitals/Clinics', icon: Syringe },
    { title: 'Gambling', desc: 'Casinos/Betting', icon: Ban },
];

export const PACKAGES: Package[] = [
  {
    name: "Growth",
    price: "$12,000 USD",
    duration: "3-4 weeks",
    target: "For projects seeking $5M-$15M",
    features: [
      "20-sheet JASPER model",
      "3 scenarios (base, upside, downside)",
      "Executive summary document",
      "Investment memorandum",
      "Model documentation",
      "30-day email support"
    ],
    bestFor: [
      "First-time DFI applicants",
      "Straightforward business models",
      "Single primary revenue stream"
    ],
    deliverables: {
      model: ["20-sheet JASPER architecture", "3 scenarios", "5-year projections", "Print-ready formatting"],
      docs: ["Executive summary (5-7 pages)", "Investment memorandum (10-12 pages)", "Assumption book"],
      support: ["2 revision rounds", "30-day email support"]
    },
    notIncluded: ["Full business plan", "DFI-specific reformatting", "Construction period modelling"]
  },
  {
    name: "Institutional",
    price: "$25,000 USD",
    duration: "4-6 weeks",
    target: "For projects seeking $15M-$75M",
    highlight: true,
    features: [
      "Full 28-sheet JASPER model",
      "5 scenarios with sensitivity analysis",
      "Professional business plan (designed)",
      "Debt sculpting & DSCR optimization",
      "DFI-specific formatting (1 institution)",
      "60-day email support"
    ],
    bestFor: [
      "Mid-market projects ($15M-$75M)",
      "Multiple funding sources",
      "Complex capital structures",
      "DFI-specific submission requirements"
    ],
    deliverables: {
      model: ["Full 28-sheet architecture", "5 scenarios + sensitivity", "7-10 year projections", "Debt sculpting & DSCR optimization", "Three-statement integration"],
      docs: ["Business Plan (40-60 pages)", "Executive summary (7-10 pages)", "Investment memo (15-20 pages)"],
      support: ["2 revision rounds", "60-day email support"],
      other: ["1 institution-specific version", "Metrics aligned to DFI requirements"]
    }
  },
  {
    name: "Infrastructure",
    price: "$45,000 USD",
    duration: "6-8 weeks",
    target: "For projects seeking $75M+",
    features: [
      "35+ sheet comprehensive model",
      "7+ scenarios with Monte Carlo",
      "Complete business plan + appendices",
      "Multiple DFI versions (up to 4)",
      "Construction period modelling",
      "Infographics & visual package",
      "90-day email support"
    ],
    bestFor: [
      "Large-scale projects ($75M+)",
      "PPP and concession structures",
      "Multi-phase construction",
      "Multiple DFI submissions"
    ],
    deliverables: {
      model: ["35+ sheet comprehensive model", "7+ scenarios with Monte Carlo", "10-15 year projections", "Construction period modelling", "Multi-currency support"],
      docs: ["Business Plan (80-120 pages)", "Technical appendices", "Custom infographics package"],
      support: ["3 revision rounds", "90-day email support", "Quarterly model update (1 included)"],
      other: ["Up to 4 DFI versions", "Custom cover letters", "Submission checklists"]
    }
  }
];

export const ADDONS: AddOn[] = [
  { title: "Additional DFI Version", price: "$3,500", desc: "Extra institution-specific formatting beyond package inclusion" },
  { title: "Market Study Integration", price: "$5,000", desc: "Incorporate third-party market research into model assumptions" },
  { title: "Implementation Plan", price: "$4,000", desc: "Detailed operational rollout document with milestones and KPIs" },
  { title: "Pitch Deck", price: "$3,000", desc: "20-25 slide investor presentation matching business plan design" },
  { title: "Quarterly Model Update", price: "$2,500", desc: "Refresh projections with actual data and updated assumptions" },
];

export const SERVICE_FAQS: FAQItem[] = [
    { q: "Can I start with Growth and upgrade later?", a: "Yes. We can expand a Growth model to Institutional scope. You pay the difference plus a $2,000 restructuring fee." },
    { q: "What if I need changes after delivery?", a: "2-3 revision rounds are included depending on package. Additional revisions billed at $150/hour." },
    { q: "How do I know which package I need?", a: "Generally: Under $15M funding → Growth. $15M-$75M funding → Institutional. Over $75M or PPP → Infrastructure. Email us if unsure. We'll recommend honestly." },
    { q: "Can you work faster than stated timelines?", a: "Timelines assume normal workflow. Rush delivery is not available. Quality requires time." },
    { q: "Do you sign NDAs?", a: "Yes. We sign reasonable NDAs before receiving confidential project information." },
    { q: "What happens if I'm not satisfied?", a: "Revision rounds address most concerns. If fundamental issues exist, we work to resolve them. Refunds are not provided for completed work meeting specifications." },
    { q: "Can I see a sample model?", a: "We can share anonymised structural samples showing sheet architecture. Full models contain client confidential information." },
];

export const PROCESS_STEPS: ProcessStep[] = [
  { number: "01", title: "Inquiry", description: "Email with project overview." },
  { number: "02", title: "Intake", description: "Complete detailed intake form." },
  { number: "03", title: "Proposal", description: "Fixed-price proposal in 24-48h." },
  { number: "04", title: "Production", description: "50% deposit starts work." },
  { number: "05", title: "Delivery", description: "Review, final payment, clean files." },
];

export const FIT_CRITERIA = {
  good: [
    "Projects seeking $5M+ in development finance",
    "Applications to IFC, AfDB, ADB, EBRD, IDC, DBSA",
    "Deals requiring investment committee approval",
    "Infrastructure, agriculture, technology, manufacturing",
    "Entrepreneurs who value quality over speed",
    "Teams prepared to provide detailed project information"
  ],
  bad: [
    "Bank loans under $1M",
    "Visa or immigration business plans",
    "Franchise disclosure documents",
    "\"I need it tomorrow\" rush jobs",
    "Template-acceptable applications",
    "Projects without basic feasibility data"
  ]
};
