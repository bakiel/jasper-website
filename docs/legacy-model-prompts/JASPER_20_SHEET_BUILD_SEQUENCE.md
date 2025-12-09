# JASPER™ 20-SHEET BUILD SEQUENCE (GENERIC)
## Sequential Build Order with Python Pre-Calculation

**Version:** 2.1  
**System:** JASPER™ Financial Modelling  
**Language:** South African English  
**Approach:** Python + SciPy pre-calculate each sheet → Validate → Build Excel → Approve → Next

---

## 🎯 BUILD PHILOSOPHY

**ONE SHEET AT A TIME. FULL ATTENTION. FULL VALIDATION.**

```
Sheet N → Python Calculate → Validate → Build Excel → User Approve → Sheet N+1
```

**CRITICAL:** Do NOT proceed to next sheet until current sheet approved.

---

## 📋 20-SHEET BUILD SEQUENCE

### **SHEET 1: CAPEX (Capital Expenditure Schedule)**

**Purpose:** Asset costs and phasing  
**Dependencies:** None (start here)

**Python Pre-Calculate:**
```python
# Input: Asset list, costs, deployment years
# Calculate: CAPEX by year, asset categories
# Output: capex_by_year, cumulative_capex
```

**Excel Build:**
- Row headers: Asset categories (equipment, infrastructure, tech platform, etc.)
- Column headers: Years
- Subtotals: Total CAPEX per year
- Format: Currency (R #,##0)

**Validation:** Total CAPEX matches project budget

**Footnotes (3):**
1. Asset categories and deployment strategy
2. CAPEX phasing rationale (front-loaded vs staged)
3. Maintenance CAPEX assumptions (post-Year 1)

---

### **SHEET 2: DEPRECIATION (Asset Depreciation Schedule)**

**Purpose:** Depreciation calculation by asset class  
**Dependencies:** Sheet 1 (CAPEX)

**Python Pre-Calculate:**
```python
# Input: CAPEX from Sheet 1, useful lives by asset class
# Method: Straight-line depreciation
# Calculate: Annual depreciation, accumulated depreciation, net book value
# Output: depreciation_by_year, accumulated_dep, net_ppe
```

**Excel Build:**
- Gross PP&E (cumulative CAPEX)
- Less: Accumulated Depreciation
- = Net PP&E (book value)
- Annual Depreciation Expense

**Validation:** 
- Gross PP&E = Cumulative CAPEX
- Depreciation ≤ Gross PP&E (no over-depreciation)

**Footnotes (2):**
1. Depreciation methodology (straight-line, useful lives by class)
2. Residual values (if applicable)

---

### **SHEET 3: OPEX (Operating Expenses Assumptions)**

**Purpose:** Operating expense drivers (% of revenue)  
**Dependencies:** None (assumptions sheet)

**Python Pre-Calculate:**
```python
# Input: OpEx categories, driver (% of revenue or fixed amount)
# Calculate: OpEx ratios by year (efficiency gains over time)
# Use: scipy.optimize.curve_fit for efficiency curve
# Output: opex_pct_by_category_by_year
```

**Excel Build:**
- OpEx categories (platform ops, marketing, admin, etc.)
- Driver (% revenue or fixed)
- Assumptions by year (declining % = efficiency)

**Validation:** OpEx % declining over time (operating leverage)

**Footnotes (2):**
1. OpEx categories and drivers
2. Efficiency assumptions (declining % = scale benefits)

---

### **SHEET 4: PEREX (Personnel Expenses Assumptions)**

**Purpose:** Personnel cost drivers (headcount, salaries)  
**Dependencies:** None (assumptions sheet)

**Python Pre-Calculate:**
```python
# Input: Roles, headcount ramp, salaries
# Calculate: Total personnel cost by year
# Output: perex_by_year, headcount_by_year
```

**Excel Build:**
- Role categories
- Headcount by year
- Average salary by role
- Total personnel expense

**Validation:** Headcount × Salary = Total PEREX

**Footnotes (2):**
1. Headcount scaling strategy
2. Salary assumptions (inflation, performance increases)

---

### **SHEET 5: COGS (Cost of Goods Sold Assumptions)**

**Purpose:** COGS structure (variable + fixed)  
**Dependencies:** None (assumptions sheet)

**Python Pre-Calculate:**
```python
# Input: Variable cost % of revenue, fixed costs
# Calculate: COGS by year (variable scales, fixed allocated by capacity)
# Output: cogs_variable_pct, cogs_fixed_by_year
```

**Excel Build:**
- Variable COGS (% of revenue)
- Fixed COGS (absolute amounts)
- Total COGS = Variable + Fixed

**Validation:** Variable COGS % stable or declining (efficiency)

**Footnotes (2):**
1. Variable vs fixed cost split rationale
2. Operating leverage mechanism

---

### **SHEET 6: REVENUE (Revenue Model)**

**Purpose:** Revenue calculation using COGS/OPEX/PEREX assumptions  
**Dependencies:** Sheets 3, 4, 5 (cost assumptions)

**Python Pre-Calculate:**
```python
# Input: Revenue drivers (users, transactions, pricing)
# Calculate: Revenue by year
# Use Sheets 3-5 to calculate actual COGS, OpEx, PEREX
# Output: revenue_by_year, cogs_actual, opex_actual, perex_actual
```

**Excel Build:**
- Revenue drivers (volume × price)
- Growth rates by year
- Total Revenue
- Links to COGS/OpEx/PEREX (calculated)

**Validation:** Revenue growth rates match assumptions

**Footnotes (3):**
1. Revenue model and drivers
2. Growth assumptions and market validation
3. Pricing strategy

---

### **SHEET 7: STARTUP (Pre-Operational Costs)**

**Purpose:** One-time startup costs (Year 0 or Year 1)  
**Dependencies:** None

**Python Pre-Calculate:**
```python
# Input: Startup cost categories, amounts
# Calculate: Total startup costs
# Output: startup_costs_by_category, total_startup
```

**Excel Build:**
- Cost categories (legal, licensing, setup, etc.)
- Amounts
- Total Startup Costs

**Validation:** Total matches project budget (e.g., R80M)

**Footnotes (2):**
1. Startup cost categories
2. Timing (Year 0 vs Year 1)

---

### **SHEET 8: TOTAL (Funding Requirement Consolidation)**

**Purpose:** Total funding needed (CAPEX + Startup + Working Capital)  
**Dependencies:** Sheets 1, 7, 12

**Python Pre-Calculate:**
```python
# Input: CAPEX, Startup, Working Capital
# Calculate: Total funding requirement
# Output: total_funding (e.g., R508.6M)
```

**Excel Build:**
- CAPEX (from Sheet 1)
- Startup (from Sheet 7)
- Working Capital (from Sheet 12)
- = Total Funding Requirement

**Validation:** Total = Loan + Grant + Equity

**Footnotes (2):**
1. Funding requirement breakdown
2. Financing structure (debt/grant/equity mix)

---

### **SHEET 9: LOAN AMORT (Loan Amortisation Schedule)**

**Purpose:** Debt repayment schedule  
**Dependencies:** Sheet 8 (funding amount)

**Python Pre-Calculate:**
```python
# Input: Loan principal, interest rate, term, grace period
# Calculate: Monthly/annual payment, interest, principal, balance
# Output: loan_schedule (payment, interest, principal, balance by period)
```

**Excel Build:**
- Period (monthly or annual)
- Beginning Balance
- Payment (PMT formula)
- Interest (Balance × Rate)
- Principal (Payment - Interest)
- Ending Balance

**Validation:** 
- Ending Balance (final period) = 0
- Grace period: Interest-only payments

**Footnotes (2):**
1. Loan terms (principal, rate, term, grace)
2. Repayment schedule and debt service coverage

---

### **SHEET 10: FUNDING (Drawdown Schedule + Grants)**

**Purpose:** Financing inflows timing  
**Dependencies:** Sheet 8 (total funding), Sheet 9 (loan)

**Python Pre-Calculate:**
```python
# Input: Loan drawdown schedule, grant timing
# Calculate: Cash inflows by year
# Output: funding_inflows_by_year
```

**Excel Build:**
- Loan drawdowns (by year)
- Grant receipts (by year)
- Equity contributions (by year)
- = Total Funding Inflows

**Validation:** Total Inflows = Total Funding (Sheet 8)

**Footnotes (2):**
1. Drawdown schedule rationale
2. Grant terms and conditions

---

### **SHEET 11: ASSUMPTIONS (Master Assumptions)**

**Purpose:** Consolidate all assumptions in one place  
**Dependencies:** Sheets 1-10

**Python Pre-Calculate:**
```python
# Input: All assumption sheets
# Consolidate: Key assumptions (growth, margins, costs, financing)
# Output: master_assumptions_dict
```

**Excel Build:**
- Revenue assumptions
- Cost assumptions
- CAPEX assumptions
- Financing assumptions
- Macroeconomic assumptions (inflation, FX, tax rate)

**Validation:** All assumptions referenced by other sheets

**Footnotes (3):**
1. Key assumptions and sensitivities
2. Macroeconomic environment
3. Risk factors and mitigation

---

### **SHEET 12: WORKING CAP (Working Capital Schedule)**

**Purpose:** AR, Inventory, AP calculations  
**Dependencies:** Sheet 6 (revenue), Sheet 5 (COGS)

**Python Pre-Calculate:**
```python
# Input: Revenue, COGS, DSO, DIO, DPO assumptions
# Calculate: AR, Inventory, AP by year
# Net Working Capital = AR + Inventory - AP
# Working Capital Changes = NWC(t) - NWC(t-1)
# Output: nwc_by_year, wc_changes_by_year
```

**Excel Build:**
- Accounts Receivable (Revenue × DSO / 365)
- Inventory (COGS × DIO / 365)
- Accounts Payable (COGS × DPO / 365)
- = Net Working Capital
- Working Capital Changes (year-over-year)

**Validation:** NWC changes flow to Cash Flow Statement

**Footnotes (2):**
1. Working capital assumptions (DSO/DIO/DPO)
2. Negative working capital benefit (if applicable)

---

### **SHEET 13: INCOME STMT (Income Statement)**

**Purpose:** Profitability statement  
**Dependencies:** Sheets 2, 3, 4, 5, 6 (all cost/revenue sheets)

**Python Pre-Calculate:**
```python
# Input: Revenue, COGS, OpEx, PEREX, Depreciation, Interest, Tax
# Calculate: Gross Profit, EBITDA, EBIT, EBT, Net Income
# Output: income_statement_by_year
```

**Excel Build:**
- Revenue
- Less: COGS (link Sheet 6)
- = Gross Profit
- Less: OpEx + PEREX (link Sheets 3, 4)
- = EBITDA
- Less: Depreciation (link Sheet 2)
- = EBIT
- Less: Interest (link Sheet 9)
- = EBT
- Less: Tax
- = Net Income
- Cumulative Net Income

**Validation:** All formulas link to source sheets

**Footnotes (6):** Revenue model, COGS methodology, OpEx, profitability trajectory, losses (if applicable), tax treatment

---

### **SHEET 14: CASH FLOW (Cash Flow Statement)**

**Purpose:** Cash generation analysis  
**Dependencies:** Sheet 13 (IS), Sheet 12 (WC), Sheet 1 (CAPEX), Sheet 10 (Funding)

**Python Pre-Calculate (CRITICAL - SOLVE ALGEBRAICALLY):**
```python
from scipy.optimize import fsolve

# MUST solve for Working Capital Changes to force Cash Flow = Balance Sheet
def balance_equations(wc_changes):
    operating_cf = net_income + depreciation + wc_changes
    investing_cf = -capex
    financing_cf = loan_inflows - principal_repayments + grants
    cash_ending = cash_beginning + operating_cf + investing_cf + financing_cf
    
    # Balance Sheet cash (calculated separately)
    bs_cash = calculate_bs_cash(wc_changes)
    
    return cash_ending - bs_cash  # Must be zero

wc_solution = fsolve(balance_equations, initial_guess)
```

**Excel Build:**
- Operating Activities (NI + Dep + WC Changes)
- Investing Activities (CAPEX)
- Financing Activities (Loan + Grant - Repayments)
- = Net Change in Cash
- Cash Beginning + Net Change = Cash Ending
- **VALIDATION SECTION:** Cash per BS, Difference (MUST = R0)

**Validation:** Cash Ending = Balance Sheet Cash (R0 variance all years)

**Footnotes (6):** Operating activities, CAPEX strategy, loan portfolio, financing structure, cash position, integration methodology

---

### **SHEET 15: BALANCE SHEET (Balance Sheet)**

**Purpose:** Financial position  
**Dependencies:** Sheet 14 (CF), Sheet 13 (IS), Sheet 2 (Depreciation)

**Python Pre-Calculate (CRITICAL - THREE-STATEMENT INTEGRATION):**
```python
# MUST solve complete system to force balance
def three_statement_balance(params):
    # Assets
    cash = cf_ending_cash
    nwc = calculate_nwc(wc_changes)
    gross_ppe = cumulative_capex
    accum_dep = cumulative_depreciation
    net_ppe = gross_ppe - accum_dep
    total_assets = cash + nwc + net_ppe
    
    # Liabilities + Equity
    debt = loan_balance
    retained_earnings = cumulative_net_income
    grant = grant_amount
    total_liab_equity = debt + grant + retained_earnings
    
    # Constraint
    return total_assets - total_liab_equity  # Must be zero

solution = fsolve(three_statement_balance, initial_guess)
```

**Excel Build:**
- **ASSETS:**
  - Cash (link Sheet 14)
  - Net Working Capital (link Sheet 12)
  - Gross PP&E, Less: Accum Dep, = Net PP&E (link Sheet 2)
  - = Total Assets
- **LIABILITIES:**
  - Loan (link Sheet 9)
- **EQUITY:**
  - Government Grant
  - Retained Earnings (link Sheet 13 Cumulative NI)
  - = Total Equity
- = Total Liabilities + Equity
- **VALIDATION:** Difference (Assets - Liab - Equity, MUST = R0)

**Validation:** Assets = Liabilities + Equity (R0 variance all years)

**Footnotes (6):** NWC, PP&E, financing structure, negative equity (if applicable), D/E trajectory, integration methodology

---

### **SHEET 16: RATIO (Financial Ratios & Metrics)**

**Purpose:** Analytical dashboard  
**Dependencies:** Sheets 13, 14, 15 (all three statements)

**Python Pre-Calculate:**
```python
# Calculate 44+ financial ratios
# Handle undefined ratios (negative equity → ROE undefined)
# Identify trends (improving/declining)
# Benchmark against industry
# Output: ratios_by_year, trends, benchmarks
```

**Excel Build:**
- Liquidity Ratios (Current, Quick, Cash)
- Profitability Ratios (Margins, ROA, ROE)
- Leverage Ratios (D/E, D/A, Interest Coverage)
- Efficiency Ratios (Asset Turnover)
- Cash Flow Metrics (Operating CF Margin, FCF)
- Growth Metrics (Revenue/EBITDA/NI growth YoY)

**Validation:** All ratios link to source statements

**Footnotes (8):** Liquidity, profitability, ROA, ROE, leverage, cash flow metrics, efficiency, Year 1-3 interpretation

---

### **SHEET 17: SENSITIVITY (Sensitivity Analysis)**

**Purpose:** Risk assessment  
**Dependencies:** Sheet 18 (Valuation - needs NPV/IRR base case)

**Python Pre-Calculate:**
```python
# Generate 5 scenarios (Best/Optimistic/Base/Conservative/Worst)
# Build sensitivity tables (NPV: Revenue × WACC, IRR: Revenue × Margin)
# Calculate break-even (revenue, capacity, unit economics)
# Tornado analysis (rank drivers by NPV impact)
# Output: scenarios, sensitivity_tables, break_even, tornado
```

**Excel Build:**
- Scenario table (5 scenarios with NPV/IRR)
- NPV sensitivity table (5×5 heat map)
- IRR sensitivity table (5×5 heat map)
- Break-even analysis
- Key driver tornado chart

**Validation:** Base Case matches main model

**Footnotes (8):** Scenario methodology, base case probability, downside protection, revenue sensitivity, margin sensitivity, WACC sensitivity, break-even validation, tornado analysis

---

### **SHEET 18: VALUATION (DCF, IRR, NPV)**

**Purpose:** Investment decision framework  
**Dependencies:** Sheet 14 (CF for FCF calculation)

**Python Pre-Calculate:**
```python
import numpy as np

# Free Cash Flow = Operating CF - CAPEX
fcf = operating_cf - capex

# Terminal Value (Gordon Growth Model)
terminal_fcf = fcf[-1] * (1 + terminal_growth_rate)
terminal_value = terminal_fcf / (wacc - terminal_growth_rate)

# DCF
pv_fcf = [fcf[t] / (1 + wacc)**t for t in range(len(fcf))]
pv_terminal = terminal_value / (1 + wacc)**len(fcf)
enterprise_value = sum(pv_fcf) + pv_terminal

# IRR
cash_flows = [-initial_investment] + fcf.tolist()
irr_5yr = np.irr(cash_flows[:6])
irr_10yr = np.irr(cash_flows)

# NPV
npv_5yr = np.npv(wacc, cash_flows[:6])
npv_10yr = np.npv(wacc, cash_flows)

# Payback, PI, MOIC
# Output: dcf_results, irr, npv, payback, pi, moic
```

**Excel Build:**
- DCF Analysis (FCF, Terminal Value, PV calculations)
- IRR (5-year, 10-year, vs hurdle)
- NPV (5-year, 10-year)
- Payback Period (simple, discounted)
- Profitability Index
- MOIC (5-year, 10-year)
- **INVESTMENT RECOMMENDATION:** PROCEED / CONDITIONAL / DECLINE

**Validation:** 
- IRR > Hurdle Rate (e.g., 37% > 15%)
- NPV > 0 (e.g., R3.5B)
- MOIC > 3× (e.g., 12.3×)

**Footnotes (10):** WACC derivation, FCF methodology, terminal value, 5yr vs 10yr IRR, IRR interpretation, NPV magnitude, payback, PI, MOIC, investment recommendation

---

### **SHEET 19: EXEC SUMMARY (Executive Summary)**

**Purpose:** High-level overview for decision-makers  
**Dependencies:** All sheets (consolidates key metrics)

**Python Pre-Calculate:**
```python
# Extract key metrics from all sheets
# Calculate summary statistics
# Generate executive insights
# Output: exec_summary_dict
```

**Excel Build:**
- Project Overview (1-2 paragraphs)
- Key Financial Metrics Table:
  - Total Investment Required
  - Revenue (Year 1 → Year N)
  - EBITDA (Year 1 → Year N)
  - Net Income (Year 1 → Year N)
  - IRR (5-year, 10-year)
  - NPV (10-year)
  - Payback Period
- Investment Highlights (3-5 bullet points)
- Key Risks (3-5 bullet points)
- **Recommendation:** PROCEED / CONDITIONAL / DECLINE

**Validation:** All metrics match source sheets

**Footnotes (4):** Project overview, investment thesis, key risks, recommendation rationale

---

### **SHEET 20: DASHBOARD (Visual Dashboard)**

**Purpose:** Visual summary (charts, KPIs) - **BUILD LAST**  
**Dependencies:** All sheets (visualises key data)

**Python Pre-Calculate:**
```python
# Extract data for visualisation
# Generate chart data arrays
# Calculate KPI summary stats
# Output: dashboard_data
```

**Excel Build:**
- KPI Cards (large numbers):
  - Total Investment: R508.6M
  - 10-Year Revenue: R17.4B
  - IRR: 37.18%
  - NPV: R3.5B
  - MOIC: 12.3×
- Charts:
  - Revenue & EBITDA progression (line chart)
  - Cash position over time (area chart)
  - Margin expansion (line chart)
  - Debt-to-Equity trajectory (line chart)
  - Scenario analysis (bar chart comparing 5 scenarios)
- **Traffic Lights:**
  - Green: IRR > Hurdle, NPV > 0, MOIC > 3×
  - Red: IRR < Hurdle, NPV < 0, MOIC < 2×

**Validation:** All data links to source sheets

**Footnotes (2):** Dashboard purpose, key metrics interpretation

---

## ✅ BUILD SEQUENCE SUMMARY

**PHASE 1: ASSUMPTIONS (Sheets 1-12)**
Build all assumption sheets first. No integration yet.

**PHASE 2: FINANCIAL STATEMENTS (Sheets 13-15)**
Three-statement integration. CRITICAL: Must balance perfectly.

**PHASE 3: ANALYSIS (Sheets 16-18)**
Calculate ratios, sensitivity, valuation using statements.

**PHASE 4: REPORTING (Sheets 19-20)**
Executive summary and dashboard built LAST.

---

## 🎯 CRITICAL REMINDERS

1. **Python pre-calculate EVERY sheet** before building Excel
2. **Validate EVERY sheet** before proceeding to next
3. **User approval required** after each sheet
4. **Three-statement integration** (Sheets 13-15) MUST have R0 variance
5. **Working capital** MUST be solved algebraically (Sheet 14)
6. **Balance Sheet** MUST balance (Assets = Liab + Equity, R0 variance)
7. **South African English** spelling throughout
8. **JDS-T1 formatting** applied to all sheets
9. **Comprehensive footnotes** on each sheet (2-10 depending on complexity)
10. **Build Dashboard LAST** (Sheet 20) after all data validated

---

## 📝 USAGE

```
PROJECT DETAILS:
[Your project info]

EXECUTE: Build Sheet 1 (CAPEX).
Python pre-calculate → Validate → Build Excel → Approve → Next sheet.
```

---

END OF 20-SHEET BUILD SEQUENCE
