# JASPER™ FINANCIAL MODEL MASTER PROMPT (GENERIC)
## Sequential Sheet-by-Sheet Build with Full Python Pre-Calculation

**Document Version:** 2.0  
**Last Updated:** October 30, 2025  
**System:** JASPER™ (Julia Architected SQL-Powered Excel Reference)  
**Purpose:** Generic, repeatable, investment-grade financial modeling for ANY project  
**Applicability:** Infrastructure, Tech, Agriculture, Manufacturing, Services, Real Estate

---

## 🎯 CRITICAL PHILOSOPHY: SEQUENTIAL BUILD APPROACH

**JASPER™ operates on a SEQUENTIAL, SHEET-BY-SHEET methodology:**

1. **Pre-calculate EVERYTHING for ONE sheet** (Python + SciPy)
2. **Validate that sheet completely** (zero variance, all constraints satisfied)
3. **Build ONLY that sheet in Excel** (C# + ClosedXML)
4. **Review and approve** (user validates output quality)
5. **Move to next sheet** (repeat process)

**Why sequential?**
- ✅ Full attention to each sheet (no rushing)
- ✅ Immediate error detection (fix before compounding)
- ✅ User validation at each stage (confirm before proceeding)
- ✅ Memory efficiency (process one sheet at a time)
- ✅ Easier debugging (isolate issues to specific sheet)

**NEVER build all sheets simultaneously.** Always complete Sheet 1 → validate → Sheet 2 → validate → etc.

---

## 📋 MASTER PROMPT

```
═══════════════════════════════════════════════════════════════════════════════
JASPER™ FINANCIAL MODEL GENERATION - SEQUENTIAL BUILD
═══════════════════════════════════════════════════════════════════════════════

PROJECT-AGNOSTIC FINANCIAL MODELING SYSTEM
Applicable to: Any industry, any business model, any investment type

CRITICAL WORKFLOW: Python Pre-Calculate → Validate → Build Excel → Review → Next Sheet

═══════════════════════════════════════════════════════════════════════════════
MANDATORY REQUIREMENTS (ALL PROJECTS)
═══════════════════════════════════════════════════════════════════════════════

1. LANGUAGE: South African English spelling throughout
   - "utilisation" not "utilization"
   - "favour" not "favor"
   - "labour" not "labor"
   - "centre" not "center"
   - "analyse" not "analyze"

2. DESIGN STANDARD: JASPER™ Design System Template 1 (JDS-T1)
   - Navy blue headers (#1F4E78)
   - Light yellow subtotals (#FFF9C4)
   - Light green variable costs (#E8F5E9)
   - Light blue fixed costs (#E3F2FD)
   - Century Gothic font family
   - Professional business formatting

3. DATA INTEGRITY: Zero hallucination tolerance
   - ALL calculations MUST be Python + SciPy pre-validated BEFORE Excel creation
   - Three-statement integration MUST balance perfectly (Assets = Liabilities + Equity)
   - Cash Flow ending balance MUST equal Balance Sheet cash (R0 variance)
   - Retained Earnings MUST equal cumulative Net Income (exact match)
   - NO estimation, NO guessing, NO approximation

4. CURRENCY: Use project-specified currency (default: ZAR "R")
   - Format: R #,##0 (no decimals) or R #,##0.00 (if cents needed)
   - Adjust for other currencies: USD "$", EUR "€", GBP "£", etc.

5. TAX RATE: Use jurisdiction-specific corporate tax rate
   - South Africa: 27%
   - Other jurisdictions: User to specify

═══════════════════════════════════════════════════════════════════════════════
SEQUENTIAL BUILD WORKFLOW
═══════════════════════════════════════════════════════════════════════════════

SHEET SEQUENCE (MANDATORY ORDER):
1. Income Statement (IS) - establishes profitability baseline
2. Cash Flow Statement (CF) - derives cash generation
3. Balance Sheet (BS) - validates three-statement integration
4. Financial Ratios & Metrics (RATIOS) - analytical dashboard
5. Sensitivity Analysis (SENSITIVITY) - risk assessment
6. Valuation (VALUATION) - investment decision framework

BUILD PROCESS FOR EACH SHEET:
┌─────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: PYTHON PRE-CALCULATION (30-40% of effort)                     │
│ ├─ Import project data and assumptions                                 │
│ ├─ Calculate ALL values for this sheet using Python + SciPy            │
│ ├─ Validate all formulas and relationships                             │
│ ├─ Solve constraints (if applicable - e.g., working capital)           │
│ ├─ Run validation checks (zero variance requirements)                  │
│ └─ Output: validated_sheet_N.json + validation_report_N.txt            │
│                                                                         │
│ PHASE 2: REVIEW & APPROVAL (10% of effort)                             │
│ ├─ Present calculated values to user                                   │
│ ├─ Show validation results (all checks passed?)                        │
│ ├─ Await user confirmation to proceed                                  │
│ └─ If issues detected: Fix in Python, re-validate, re-present         │
│                                                                         │
│ PHASE 3: EXCEL GENERATION (30-40% of effort)                           │
│ ├─ Read validated JSON for this sheet                                  │
│ ├─ Build Excel sheet with formulas (not hardcoded values)              │
│ ├─ Apply JDS-T1 formatting (colors, fonts, borders)                    │
│ ├─ Write comprehensive footnotes (6-10 per sheet)                      │
│ └─ Output: Excel file with single completed sheet                      │
│                                                                         │
│ PHASE 4: USER VALIDATION (10% of effort)                               │
│ ├─ Provide download link to Excel file                                 │
│ ├─ User reviews sheet quality, formatting, footnotes                   │
│ ├─ User confirms: "Proceed to next sheet" OR "Fix issues"              │
│ └─ If approved: Move to next sheet. If not: Iterate current sheet.    │
└─────────────────────────────────────────────────────────────────────────┘

CRITICAL: Do NOT proceed to Sheet N+1 until Sheet N is validated and approved.

═══════════════════════════════════════════════════════════════════════════════
SHEET 1: INCOME STATEMENT (START HERE - ALWAYS FIRST)
═══════════════════════════════════════════════════════════════════════════════

PHASE 1: PYTHON PRE-CALCULATION
────────────────────────────────────────────────────────────────────────────────

A. DATA INPUTS REQUIRED FROM USER:
   □ Revenue projections (by year, by category if applicable)
   □ Cost of Revenue structure:
      - Variable costs (scale with volume)
      - Fixed costs (allocated by capacity)
   □ Operating Expenses:
      - Personnel Expenses (PEREX)
      - Other Operating Expenses (OPEX)
   □ Depreciation & Amortisation schedule
   □ Interest Expense (debt structure)
   □ Tax rate (jurisdiction-specific)
   □ Time horizon (years)

B. PYTHON CALCULATIONS (MANDATORY SEQUENCE):
   ```python
   import numpy as np
   from scipy.optimize import curve_fit
   
   # Step 1: Revenue calculation
   revenue = calculate_revenue(growth_rates, base_revenue, years)
   
   # Step 2: Cost of Revenue (Variable + Fixed)
   cogs_variable = calculate_variable_cogs(revenue, variable_cost_ratios)
   cogs_fixed = calculate_fixed_cogs(capacity_utilisation, fixed_costs)
   total_cogs = cogs_variable + cogs_fixed
   
   # Step 3: Gross Profit
   gross_profit = revenue - total_cogs
   gross_margin_pct = gross_profit / revenue
   
   # Step 4: Operating Expenses
   perex = calculate_personnel_expenses(headcount, salaries, years)
   opex = calculate_operating_expenses(revenue, opex_ratios)
   total_opex = perex + opex
   
   # Step 5: EBITDA
   ebitda = gross_profit - total_opex
   ebitda_margin_pct = ebitda / revenue
   
   # Step 6: EBIT
   depreciation = calculate_depreciation(capex, useful_lives)
   ebit = ebitda - depreciation
   ebit_margin_pct = ebit / revenue
   
   # Step 7: EBT
   interest_expense = calculate_interest(debt_balance, interest_rate)
   ebt = ebit - interest_expense
   
   # Step 8: Net Income
   tax_expense = np.maximum(ebt * tax_rate, 0)  # No negative tax
   net_income = ebt - tax_expense
   net_margin_pct = net_income / revenue
   
   # Step 9: Cumulative Net Income
   cumulative_ni = np.cumsum(net_income)
   
   # VALIDATION CHECKS
   assert len(revenue) == len(net_income), "Array length mismatch"
   assert all(gross_profit == revenue - total_cogs), "Gross profit formula error"
   assert all(ebitda == gross_profit - total_opex), "EBITDA formula error"
   assert all(net_income == ebt - tax_expense), "Net income formula error"
   
   # Output to JSON
   income_statement_data = {
       "revenue": revenue.tolist(),
       "cogs_variable": cogs_variable.tolist(),
       "cogs_fixed": cogs_fixed.tolist(),
       "gross_profit": gross_profit.tolist(),
       "gross_margin_pct": gross_margin_pct.tolist(),
       "perex": perex.tolist(),
       "opex": opex.tolist(),
       "ebitda": ebitda.tolist(),
       "ebitda_margin_pct": ebitda_margin_pct.tolist(),
       "depreciation": depreciation.tolist(),
       "ebit": ebit.tolist(),
       "interest_expense": interest_expense.tolist(),
       "ebt": ebt.tolist(),
       "tax_expense": tax_expense.tolist(),
       "net_income": net_income.tolist(),
       "net_margin_pct": net_margin_pct.tolist(),
       "cumulative_ni": cumulative_ni.tolist()
   }
   
   with open('validated_sheet_1_IS.json', 'w') as f:
       json.dump(income_statement_data, f, indent=2)
   ```

C. VALIDATION REPORT (MANDATORY OUTPUT):
   ```
   ═══════════════════════════════════════════════════════════════════════
   INCOME STATEMENT VALIDATION REPORT
   ═══════════════════════════════════════════════════════════════════════
   
   PROJECT: [Project Name]
   TIME HORIZON: [N] years
   CURRENCY: [Currency Code]
   
   CALCULATED VALUES:
   ✓ Revenue: [Y1] → [YN] ([CAGR]% growth)
   ✓ Gross Profit: [Y1] → [YN] (Margin: [X]% → [Y]%)
   ✓ EBITDA: [Y1] → [YN] (Margin: [X]% → [Y]%)
   ✓ Net Income: [Y1] → [YN] (Margin: [X]% → [Y]%)
   ✓ Cumulative NI: [Total over N years]
   
   VALIDATION CHECKS:
   ✓ All array lengths match (N years)
   ✓ Gross Profit = Revenue - COGS (verified all years)
   ✓ EBITDA = Gross Profit - OpEx (verified all years)
   ✓ Net Income = EBT - Tax (verified all years)
   ✓ Tax = MAX(EBT × [rate], 0) (verified all years)
   ✓ No NaN or Inf values detected
   
   READY FOR EXCEL GENERATION: YES
   ═══════════════════════════════════════════════════════════════════════
   ```

D. USER APPROVAL REQUIRED:
   "Income Statement calculations complete. Please review validation report.
   Proceed to Excel generation? (yes/no)"

PHASE 2: EXCEL GENERATION (AFTER USER APPROVAL)
────────────────────────────────────────────────────────────────────────────────

E. EXCEL STRUCTURE (JDS-T1 FORMAT):
   Row 1: Title (e.g., "INCOME STATEMENT - [PROJECT NAME]")
          Navy fill (#1F4E78), white text, 14pt bold, merged across columns
   
   Row 2: Column headers
          [Description] [Year 1] [Year 2] ... [Year N] [% Rev (YN)]
          Navy fill (#1F4E78), white text, 11pt bold
   
   Row 3: Blank (spacing)
   
   Row 4+: Line items
      □ Revenue (bold)
      □ Cost of Revenue header (bold)
         - Variable costs (light green fill #E8F5E9)
         - Fixed costs (light blue fill #E3F2FD)
         - Subtotal: Total COGS (light yellow fill #FFF9C4, bold)
      □ Gross Profit (bold, subtle fill)
      □ Gross Margin % (italic, percentage format)
      □ Operating Expenses header (bold)
         - Personnel Expenses
         - Other Operating Expenses
         - Subtotal: Total OpEx (light yellow fill, bold)
      □ EBITDA (bold, subtle fill)
      □ EBITDA Margin % (italic, percentage format)
      □ Depreciation & Amortisation
      □ EBIT (bold, subtle fill)
      □ EBIT Margin % (italic, percentage format)
      □ Interest Expense
      □ EBT (bold)
      □ Income Tax Expense
      □ Net Income (bold, strong fill)
      □ Net Profit Margin % (italic, percentage format)
      □ Cumulative Net Income (bold, strong fill)
   
   Formatting:
   - Currency: [Currency Symbol] #,##0 or #,##0.00
   - Percentages: 0.0%
   - Font: Century Gothic, 10pt (body), 11pt (headers)
   - Borders: Light gray grid

F. COMPREHENSIVE FOOTNOTES (MINIMUM 6, EACH 3-7 SENTENCES):
   
   Write ALL footnotes in THIRD-PERSON perspective ("the company", "management")
   for THIRD-PARTY READERS (investors, lenders, board members) who know NOTHING
   about the project. Explain WHY decisions were made, not just WHAT they are.
   
   1. REVENUE MODEL & ASSUMPTIONS
      - Explain revenue sources and drivers
      - Detail growth assumptions and justification
      - Reference capacity utilisation or market penetration
      - Benchmark against industry standards if applicable
      - Explain any seasonality or cyclicality
      Length: 4-6 sentences
   
   2. COST OF REVENUE METHODOLOGY
      - Define Variable vs Fixed cost split (with examples)
      - Explain operating leverage mechanism
      - Detail economies of scale expectations
      - Reference computational methodology (SciPy optimization)
      - Justify cost assumptions vs industry benchmarks
      Length: 5-7 sentences
   
   3. OPERATING EXPENSES & SCALABILITY
      - Break down personnel vs other operating costs
      - Explain OpEx growth relative to revenue growth
      - Detail any expansion investments or efficiency gains
      - Demonstrate platform/operational scalability
      - Position OpEx trajectory as disciplined
      Length: 5-7 sentences
   
   4. PROFITABILITY TRAJECTORY & BREAK-EVEN
      - Detail break-even achievement (year and capacity)
      - Explain margin progression over time
      - Highlight operating leverage realisation
      - Compare margins to industry benchmarks
      - Position as sustainable profitability
      Length: 5-7 sentences
   
   5. EARLY-YEAR LOSSES (if applicable)
      - Explain any Year 1-2 operating losses
      - Position as strategic investment phase (not failure)
      - Detail infrastructure buildout or market entry costs
      - Justify losses as necessary for long-term value
      - Demonstrate path to profitability
      Length: 5-7 sentences
   
   6. TAX TREATMENT & ASSUMPTIONS
      - State applicable corporate tax rate and jurisdiction
      - Explain loss carry-forward treatment (if applicable)
      - Detail any tax incentives or special rates
      - Justify conservative tax assumptions
      - Note timing of tax liability
      Length: 4-6 sentences

G. EXCEL OUTPUT:
   File: [ProjectName]_Income_Statement.xlsx
   Download: [Provide computer:// link to /mnt/user-data/outputs/]
   
   User validation required: "Please review Income Statement formatting,
   formulas, and footnotes. Approve to proceed to Sheet 2 (Cash Flow)?"

═══════════════════════════════════════════════════════════════════════════════
SHEET 2: CASH FLOW STATEMENT (SECOND - AFTER INCOME STATEMENT APPROVED)
═══════════════════════════════════════════════════════════════════════════════

PHASE 1: PYTHON PRE-CALCULATION
────────────────────────────────────────────────────────────────────────────────

A. DATA INPUTS REQUIRED (IN ADDITION TO INCOME STATEMENT):
   □ CAPEX schedule (capital expenditures by year)
   □ Financing structure:
      - Loan proceeds (Year 0 or Year 1)
      - Principal repayment schedule
      - Grants (if applicable, non-repayable)
   □ Loan portfolio deployment (if applicable - e.g., microfinance)
   □ Initial cash position (Year 0)

B. PYTHON CALCULATIONS (CRITICAL - MUST SOLVE ALGEBRAICALLY):
   ```python
   from scipy.optimize import fsolve
   import numpy as np
   
   # Import from Sheet 1
   net_income = income_statement_data['net_income']
   depreciation = income_statement_data['depreciation']
   
   # Given data
   capex = [user_provided_capex_by_year]
   loan_proceeds = [user_provided_loans]
   grant_proceeds = [user_provided_grants]
   
   # CRITICAL: Working Capital Changes must be SOLVED, not estimated
   # This is the key to three-statement integration
   
   def balance_equations(working_capital_changes):
       """
       Solve for working capital changes that force:
       1. Cash Flow ending = Balance Sheet cash (all years)
       2. Balance Sheet balances (Assets = Liab + Equity)
       """
       
       # Operating Cash Flow
       operating_cf = net_income + depreciation + working_capital_changes
       
       # Investing Cash Flow
       investing_cf = -capex + other_investing_activities
       
       # Financing Cash Flow
       financing_cf = loan_proceeds + grant_proceeds - principal_repayments
       
       # Net Change in Cash
       net_change = operating_cf + investing_cf + financing_cf
       
       # Ending Cash
       cash_ending = [initial_cash]
       for i, change in enumerate(net_change):
           cash_ending.append(cash_ending[-1] + change)
       cash_ending = np.array(cash_ending[1:])  # Remove initial
       
       # Calculate Balance Sheet cash (from BS equations)
       balance_sheet_cash = calculate_balance_sheet_cash(
           working_capital_changes, capex, loan_proceeds, grant_proceeds
       )
       
       # Constraint: Cash Flow ending MUST equal Balance Sheet cash
       constraint = cash_ending - balance_sheet_cash
       
       return constraint  # Must be zero for all years
   
   # Solve for working capital changes
   initial_guess = np.zeros(len(years))
   working_capital_solution = fsolve(balance_equations, initial_guess)
   
   # Calculate final cash flows with solved working capital
   operating_cf = net_income + depreciation + working_capital_solution
   investing_cf = -capex + other_investing
   financing_cf = loan_proceeds + grant_proceeds - principal_repayments
   net_change = operating_cf + investing_cf + financing_cf
   
   cash_beginning = [initial_cash] + list(cash_ending[:-1])
   cash_ending = cash_beginning + net_change
   
   # VALIDATION: Cash ending MUST match Balance Sheet
   balance_sheet_cash = calculate_balance_sheet_cash(...)
   variance = cash_ending - balance_sheet_cash
   
   assert np.allclose(variance, 0, atol=1e-6), f"Cash variance: {variance}"
   
   # Output to JSON
   cash_flow_data = {
       "net_income": net_income.tolist(),
       "depreciation": depreciation.tolist(),
       "working_capital_changes": working_capital_solution.tolist(),
       "operating_cf": operating_cf.tolist(),
       "capex": capex,
       "investing_cf": investing_cf.tolist(),
       "financing_cf": financing_cf.tolist(),
       "net_change": net_change.tolist(),
       "cash_beginning": cash_beginning,
       "cash_ending": cash_ending.tolist(),
       "validation": {
           "balance_sheet_cash": balance_sheet_cash.tolist(),
           "variance": variance.tolist()  # Should be all zeros
       }
   }
   
   with open('validated_sheet_2_CF.json', 'w') as f:
       json.dump(cash_flow_data, f, indent=2)
   ```

C. VALIDATION REPORT:
   ```
   ═══════════════════════════════════════════════════════════════════════
   CASH FLOW STATEMENT VALIDATION REPORT
   ═══════════════════════════════════════════════════════════════════════
   
   CALCULATED VALUES:
   ✓ Operating CF: [Y1] → [YN]
   ✓ Investing CF: [Y1] → [YN]
   ✓ Financing CF: [Y1] → [YN]
   ✓ Cash Ending: [Y1] → [YN]
   
   CRITICAL VALIDATION:
   ✓ Working Capital Changes: SOLVED algebraically (SciPy fsolve)
   ✓ Cash Flow Ending = Balance Sheet Cash (variance: R0 all years)
   ✓ Operating CF = Net Income + Depreciation + WC Changes (verified)
   ✓ Net Change = Operating + Investing + Financing (verified)
   ✓ Ending = Beginning + Net Change (verified all years)
   
   THREE-STATEMENT INTEGRATION: PERFECT ✓
   
   READY FOR EXCEL GENERATION: YES
   ═══════════════════════════════════════════════════════════════════════
   ```

D. USER APPROVAL REQUIRED:
   "Cash Flow Statement calculations complete. Working capital solved
   algebraically. Variance = R0 all years. Proceed to Excel generation? (yes/no)"

PHASE 2: EXCEL GENERATION (AFTER USER APPROVAL)
────────────────────────────────────────────────────────────────────────────────

E. EXCEL STRUCTURE (THREE SECTIONS):
   □ OPERATING ACTIVITIES
      - Net Income (link to IS)
      - Add: Depreciation & Amortisation (link to IS)
      - Changes in Working Capital (calculated, annotate "Solved via SciPy")
      - = Cash Flow from Operating Activities (subtotal, yellow fill)
   
   □ INVESTING ACTIVITIES
      - Capital Expenditure (CAPEX)
      - Loan Portfolio to Farmers (if applicable)
      - Other investing activities
      - = Cash Flow from Investing Activities (subtotal, yellow fill)
   
   □ FINANCING ACTIVITIES
      - Loan Proceeds
      - Government Grants (if applicable)
      - Principal Repayments
      - = Cash Flow from Financing Activities (subtotal, yellow fill)
   
   □ NET CHANGE IN CASH (bold)
   □ Cash - Beginning of Year
   □ Cash - End of Year (bold, strong fill)
   
   □ VALIDATION SECTION (critical):
      - Cash per Balance Sheet (link to BS when built)
      - Difference (formula: CF Ending - BS Cash)
      - Conditional formatting: Green if 0, Red if not

F. COMPREHENSIVE FOOTNOTES (MINIMUM 6):
   [Similar structure to Income Statement - explain operating activities,
   CAPEX strategy, financing structure, cash position growth, etc.]

G. EXCEL OUTPUT:
   Add Cash Flow sheet to existing workbook
   User validation required before proceeding to Sheet 3

═══════════════════════════════════════════════════════════════════════════════
SHEET 3: BALANCE SHEET (THIRD - AFTER CASH FLOW APPROVED)
═══════════════════════════════════════════════════════════════════════════════

[Similar structure: Python pre-calculate → Validate → Build Excel → Approve]

KEY: Retained Earnings MUST equal Cumulative Net Income from Sheet 1
     Cash MUST equal Cash Ending from Sheet 2
     Assets MUST equal Liabilities + Equity (R0 variance)

═══════════════════════════════════════════════════════════════════════════════
SHEET 4: FINANCIAL RATIOS (FOURTH - AFTER BALANCE SHEET APPROVED)
═══════════════════════════════════════════════════════════════════════════════

[Similar structure: Python pre-calculate all ratios → Validate → Build → Approve]

KEY: Calculate 44+ financial ratios using data from Sheets 1-3
     Handle undefined ratios gracefully (negative equity → ROE undefined)

═══════════════════════════════════════════════════════════════════════════════
SHEET 5: SENSITIVITY ANALYSIS (FIFTH - AFTER RATIOS APPROVED)
═══════════════════════════════════════════════════════════════════════════════

[Similar structure: Python scenario generation → Validate → Build → Approve]

KEY: Generate 5 scenarios, build NPV/IRR sensitivity tables, tornado analysis

═══════════════════════════════════════════════════════════════════════════════
SHEET 6: VALUATION (SIXTH - AFTER SENSITIVITY APPROVED)
═══════════════════════════════════════════════════════════════════════════════

[Similar structure: Python DCF/IRR/NPV calculation → Validate → Build → Approve]

KEY: Calculate explicit IRR, NPV, MOIC, Payback
     Provide explicit investment recommendation (PROCEED/CONDITIONAL/DECLINE)

═══════════════════════════════════════════════════════════════════════════════
FINAL DELIVERABLE (AFTER ALL 6 SHEETS APPROVED)
═══════════════════════════════════════════════════════════════════════════════

File: [ProjectName]_Financial_Model_Complete.xlsx

Contents:
- Sheet 1: Income Statement (6+ footnotes)
- Sheet 2: Cash Flow Statement (6+ footnotes)
- Sheet 3: Balance Sheet (6+ footnotes)
- Sheet 4: Financial Ratios & Metrics (8+ footnotes)
- Sheet 5: Sensitivity Analysis (8+ footnotes)
- Sheet 6: Valuation (10+ footnotes)

TOTAL: 44-50+ comprehensive footnotes
ALL formulas working (not hardcoded)
Perfect three-statement integration (R0 variance)
JDS-T1 formatting throughout
South African English spelling
Investment-grade quality

Download: computer:///mnt/user-data/outputs/[ProjectName]_Financial_Model_Complete.xlsx

═══════════════════════════════════════════════════════════════════════════════
CRITICAL SUCCESS FACTORS
═══════════════════════════════════════════════════════════════════════════════

1. ✓ SEQUENTIAL BUILD: Complete one sheet fully before next
2. ✓ PYTHON PRE-CALCULATE: All values computed and validated before Excel
3. ✓ ZERO VARIANCE: Three-statement integration perfect (Assets = Liab + Equity)
4. ✓ ALGEBRAIC SOLVING: Working capital SOLVED, not estimated
5. ✓ USER VALIDATION: Approve each sheet before proceeding
6. ✓ COMPREHENSIVE FOOTNOTES: 6-10 per sheet, 3-7 sentences each
7. ✓ THIRD-PERSON PERSPECTIVE: Written for external readers
8. ✓ COMPUTATIONAL RIGOR: Reference Python/SciPy/Julia methodology
9. ✓ INDUSTRY BENCHMARKS: Compare to relevant standards
10. ✓ EXPLICIT RECOMMENDATION: Investment decision stated clearly (Sheet 6)

═══════════════════════════════════════════════════════════════════════════════

BEGIN EXECUTION: 

User must provide:
1. Project name
2. Industry/sector
3. Time horizon (years)
4. Currency
5. Revenue assumptions
6. Cost structure
7. Financing structure
8. Tax rate

Then Claude will:
1. Start with Sheet 1 (Income Statement)
2. Python pre-calculate all values
3. Present validation report
4. Await approval
5. Build Excel Sheet 1
6. Present for review
7. Await approval
8. Proceed to Sheet 2
9. Repeat process
10. Complete all 6 sheets sequentially

PROJECT DETAILS:
[User to provide]

EXECUTE: Begin with Sheet 1 Python pre-calculation.
```

---

## 🎯 USAGE INSTRUCTIONS

### **How to Use This Generic Prompt:**

1. **Copy the entire master prompt above**
2. **Provide your project details** at the "PROJECT DETAILS" section:

```
PROJECT DETAILS:
- Project Name: [Your Project]
- Industry: [Agriculture / Tech / Manufacturing / Real Estate / etc.]
- Time Horizon: [5 / 10 / 15 years]
- Currency: [ZAR / USD / EUR / etc.]
- Tax Rate: [27% / 21% / etc.]

REVENUE ASSUMPTIONS:
[Your revenue model and growth rates]

COST STRUCTURE:
[Your variable and fixed cost breakdown]

FINANCING STRUCTURE:
[Loans, grants, equity - amounts and terms]

EXECUTE: Begin with Sheet 1 Python pre-calculation.
```

3. **Claude will respond with Python validation for Sheet 1**
4. **Review validation report and approve**
5. **Claude builds Excel Sheet 1**
6. **Review Excel output and approve**
7. **Claude proceeds to Sheet 2**
8. **Repeat until all 6 sheets complete**

---

## 💡 KEY IMPROVEMENTS IN v2.0

### **1. Project-Agnostic (Works for ANY Project)**
- Not tied to UAEI or agriculture
- Generic structure works for tech, manufacturing, real estate, etc.
- User provides project-specific inputs

### **2. Sequential Sheet-by-Sheet Build**
- Complete Sheet 1 → Approve → Sheet 2 → Approve → etc.
- Full attention to each sheet (no rushing)
- Immediate error detection
- User validation at each stage

### **3. Explicit Python Pre-Calculation**
- **30-40% of effort** on Python validation BEFORE Excel
- Detailed code examples shown for each sheet
- SciPy constraint solving for working capital
- Validation reports after each calculation phase

### **4. User Approval Gates**
- After Python validation: "Proceed to Excel? (yes/no)"
- After Excel generation: "Approve sheet? (yes/no)"
- Cannot proceed without explicit approval

### **5. Generic Footnote Templates**
- Applicable to any industry
- Third-person perspective maintained
- Explains WHY (strategic rationale)
- Technical but accessible

---

## 🚀 JASPER™ SYSTEM PHILOSOPHY

**JASPER™ = Julia Architected SQL-Powered Excel Reference**

**Three-tier architecture:**
1. **Computational Layer**: Python + SciPy (or Julia for extreme optimization)
2. **Data Layer**: JSON intermediate format (audit trail)
3. **Presentation Layer**: Excel (C# + ClosedXML)

**Why this approach?**
- ✅ Python excels at solving (math, optimization, validation)
- ✅ JSON provides audit trail (all calculations documented)
- ✅ C# excels at building (Excel generation, formatting)
- ✅ Separation of concerns (compute vs present)

**Result:** Investment-grade financial models with computational rigor and professional presentation.

---

## ✅ VALIDATION CHECKLIST

**Before submitting to JASPER™ system:**
- [ ] Project name and industry specified
- [ ] Time horizon defined (years)
- [ ] Currency specified
- [ ] Tax rate provided
- [ ] Revenue assumptions detailed
- [ ] Cost structure breakdown provided
- [ ] Financing structure specified (loans, grants, equity)
- [ ] CAPEX schedule available

**After each sheet:**
- [ ] Python validation report reviewed
- [ ] All checks passed (zero variance where required)
- [ ] Excel formatting correct (JDS-T1)
- [ ] Footnotes comprehensive (6-10 per sheet, 3-7 sentences each)
- [ ] Formulas working (not hardcoded values)
- [ ] User approval obtained before next sheet

**Final model:**
- [ ] All 6 sheets complete
- [ ] Three-statement integration perfect (R0 variance)
- [ ] 44-50+ comprehensive footnotes total
- [ ] All formulas linked and working
- [ ] Professional presentation (investor-ready)

---

**This is the JASPER™ standard for investment-grade financial modeling.** 🎯

**Use this prompt for ANY financial modeling project - infrastructure, tech, agriculture, manufacturing, services, real estate - and receive consistent, rigorous, professional results every time.**

---

END OF MASTER PROMPT
