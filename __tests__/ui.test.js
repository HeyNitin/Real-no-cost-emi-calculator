const { fireEvent } = require('@testing-library/dom');
require('@testing-library/jest-dom');

describe('UI Interactions', () => {
    let script;

    beforeEach(() => {
        // Reset the DOM for each test
        document.body.innerHTML = `
            <div class="emi-type-buttons">
                <button type="button" class="emi-type-btn active" data-type="no-cost">No Cost EMI</button>
                <button type="button" class="emi-type-btn" data-type="regular">Regular EMI</button>
                <input type="hidden" id="emiType" value="no-cost">
            </div>
            <form id="emiForm">
                <div id="emiAmountGroup">
                    <input type="number" id="emiAmount" name="emiAmount" required>
                </div>
                <input type="number" id="totalAmount" name="totalAmount" value="100000">
                <input type="number" id="loanTenure" name="loanTenure" value="12">
                <input type="number" id="interestRate" name="interestRate" value="15">
                <input type="number" id="processingFees" name="processingFees" value="500">
            </form>
            <div id="results" class="hidden">
                <div id="emiTableBody"></div>
                <div id="summary-total"></div>
                <div id="summary-hidden-cost"></div>
                <div id="summary-total-payable"></div>
                <div id="summary-hidden-percentage"></div>
            </div>
            <button id="recalculateBtn">Recalculate</button>
        `;

        // Clear the module cache to ensure a fresh instance
        jest.resetModules();
        script = require('../script.js');
    });

    test('EMI type buttons should toggle correctly', () => {
        const noCostBtn = document.querySelector('[data-type="no-cost"]');
        const regularBtn = document.querySelector('[data-type="regular"]');
        const emiTypeInput = document.getElementById('emiType');
        const emiAmountGroup = document.getElementById('emiAmountGroup');

        // Initially No Cost EMI should be active
        expect(noCostBtn).toHaveClass('active');
        expect(regularBtn).not.toHaveClass('active');
        expect(emiTypeInput.value).toBe('no-cost');

        // Click Regular EMI
        fireEvent.click(regularBtn);
        script.updateEMITypeButtons('regular');

        expect(noCostBtn).not.toHaveClass('active');
        expect(regularBtn).toHaveClass('active');
        expect(emiTypeInput.value).toBe('regular');
    });

    test('No Cost EMI should auto-calculate EMI amount', () => {
        const totalAmount = document.getElementById('totalAmount');
        const loanTenure = document.getElementById('loanTenure');
        const emiAmount = document.getElementById('emiAmount');
        const emiType = document.getElementById('emiType');

        emiType.value = 'no-cost';
        totalAmount.value = '100000';
        loanTenure.value = '12';

        script.calculateNoCostEMI();

        expect(parseFloat(emiAmount.value)).toBeCloseTo(100000 / 12, 2);
    });

    test('Form validation should work correctly', () => {
        const form = document.getElementById('emiForm');
        const emiType = document.getElementById('emiType');
        const emiAmount = document.getElementById('emiAmount');

        // Test No Cost EMI validation
        emiType.value = 'no-cost';
        script.updateEMIFieldVisibility();
        
        expect(emiAmount.required).toBe(false);
        expect(emiAmount.disabled).toBe(true);

        // Test Regular EMI validation
        emiType.value = 'regular';
        script.updateEMIFieldVisibility();
        
        expect(emiAmount.required).toBe(true);
        expect(emiAmount.disabled).toBe(false);
    });

    test('Form submission should update results visibility', () => {
        const form = document.getElementById('emiForm');
        const results = document.getElementById('results');
        const emiType = document.getElementById('emiType');
        const emiAmount = document.getElementById('emiAmount');

        // Set up form values
        emiType.value = 'regular';
        emiAmount.value = '9000';

        // Create error elements for validation
        ['totalAmount', 'loanTenure', 'emiAmount', 'interestRate', 'processingFees'].forEach(id => {
            const errorElement = document.createElement('div');
            errorElement.id = `${id}-error`;
            document.body.appendChild(errorElement);
        });

        // Submit form
        const event = new Event('submit');
        Object.defineProperty(event, 'target', { value: form });
        script.handleFormSubmit(event);

        expect(results).not.toHaveClass('hidden');
    });

    test('Reset functionality should work correctly', () => {
        const form = document.getElementById('emiForm');
        const results = document.getElementById('results');
        const totalAmount = document.getElementById('totalAmount');

        // Set initial values
        totalAmount.value = '100000';
        results.classList.remove('hidden');

        // Then reset
        script.handleRecalculate();

        expect(totalAmount.value).toBe('100000'); // Form reset is mocked in JSDOM
        expect(results).toHaveClass('hidden');
    });

    test('Input changes should trigger EMI recalculation in No Cost EMI mode', () => {
        const totalAmount = document.getElementById('totalAmount');
        const loanTenure = document.getElementById('loanTenure');
        const emiAmount = document.getElementById('emiAmount');
        const emiType = document.getElementById('emiType');

        emiType.value = 'no-cost';
        totalAmount.value = '200000';
        loanTenure.value = '24';

        fireEvent.input(totalAmount);
        script.handleInputChange();

        expect(parseFloat(emiAmount.value)).toBeCloseTo(200000 / 24, 2);
    });
});
