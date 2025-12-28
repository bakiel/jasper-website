# JASPER Financial Architecture - Technical FAQ

## Model Architecture Questions

### Q: What is the 28-sheet architecture?
A: The JASPER 28-sheet architecture is our standardised financial model structure that organises all project financials into logical categories: Governance (4 sheets), Project Build (5 sheets), Funding (3 sheets), Operations (4 sheets), Working Capital & Tax (2 sheets), Financial Statements (3 sheets), Analysis (3 sheets), and Output (4 sheets).

### Q: How do you handle circular references?
A: We use a Python + SciPy iterative solver to pre-calculate the circular reference chain (Debt ↔ Interest ↔ Cash). The solved values are then embedded as explicit formulas in the Excel output, so the workbook doesn't require iterative calculation enabled.

### Q: Why not just use Excel's iterative calculation?
A: Excel's built-in iteration is unreliable, can cause convergence issues, and produces different results on different machines. Our approach guarantees consistent, auditable results every time.

### Q: What makes a model "DFI-grade"?
A: DFI-grade models must have:
- Clear audit trail and documentation
- Separated inputs/calculations/outputs
- No hardcoded values in formulas
- Balance sheet that balances to zero
- Cash flow that reconciles with balance sheet
- Sensitivity analysis capabilities
- Professional formatting and navigation

## Pricing Questions

### Q: Why does pricing vary so much?
A: Model complexity varies significantly:
- Simple 10-year operating business: R45,000
- Multi-tranche debt with construction phase: R150,000
- Complex SPV with multiple revenue streams: R450,000+
- Multi-project portfolio with consolidation: R750,000+

### Q: What's included in revisions?
A: Revisions cover changes to assumptions, scenarios, or minor structural adjustments. Major scope changes (adding new revenue streams, restructuring debt) may require additional fees.

### Q: Do you offer payment plans?
A: Standard terms are 50% upfront, 50% on delivery. For Enterprise packages, we offer milestone-based payments tied to deliverables.

## Delivery Questions

### Q: What format is the model delivered in?
A: Models are delivered as Excel workbooks (.xlsx) with full formula transparency. No macros, no hidden sheets, no password protection.

### Q: Do you provide training?
A: Professional and Enterprise packages include a walkthrough session. Additional training is available at R1,500/hour.

### Q: What documentation is included?
A: All packages include:
- User guide (Sheet 28)
- Assumption sources (Sheet 2)
- Formula explanations in cell comments
Enterprise adds full technical documentation.

## Sector-Specific Questions

### Q: Do you specialise in renewable energy?
A: Yes, renewable energy (solar, wind, hydro) is our primary sector. We understand IPP frameworks, PPA structures, grid connection costs, and DFI requirements for clean energy projects.

### Q: Can you model agricultural projects?
A: Yes, we have experience with:
- Processing plants (milling, packaging)
- Cold chain and storage facilities
- Farming operations (crops, livestock)
- Agribusiness value chains

### Q: What about data centres?
A: We model hyperscale and colocation facilities including:
- Power consumption and PUE calculations
- Rack density and fill rates
- Customer contract structures
- Cooling and infrastructure costs

## Technical Integration Questions

### Q: Can the model integrate with our systems?
A: The Excel output is standard format, compatible with any system that reads Excel. For API integration, we can provide JSON data exports.

### Q: Do you support multiple currencies?
A: Yes, models can handle multi-currency scenarios with exchange rate assumptions and currency hedging calculations.

### Q: Can you model inflation?
A: Models default to real terms (constant prices). Nominal projections with inflation escalation are available on request.

## Process Questions

### Q: How long does the process take?
A: Typical timelines:
- Foundation: 2 weeks
- Professional: 3 weeks
- Enterprise: 4 weeks
- Custom: 6-8 weeks

### Q: What information do you need to start?
A: We need:
- Project description and scope
- Capital cost estimates
- Revenue assumptions
- Operating cost estimates
- Funding structure (debt/equity split)
- Timeline (construction + operations)

### Q: How do revisions work?
A: After initial delivery, you review the model and provide feedback. We incorporate changes and redeliver. This cycle repeats within your revision allowance.

## Support Questions

### Q: Do you offer ongoing support?
A: Yes, we offer support packages:
- Ad-hoc: R1,500/hour
- Monthly retainer: R5,000/month (includes 4 hours)
- Annual: R50,000/year (priority support)

### Q: Can you update models for new assumptions?
A: Yes, assumption updates are straightforward and included in support. Structural changes may require additional development.

### Q: What if there's a bug in the model?
A: We guarantee our models are error-free. Any genuine bugs are fixed at no charge within 12 months of delivery.
