// Constants
const GST_RATE = 0.18;

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

function formatPercentage(value) {
    return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value) + '%';
}

function validateInput(input, fieldName) {
    const value = parseFloat(input.value);
    const errorElement = document.getElementById(`${input.id}-error`);
    
    if (!errorElement) {
        return !isNaN(value) && value >= 0;
    }

    if (isNaN(value) || value < 0) {
        errorElement.textContent = `Please enter a valid ${fieldName}`;
        return false;
    }
    
    errorElement.textContent = '';
    return true;
}

function calculateEMIBreakdown(totalAmount, loanTenure, emiAmount, interestRate, processingFees) {
    const breakdown = [];
    let remainingBalance = totalAmount;
    let totalProcessingFees = processingFees * (1 + GST_RATE);
    let totalInterest = 0;
    let totalGSTOnInterest = 0;

    for (let month = 1; month <= loanTenure; month++) {
        const monthlyInterest = remainingBalance * (interestRate / 12 / 100);
        const gstOnInterest = monthlyInterest * GST_RATE;
        const principalRepaid = emiAmount - monthlyInterest;
        
        totalInterest += monthlyInterest;
        totalGSTOnInterest += gstOnInterest;
        
        const monthlyBreakdown = {
            month,
            principalRepaid,
            interest: monthlyInterest,
            gstOnInterest,
            processingFees: month === 1 ? totalProcessingFees : 0,
            totalMonthlyPayment: emiAmount + (month === 1 ? totalProcessingFees : 0) + gstOnInterest,
            remainingBalance: Math.max(0, remainingBalance - principalRepaid)
        };
        
        breakdown.push(monthlyBreakdown);
        remainingBalance = monthlyBreakdown.remainingBalance;
    }

    const totalHiddenCost = totalProcessingFees + totalInterest + totalGSTOnInterest;
    const hiddenCostPercentage = (totalHiddenCost / totalAmount) * 100;

    return {
        breakdown,
        totalHiddenCost,
        hiddenCostPercentage
    };
}

function updateEMIFieldVisibility() {
    const emiType = document.getElementById('emiType')?.value || 'regular';
    const emiAmountGroup = document.getElementById('emiAmountGroup');
    const emiAmountInput = document.getElementById('emiAmount');
    
    if (!emiAmountGroup || !emiAmountInput) return;

    if (emiType === 'no-cost') {
        emiAmountGroup.style.display = 'none';
        emiAmountInput.required = false;
        emiAmountInput.disabled = true;
        calculateNoCostEMI();
    } else {
        emiAmountGroup.style.display = 'block';
        emiAmountInput.required = true;
        emiAmountInput.disabled = false;
        emiAmountInput.value = '';
    }
}

function calculateNoCostEMI() {
    const totalAmount = document.getElementById('totalAmount');
    const loanTenure = document.getElementById('loanTenure');
    const emiAmount = document.getElementById('emiAmount');
    
    if (!totalAmount || !loanTenure || !emiAmount) return;
    
    const amount = parseFloat(totalAmount.value);
    const tenure = parseFloat(loanTenure.value);
    
    if (!isNaN(amount) && !isNaN(tenure) && tenure > 0) {
        emiAmount.value = (amount / tenure).toFixed(2);
    }
}

function handleInputChange() {
    const emiType = document.getElementById('emiType');
    if (emiType && emiType.value === 'no-cost') {
        calculateNoCostEMI();
    }
}

