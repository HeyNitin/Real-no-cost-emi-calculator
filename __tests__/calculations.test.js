describe('EMI Calculations', () => {
    let script;

    beforeEach(() => {
        // Reset the DOM for each test
        document.body.innerHTML = `
            <form id="emiForm">
                <input type="number" id="totalAmount" value="100000">
                <input type="number" id="loanTenure" value="12">
                <input type="number" id="emiAmount" value="9000">
                <input type="number" id="interestRate" value="15">
                <input type="number" id="processingFees" value="500">
                <input type="hidden" id="emiType" value="regular">
            </form>
            <div id="emiTableBody"></div>
            <div id="results" class="hidden">
                <div id="summary-total"></div>
                <div id="summary-hidden-cost"></div>
                <div id="summary-total-payable"></div>
                <div id="summary-hidden-percentage"></div>
            </div>
        `;
        
        // Clear the module cache to ensure a fresh instance
        jest.resetModules();
        script = require('../script.js');
    });

    test('calculateEMIBreakdown should calculate correct values for No Cost EMI', () => {
        const totalAmount = 100000;
        const loanTenure = 12;
        const emiAmount = totalAmount / loanTenure;
        const interestRate = 15;
        const processingFees = 500;

        const result = script.calculateEMIBreakdown(totalAmount, loanTenure, emiAmount, interestRate, processingFees);

        expect(result.breakdown).toHaveLength(12);
        expect(result.breakdown[0].totalMonthlyPayment).toBeGreaterThan(emiAmount); // First month includes processing fees
        expect(result.totalHiddenCost).toBeGreaterThan(0);
        expect(result.hiddenCostPercentage).toBeGreaterThan(0);

        // Verify the monthly calculations
        const firstMonth = result.breakdown[0];
        expect(firstMonth.processingFees).toBe(processingFees * (1 + script.GST_RATE));
        expect(firstMonth.interest).toBe(totalAmount * (interestRate / 12 / 100));
        expect(firstMonth.gstOnInterest).toBe(firstMonth.interest * script.GST_RATE);
    });

    test('calculateEMIBreakdown should calculate correct values for Regular EMI', () => {
        const totalAmount = 100000;
        const loanTenure = 12;
        const emiAmount = 9000;
        const interestRate = 15;
        const processingFees = 500;

        const result = script.calculateEMIBreakdown(totalAmount, loanTenure, emiAmount, interestRate, processingFees);

        expect(result.breakdown).toHaveLength(12);
        expect(result.totalHiddenCost).toBeGreaterThan(0);
        expect(result.hiddenCostPercentage).toBeGreaterThan(0);

        // Verify that total principal repayments match the loan amount approximately
        const totalPrincipal = result.breakdown.reduce((sum, month) => sum + month.principalRepaid, 0);
        expect(Math.abs(totalPrincipal - totalAmount)).toBeLessThan(500); // Allow for small differences due to interest calculations
    });

    test('calculateEMIBreakdown should handle edge cases', () => {
        // Test with zero processing fees
        const result1 = script.calculateEMIBreakdown(100000, 12, 8500, 15, 0);
        expect(result1.breakdown[0].processingFees).toBe(0);

        // Test with zero interest rate
        const result2 = script.calculateEMIBreakdown(100000, 12, 8500, 0, 500);
        expect(result2.breakdown[0].interest).toBe(0);
        expect(result2.breakdown[0].gstOnInterest).toBe(0);

        // Test with minimum values
        const result3 = script.calculateEMIBreakdown(1, 1, 1, 1, 1);
        expect(result3.breakdown).toHaveLength(1);
        expect(Math.abs(result3.breakdown[0].remainingBalance)).toBeLessThan(0.01); // Allow for floating point imprecision
    });

    test('formatCurrency should format numbers correctly', () => {
        expect(script.formatCurrency(1234.567)).toBe('₹1,234.57');
        expect(script.formatCurrency(0)).toBe('₹0.00');
        expect(script.formatCurrency(1000000)).toBe('₹10,00,000.00');
    });

    test('formatPercentage should format numbers correctly', () => {
        expect(script.formatPercentage(12.345)).toBe('12.35%');
        expect(script.formatPercentage(0)).toBe('0.00%');
        expect(script.formatPercentage(100)).toBe('100.00%');
    });

    test('validateInput should validate numeric inputs correctly', () => {
        const input = document.getElementById('totalAmount');
        const errorElement = document.createElement('div');
        errorElement.id = 'totalAmount-error';
        document.body.appendChild(errorElement);

        // Test valid input
        input.value = '1000';
        expect(script.validateInput(input, 'Total Amount')).toBe(true);
        expect(errorElement.textContent).toBe('');

        // Test invalid input
        input.value = '-1000';
        expect(script.validateInput(input, 'Total Amount')).toBe(false);
        expect(errorElement.textContent).toBe('Please enter a valid Total Amount');

        // Test empty input
        input.value = '';
        expect(script.validateInput(input, 'Total Amount')).toBe(false);
        expect(errorElement.textContent).toBe('Please enter a valid Total Amount');
    });
});
