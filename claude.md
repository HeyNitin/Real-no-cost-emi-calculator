# Real No-Cost EMI Calculator

## Project Overview

A lightweight web application that helps Indian consumers understand the true financial cost of EMI payments. It reveals hidden charges like processing fees, GST on interest, and total interest paid over the loan tenure.

**EMI Types Supported:**
- **No-Cost EMI**: Banks charge interest but it's given as an upfront discount by the seller
- **Regular EMI**: Standard EMI calculations with explicit interest rates

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Testing**: Jest + Testing Library (DOM utilities)
- **Transpilation**: Babel
- **Analytics**: Microsoft Clarity
- **Git Hooks**: simple-git-hooks (pre-commit runs tests)

## Project Structure

```
├── index.html          # Main HTML file (single page app)
├── script.js           # Core application logic
├── styles.css          # Styling with CSS variables
├── __tests__/          # Test suite
│   ├── calculations.test.js
│   └── ui.test.js
├── __mocks__/          # Mock files for testing
└── jest.config.js      # Jest configuration
```

## Commands

```bash
npm test              # Run all tests once
npm run test:watch    # Run tests in watch mode
npm run prepare       # Install git hooks
```

**Running the app**: Open `index.html` directly in browser (no build step needed)

## Key Files

- `script.js` - All calculation logic, form handling, and DOM manipulation
- `styles.css` - Responsive styles with mobile breakpoint at 768px
- `index.html` - Single page with form and results sections

## Coding Conventions

### Naming
- **camelCase** for functions and variables
- **Prefixes**: `handle*` (event handlers), `calculate*` (math), `update*` (DOM), `format*` (formatting)

### Architecture
- Pure functions for calculations (exported for testing)
- Direct DOM manipulation with event-driven architecture
- CommonJS exports for Jest compatibility

### Constants
- `GST_RATE = 0.18` (18% GST on interest in India)

## Key Formulas

**Regular EMI:**
```
EMI = P × r × (1 + r)^n / ((1 + r)^n - 1)
P = Principal, r = Monthly rate (annual/12/100), n = Tenure in months
```

**No-Cost EMI:**
```
Monthly Payment = Total Amount / Loan Tenure
```

**Hidden Cost:**
```
Total Hidden Cost = Processing Fees + Total GST on Interest
```

## Testing

Tests are organized into:
- `calculations.test.js` - Unit tests for EMI calculations
- `ui.test.js` - UI interaction and integration tests

Pre-commit hook automatically runs `npm test` before commits.

## Important Notes

- Processing fees shown only in first month with 18% GST
- GST (18%) applied to each month's interest
- Currency formatted as Indian Rupees (₹) with INR locale (1,00,000 style)
- Mobile responsive with breakpoint at 768px