function updateEMITypeButtons(selectedType) {
    const buttons = document.querySelectorAll('.emi-type-btn');
    const emiTypeInput = document.getElementById('emiType');
    
    if (!buttons.length || !emiTypeInput) return;

    buttons.forEach(button => {
        if (button.dataset.type === selectedType) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    emiTypeInput.value = selectedType;
    updateEMIFieldVisibility();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const inputs = form.querySelectorAll('input[type="number"]');
    let isValid = true;
    
    inputs.forEach(input => {
        const label = input.name.split(/(?=[A-Z])/).join(' ');
        if (!validateInput(input, label)) {
            isValid = false;
        }
    });
    
    if (!isValid) return;
    
    const totalAmount = parseFloat(document.getElementById('totalAmount').value);
    const loanTenure = parseFloat(document.getElementById('loanTenure').value);
    const emiAmount = parseFloat(document.getElementById('emiAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const processingFees = parseFloat(document.getElementById('processingFees').value);

    const result = calculateEMIBreakdown(totalAmount, loanTenure, emiAmount, interestRate, processingFees);
    updateResults(result);
}

function handleRecalculate() {
    const form = document.getElementById('emiForm');
    if (form) {
        form.reset();
        const results = document.getElementById('results');
        if (results) {
            results.classList.add('hidden');
        }
    }
}

function updateResults(result) {
    const resultsDiv = document.getElementById('results');
    const tableBody = document.getElementById('emiTableBody');
    
    if (!resultsDiv || !tableBody) return;
    
    tableBody.innerHTML = '';
    result.breakdown.forEach(month => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month.month}</td>
            <td>${formatCurrency(month.principalRepaid)}</td>
            <td>${formatCurrency(month.interest)}</td>
            <td>${formatCurrency(month.gstOnInterest)}</td>
            <td>${formatCurrency(month.processingFees)}</td>
            <td>${formatCurrency(month.totalMonthlyPayment)}</td>
            <td>${formatCurrency(month.remainingBalance)}</td>
        `;
        tableBody.appendChild(row);
    });
    
    const summaryTotal = document.getElementById('summary-total');
    const summaryHiddenCost = document.getElementById('summary-hidden-cost');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryHiddenPercentage = document.getElementById('summary-hidden-percentage');
    
    if (summaryTotal) {
        summaryTotal.textContent = formatCurrency(result.breakdown[0].remainingBalance);
    }
    if (summaryHiddenCost) {
        summaryHiddenCost.textContent = formatCurrency(result.totalHiddenCost);
    }
    if (summaryTotalPayable) {
        summaryTotalPayable.textContent = formatCurrency(result.breakdown[0].remainingBalance + result.totalHiddenCost);
    }
    if (summaryHiddenPercentage) {
        summaryHiddenPercentage.textContent = formatPercentage(result.hiddenCostPercentage);
    }
    
    resultsDiv.classList.remove('hidden');
}

// Initialize DOM elements and event listeners if we're in a browser environment
if (typeof window !== 'undefined') {
    // Initialize DOM elements
    const emiForm = document.getElementById('emiForm');
    const resultsSection = document.getElementById('results');
    const emiTableBody = document.getElementById('emiTableBody');
    const summaryTotal = document.getElementById('summary-total');
    const summaryHiddenCost = document.getElementById('summary-hidden-cost');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryHiddenPercentage = document.getElementById('summary-hidden-percentage');
    const recalculateBtn = document.getElementById('recalculateBtn');
    const calculatorSection = document.getElementById('calculator-section');
    const emiType = document.getElementById('emiType');
    const emiAmountGroup = document.getElementById('emiAmountGroup');
    const emiAmountInput = document.getElementById('emiAmount');
    const totalAmountInput = document.getElementById('totalAmount');
    const loanTenureInput = document.getElementById('loanTenure');
    const emiTypeButtons = document.querySelectorAll('.emi-type-btn');

    // Add event listeners
    if (emiForm) {
        emiForm.addEventListener('submit', handleFormSubmit);
    }
    if (emiTypeButtons) {
        emiTypeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedType = button.dataset.type;
                updateEMITypeButtons(selectedType);
                handleRecalculate();
            });
        });
    }
    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', handleRecalculate);
    }
    if (totalAmountInput) {
        totalAmountInput.addEventListener('input', handleInputChange);
    }
    if (loanTenureInput) {
        loanTenureInput.addEventListener('input', handleInputChange);
    }
    if (emiType) {
        emiType.addEventListener('change', updateEMIFieldVisibility);
    }

    // Initialize EMI field visibility
    updateEMIFieldVisibility();
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateEMIBreakdown,
        formatCurrency,
        formatPercentage,
        validateInput,
        updateEMIFieldVisibility,
        calculateNoCostEMI,
        handleInputChange,
        updateEMITypeButtons,
        handleFormSubmit,
        handleRecalculate,
        GST_RATE
    };
}
