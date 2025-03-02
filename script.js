// Constants
const GST_RATE = 0.18;

// DOM Elements
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

// Utility Functions
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value / 100);
};

const scrollToResults = () => {
    const headerHeight = document.querySelector('.sticky-header').offsetHeight;
    const resultsTop = resultsSection.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
    window.scrollTo({ top: resultsTop, behavior: 'smooth' });
};

const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const resetForm = () => {
    emiForm.reset();
    resultsSection.classList.add('hidden');
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach(element => element.textContent = '');
    updateEMIFieldVisibility();
};

const updateEMIFieldVisibility = () => {
    if (emiType.value === 'no-cost') {
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
};

const calculateNoCostEMI = () => {
    const totalAmount = parseFloat(totalAmountInput.value);
    const loanTenure = parseInt(loanTenureInput.value);
    
    if (!isNaN(totalAmount) && !isNaN(loanTenure) && totalAmount > 0 && loanTenure > 0) {
        const monthlyEMI = totalAmount / loanTenure;
        emiAmountInput.value = monthlyEMI.toFixed(2);
    }
};

const validateInput = (input, fieldName) => {
    const value = parseFloat(input.value);
    const errorElement = document.getElementById(`${input.id}-error`);
    
    if (isNaN(value) || value <= 0) {
        errorElement.textContent = `Please enter a valid ${fieldName}`;
        return false;
    }
    
    errorElement.textContent = '';
    return true;
};

// Calculation Functions
const calculateEMIBreakdown = (totalAmount, loanTenure, emiAmount, interestRate, processingFees) => {
    const monthlyInterestRate = interestRate / 12 / 100;
    let remainingBalance = totalAmount;
    const breakdown = [];
    let totalHiddenCost = 0;

    // Calculate processing fees with GST (only for first month)
    const processingFeesWithGST = processingFees * (1 + GST_RATE);
    totalHiddenCost += processingFeesWithGST;

    for (let month = 1; month <= loanTenure; month++) {
        const interest = remainingBalance * monthlyInterestRate;
        const gstOnInterest = interest * GST_RATE;
        let principalRepaid = emiAmount - interest;

        // Adjust principal repaid if it's more than remaining balance
        if (principalRepaid > remainingBalance) {
            principalRepaid = remainingBalance;
        }

        const processingFeesForMonth = month === 1 ? processingFeesWithGST : 0;
        const totalMonthlyPayment = emiAmount + gstOnInterest + processingFeesForMonth;

        breakdown.push({
            month,
            remainingBalance,
            principalRepaid,
            interest,
            gstOnInterest,
            processingFees: processingFeesForMonth,
            totalMonthlyPayment
        });

        remainingBalance -= principalRepaid;
        totalHiddenCost += gstOnInterest;
    }

    return {
        breakdown,
        totalHiddenCost,
        hiddenCostPercentage: (totalHiddenCost / totalAmount) * 100
    };
};

// UI Update Functions
const updateTable = (breakdown) => {
    emiTableBody.innerHTML = '';
    
    breakdown.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.month}</td>
            <td>${formatCurrency(row.remainingBalance)}</td>
            <td>${formatCurrency(row.principalRepaid)}</td>
            <td>${formatCurrency(row.interest)}</td>
            <td>${formatCurrency(row.gstOnInterest)}</td>
            <td>${formatCurrency(row.processingFees)}</td>
            <td>${formatCurrency(row.totalMonthlyPayment)}</td>
        `;
        emiTableBody.appendChild(tr);
    });
};

const updateSummary = (totalAmount, totalHiddenCost, hiddenCostPercentage) => {
    summaryTotal.textContent = formatCurrency(totalAmount);
    summaryHiddenCost.textContent = formatCurrency(totalHiddenCost);
    summaryTotalPayable.textContent = formatCurrency(totalAmount + totalHiddenCost);
    summaryHiddenPercentage.textContent = formatPercentage(hiddenCostPercentage);
};

// Event Listeners
emiForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get form inputs
    const totalAmount = document.getElementById('totalAmount');
    const loanTenure = document.getElementById('loanTenure');
    const emiAmount = document.getElementById('emiAmount');
    const interestRate = document.getElementById('interestRate');
    const processingFees = document.getElementById('processingFees');

    // Validate inputs
    const isValid = [
        validateInput(totalAmount, 'Total Amount'),
        validateInput(loanTenure, 'Loan Tenure'),
        emiType.value === 'no-cost' || validateInput(emiAmount, 'Monthly EMI Amount'),
        validateInput(interestRate, 'Interest Rate'),
        validateInput(processingFees, 'Processing Fees')
    ].every(Boolean);

    if (!isValid) return;

    // Calculate EMI breakdown
    const result = calculateEMIBreakdown(
        parseFloat(totalAmount.value),
        parseInt(loanTenure.value),
        parseFloat(emiAmount.value),
        parseFloat(interestRate.value),
        parseFloat(processingFees.value)
    );

    // Update UI
    updateTable(result.breakdown);
    updateSummary(
        parseFloat(totalAmount.value),
        result.totalHiddenCost,
        result.hiddenCostPercentage
    );

    // Show results section and scroll to it
    resultsSection.classList.remove('hidden');
    scrollToResults();
});

recalculateBtn.addEventListener('click', () => {
    scrollToTop();
    resetForm();
});

// Add event listeners for EMI type changes
emiType.addEventListener('change', () => {
    updateEMIFieldVisibility();
});

// Add event listeners for automatic No Cost EMI calculation
totalAmountInput.addEventListener('input', () => {
    if (emiType.value === 'no-cost') {
        calculateNoCostEMI();
    }
});

loanTenureInput.addEventListener('input', () => {
    if (emiType.value === 'no-cost') {
        calculateNoCostEMI();
    }
});

// Initialize EMI field visibility on page load
updateEMIFieldVisibility();

// EMI type button functionality
const emiTypeButtons = document.querySelectorAll('.emi-type-btn');
const emiTypeInput = document.getElementById('emiType');

// Update EMI type buttons
const updateEMITypeButtons = (selectedType) => {
    emiTypeButtons.forEach(button => {
        if (button.dataset.type === selectedType) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    emiTypeInput.value = selectedType;
    updateEMIFieldVisibility();
};

// Add event listeners for EMI type buttons
emiTypeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const selectedType = button.dataset.type;
        updateEMITypeButtons(selectedType);
        resetForm();
    });
});
