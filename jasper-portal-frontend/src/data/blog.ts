/**
 * JASPER Insights Blog Data
 * SEO-optimised blog structure for DFI funding insights
 */

export interface BlogAuthor {
  name: string;
  role: string;
  avatar?: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'published';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Markdown content
  category: 'DFI Insights' | 'Financial Modelling' | 'Sector Analysis' | 'Case Studies' | 'Industry News';
  tags: string[];
  author: BlogAuthor;
  publishedAt: string; // ISO date string
  scheduledAt?: string; // For scheduled posts (admin-side)
  updatedAt?: string;
  readTime: number; // minutes
  featured?: boolean;
  heroImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  status: PostStatus; // draft/scheduled/published (admin-side control)
}

export interface Comment {
  id: string;
  postSlug: string;
  author: string;
  email: string;
  content: string;
  createdAt: string;
  approved: boolean;
}

// Sample blog posts with SEO-rich content
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'understanding-idc-funding-requirements-2024',
    title: 'Understanding IDC Funding Requirements: What South African Businesses Need to Know in 2024',
    excerpt: 'Navigate the Industrial Development Corporation\'s funding criteria with confidence. Learn about the key requirements, application process, and how to structure your financial model for success.',
    content: `
## Introduction

The Industrial Development Corporation (IDC) remains South Africa's premier development finance institution, providing crucial funding for businesses across key sectors. Understanding their requirements is essential for any company seeking growth capital.

## Key Funding Criteria

### 1. Sector Alignment

The IDC prioritises funding for businesses in sectors that contribute to:
- **Job creation** in underserved communities
- **Industrial capacity building**
- **Export growth and foreign exchange earnings**
- **Black economic empowerment**

### 2. Financial Viability

Your financial model must demonstrate:
- Clear path to profitability within 3-5 years
- Debt service coverage ratio (DSCR) above 1.3x
- Adequate equity contribution (typically 30-40%)
- Realistic revenue projections backed by offtake agreements

### 3. Development Impact

The IDC assesses applications based on development impact metrics:
- Jobs created per R1 million invested
- Geographic location (rural areas receive preference)
- Skills development programmes
- Supplier development initiatives

## The Application Process

### Step 1: Pre-Assessment

Before formal application, ensure your business plan includes:
- Executive summary with clear value proposition
- Market analysis demonstrating demand
- Detailed financial projections (5-year minimum)
- Management team CVs

### Step 2: Financial Model Requirements

Your integrated financial model should include:
- Income statement projections
- Balance sheet forecasts
- Cash flow statements
- Sensitivity analysis
- Break-even analysis

### Step 3: Due Diligence Preparation

Prepare for extensive due diligence covering:
- Legal compliance and company registration
- Tax clearance certificates
- Environmental impact assessments (where applicable)
- BEE credentials

## Common Pitfalls to Avoid

1. **Overly optimistic projections** - Base your model on conservative assumptions
2. **Inadequate working capital** - Include sufficient buffer for operational needs
3. **Missing supporting documentation** - Gather all certificates and agreements beforehand
4. **Weak management team narrative** - Highlight relevant experience and track record

## How JASPER Helps

Our JASPER financial modelling platform is specifically designed to meet DFI requirements. We ensure:

- Zero reference errors in Excel models
- IDC-compliant ratio calculations
- Sensitivity analysis across multiple scenarios
- Professional presentation standards

## Conclusion

Securing IDC funding requires meticulous preparation and a thorough understanding of their requirements. With the right approach and professional financial modelling, your business can access the capital needed for sustainable growth.

---

*Need help with your IDC application? [Contact our team](/contact) for a consultation.*
    `,
    category: 'DFI Insights',
    tags: ['IDC', 'Development Finance', 'South Africa', 'Funding Requirements', 'Financial Modelling'],
    author: {
      name: 'JASPER Team',
      role: 'Financial Architecture'
    },
    publishedAt: '2024-12-10T09:00:00Z',
    readTime: 8,
    featured: true,
    status: 'published',
    seoTitle: 'IDC Funding Requirements 2024 | Complete Guide for SA Businesses',
    seoDescription: 'Learn everything about IDC funding requirements in South Africa. Discover key criteria, application process, and how to structure your financial model for approval.'
  },
  {
    slug: 'renewable-energy-project-finance-guide',
    title: 'Project Finance for Renewable Energy in Africa: A Complete Guide',
    excerpt: 'Unlock funding for your renewable energy project. From solar PV to wind farms, learn how to structure bankable deals that attract DFI investment.',
    content: `
## The African Renewable Energy Opportunity

Africa's renewable energy sector is experiencing unprecedented growth. With abundant solar and wind resources, the continent is attracting significant development finance investment.

## Key Financing Structures

### Project Finance vs Corporate Finance

For renewable energy projects, project finance remains the preferred structure:
- **Non-recourse or limited-recourse** lending
- Ring-fenced project cash flows
- Long-term power purchase agreements (PPAs)
- Structured around specific project assets

### The Role of DFIs

Development Finance Institutions play a crucial role in:
- Providing concessional finance
- Offering political risk insurance
- Crowding in commercial lenders
- Setting ESG standards

## Financial Model Requirements

### Revenue Projections

Your model must demonstrate:
- PPA terms and tariff structures
- Capacity factors based on resource assessments
- Degradation curves for solar panels
- O&M cost escalation

### Debt Structuring

Key metrics for lenders:
- DSCR: Minimum 1.3x for solar, 1.4x for wind
- LLCR (Loan Life Coverage Ratio): Above 1.4x
- Debt tenor matching project life

### Sensitivity Analysis

Critical scenarios to model:
- Resource availability (P50/P75/P90 scenarios)
- Construction delays
- Currency fluctuations
- Interest rate changes

## Common DFI Partners

Key institutions funding African renewables:
- **IFC** (World Bank Group)
- **AfDB** (African Development Bank)
- **FMO** (Dutch Development Bank)
- **IDC** (South Africa)
- **DEG** (German Development Finance)

## Success Factors

1. Strong offtaker creditworthiness
2. Proven technology and EPC contractor
3. Experienced development team
4. Clear grid connection pathway
5. Environmental and social compliance

## Conclusion

Renewable energy project finance in Africa requires specialised expertise. At JASPER, we build models that meet international DFI standards, ensuring your project is investor-ready.

---

*Planning a renewable energy project? [Speak with our specialists](/contact) today.*
    `,
    category: 'Sector Analysis',
    tags: ['Renewable Energy', 'Project Finance', 'Solar', 'Wind', 'Africa', 'DFI'],
    author: {
      name: 'JASPER Team',
      role: 'Financial Architecture'
    },
    publishedAt: '2024-12-05T10:00:00Z',
    readTime: 10,
    featured: false,
    status: 'published',
    seoTitle: 'Renewable Energy Project Finance Africa | Solar & Wind Funding Guide',
    seoDescription: 'Complete guide to project finance for renewable energy in Africa. Learn DFI requirements, financial modelling standards, and how to structure bankable deals.'
  },
  {
    slug: 'financial-model-best-practices',
    title: '7 Financial Model Best Practices Every CFO Should Know',
    excerpt: 'Avoid costly errors and build investor-ready financial models. Learn the techniques that separate amateur spreadsheets from professional-grade analysis.',
    content: `
## Why Financial Model Quality Matters

A poorly constructed financial model can derail funding applications, mislead investors, and damage your credibility. Here are seven best practices we follow at JASPER.

## 1. Structure Before You Build

### The Three-Statement Foundation

Every robust model starts with:
- **Income Statement** - Revenue to net income
- **Balance Sheet** - Assets, liabilities, equity
- **Cash Flow Statement** - Operating, investing, financing

### Separate Inputs from Calculations

Create dedicated sheets for:
- Assumptions (inputs in blue font)
- Calculations (formulas in black)
- Outputs (formatted for presentation)

## 2. Eliminate Reference Errors

### The Zero-Error Standard

At JASPER, we maintain a zero-error policy:
- No circular references
- No #REF! or #VALUE! errors
- All formulas validated against source data

### Error Checking Protocol

Implement systematic checks:
- Balance sheet balances (Assets = Liabilities + Equity)
- Cash flow reconciliation
- Debt schedule accuracy

## 3. Use Consistent Formatting

### Visual Hierarchy

Apply consistent formatting:
- **Hardcoded inputs**: Blue font, yellow background
- **Formulas**: Black font, no fill
- **Links to other sheets**: Green font
- **Headers**: Bold, larger font

## 4. Document Your Assumptions

### Every Number Needs a Source

Document assumptions with:
- Source citations
- Date of data
- Rationale for projections
- Links to supporting materials

## 5. Build in Flexibility

### Scenario Modelling

Create toggles for:
- Base case / Upside / Downside scenarios
- Multiple product lines
- Different growth assumptions

### Sensitivity Tables

Include data tables showing:
- Revenue sensitivity to price changes
- NPV sensitivity to discount rates
- Returns under various conditions

## 6. Test Thoroughly

### Stress Testing

Push your model to extremes:
- Zero revenue scenario
- Maximum cost escalation
- Currency depreciation

### Audit Trail

Maintain version control:
- Date-stamped versions
- Change logs
- Backup files

## 7. Present Professionally

### Output Quality

Your output sheets should:
- Print cleanly on A4/Letter
- Include page numbers and dates
- Feature clear charts and graphs
- Follow corporate branding

## Conclusion

Professional financial modelling is both art and science. These best practices ensure your models stand up to investor scrutiny and support sound decision-making.

---

*Need a professional financial model? [Get in touch](/contact) with JASPER.*
    `,
    category: 'Financial Modelling',
    tags: ['Financial Modelling', 'Excel', 'Best Practices', 'CFO', 'Investment'],
    author: {
      name: 'JASPER Team',
      role: 'Financial Architecture'
    },
    publishedAt: '2024-11-28T08:00:00Z',
    readTime: 7,
    featured: false,
    status: 'published',
    seoTitle: '7 Financial Model Best Practices for CFOs | JASPER Guide',
    seoDescription: 'Learn 7 essential financial model best practices. From structure to error elimination, build investor-ready spreadsheets that impress DFIs and funders.'
  },
  {
    slug: 'data-centre-financing-africa',
    title: 'Financing Data Centres in Africa: Opportunities and Challenges',
    excerpt: 'Africa\'s digital infrastructure gap presents massive investment opportunities. Learn how to structure data centre projects for DFI funding.',
    content: `
## The Digital Infrastructure Gap

Africa hosts less than 2% of global data centre capacity, yet demand is growing at 15-20% annually. This imbalance creates compelling investment opportunities.

## Market Drivers

### Demand Growth

Key factors driving data centre demand:
- Cloud computing adoption
- Mobile data explosion
- Digital transformation initiatives
- Regulatory requirements for data localisation

### Supply Constraints

Current market challenges:
- Limited grid power reliability
- High construction costs
- Skills shortages
- Foreign exchange volatility

## Financing Considerations

### Capital Requirements

Typical data centre economics:
- CapEx: $10-15 million per MW
- Construction period: 18-24 months
- Anchor tenant requirement: 50%+ pre-let
- Operating margins: 40-60%

### DFI Appetite

Development financiers are attracted to:
- Job creation potential
- Technology transfer
- Digital inclusion impact
- Climate-smart design (renewable power integration)

## Financial Model Essentials

### Revenue Modelling

Key revenue drivers:
- Colocation pricing (per kW/month)
- Connectivity services
- Managed services
- Power pass-through arrangements

### Cost Structure

Major operating expenses:
- Power costs (40-50% of OpEx)
- Cooling systems
- Security (physical and cyber)
- Staffing and maintenance

### Key Metrics

Investors evaluate:
- Power Usage Effectiveness (PUE)
- Revenue per MW
- EBITDA margins
- Customer concentration

## Structuring for Success

### Risk Mitigation

Address key risks:
- Power supply agreements with backup
- Local currency revenue where possible
- Long-term customer contracts
- Insurance coverage

### Equity and Debt Mix

Typical financing structure:
- Equity: 30-40%
- Senior debt: 50-60%
- Mezzanine: 10-15%

## Conclusion

Data centre investment in Africa offers attractive returns for investors who understand the market. At JASPER, we help sponsors structure projects that meet DFI requirements and attract global capital.

---

*Planning a data centre project? [Let's discuss your requirements](/contact).*
    `,
    category: 'Sector Analysis',
    tags: ['Data Centres', 'Digital Infrastructure', 'Africa', 'Technology', 'DFI'],
    author: {
      name: 'JASPER Team',
      role: 'Financial Architecture'
    },
    publishedAt: '2024-11-20T11:00:00Z',
    readTime: 9,
    featured: false,
    status: 'published',
    seoTitle: 'Data Centre Financing Africa | Investment Guide & DFI Funding',
    seoDescription: 'Explore data centre financing opportunities in Africa. Learn about market drivers, DFI funding requirements, and how to structure bankable projects.'
  }
];

// Helper functions

// Get only published posts (respects scheduling - for public display)
export const getPublishedPosts = (): BlogPost[] => {
  const now = new Date();
  return BLOG_POSTS.filter(post => {
    if (post.status !== 'published') return false;
    // If scheduled, only show if scheduledAt has passed
    if (post.scheduledAt && new Date(post.scheduledAt) > now) return false;
    return true;
  });
};

export const getFeaturedPost = (): BlogPost | undefined => {
  return getPublishedPosts().find(post => post.featured);
};

export const getPostBySlug = (slug: string): BlogPost | undefined => {
  return BLOG_POSTS.find(post => post.slug === slug);
};

export const getPostsByCategory = (category: BlogPost['category']): BlogPost[] => {
  return BLOG_POSTS.filter(post => post.category === category);
};

export const getRecentPosts = (limit: number = 3): BlogPost[] => {
  return [...BLOG_POSTS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
};

export const getAllCategories = (): BlogPost['category'][] => {
  return Array.from(new Set(BLOG_POSTS.map(post => post.category)));
};

export const getRelatedPosts = (currentSlug: string, limit: number = 3): BlogPost[] => {
  const currentPost = getPostBySlug(currentSlug);
  if (!currentPost) return [];

  return BLOG_POSTS
    .filter(post => post.slug !== currentSlug)
    .filter(post =>
      post.category === currentPost.category ||
      post.tags.some(tag => currentPost.tags.includes(tag))
    )
    .slice(0, limit);
};
