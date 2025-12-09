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
    let totalProcessingFees = processingFees * (1 + GST_RATE)
    let totalInterest = 0;
    let totalGSTOnInterest = 0;

    for (let month = 1; month <= loanTenure; month++) {
        const monthlyInterest = remainingBalance * (interestRate / 12 / 100);
        const gstOnInterest = monthlyInterest * GST_RATE;
        const principalRepaid = emiAmount - monthlyInterest;
        
        totalInterest += monthlyInterest;
        totalGSTOnInterest += gstOnInterest;
        
        let processingFeesDisplay = 0;
        let gstOnInterestDisplay = gstOnInterest;
        if (month === 1) {
            processingFeesDisplay = totalProcessingFees; // Show processing fees + GST for the first month
        }

        processingFeesDisplay += gstOnInterest;
        
        const monthlyBreakdown = {
            month,
            principalRepaid,
            interest: monthlyInterest,
            gstOnInterest: gstOnInterestDisplay,
            processingFees: processingFeesDisplay,
            totalMonthlyPayment: Number(emiAmount) +processingFeesDisplay,
            remainingBalance: Math.max(0, remainingBalance - principalRepaid)
        };
        
        breakdown.push(monthlyBreakdown);
        remainingBalance = monthlyBreakdown.remainingBalance;
    }

    const totalHiddenCost = totalProcessingFees + totalGSTOnInterest;
    const hiddenCostPercentage = (totalHiddenCost / totalAmount) * 100;

    return {
        breakdown,
        totalHiddenCost,
        hiddenCostPercentage,
        totalInterest
    };
}

// Calculate EMI amount based on loan details
function calculateEMIAmount(principal, interestRate, loanTenure) {
    // Check for invalid inputs
    if (isNaN(principal) || isNaN(interestRate) || isNaN(loanTenure) || principal <= 0 || loanTenure <= 0) {
        throw new Error('Invalid input values for EMI calculation.');
    }

    // Monthly interest rate
    const monthlyRate = interestRate / 12 / 100;

    // Formula for EMI calculation: P × r × (1 + r)^n / ((1 + r)^n - 1)
    if (interestRate === 0) {
        return principal / loanTenure;
    } else {
        const term = Math.pow(1 + monthlyRate, loanTenure);
        return principal * monthlyRate * term / (term - 1);
    }
}

function updateEMIFieldVisibility() {
    const emiType = document.getElementById('emiType')?.value || 'regular';
    const emiAmountGroup = document.getElementById('emiAmountGroup');
    const emiAmountInput = document.getElementById('emiAmount');
    
    if (!emiAmountGroup || !emiAmountInput) return;

    // Always hide the EMI amount group initially
    emiAmountGroup.style.display = 'none'; 
    emiAmountInput.value = ''; // Reset the EMI amount field
    emiAmountInput.required = false;
    emiAmountInput.disabled = true;

    calculateNoCostEMI(); // Calculate for no-cost EMI    
    updateEMIDisplay(); // Update the EMI display
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

function calculateRegularEMI() {
    const totalAmount = document.getElementById('totalAmount');
    const loanTenure = document.getElementById('loanTenure');
    const interestRate = document.getElementById('interestRate');
    const emiAmount = document.getElementById('emiAmount');
    
    if (!totalAmount || !loanTenure || !interestRate || !emiAmount) return;
    
    const amount = parseFloat(totalAmount.value);
    const tenure = parseFloat(loanTenure.value);
    const rate = parseFloat(interestRate.value);
    
    if (!isNaN(amount) && !isNaN(tenure) && !isNaN(rate) && tenure > 0) {
        try {
            emiAmount.value = calculateEMIAmount(amount, rate, tenure).toFixed(2);
        } catch (error) {
            console.error('Error calculating EMI:', error.message);
        }
    }
}

function updateEMIDisplay() {
    const emiAmount = document.getElementById('emiAmount');
    const totalAmount = document.getElementById('totalAmount');
    const loanTenure = document.getElementById('loanTenure');
    const interestRate = document.getElementById('interestRate');
    const emiType = document.getElementById('emiType')?.value || 'regular';
    let emiDisplayElement = document.getElementById('emiDisplayContainer');
    
    // Create EMI display element if it doesn't exist
    if (!emiDisplayElement) {
        emiDisplayElement = document.createElement('div');
        emiDisplayElement.id = 'emiDisplayContainer';
        emiDisplayElement.className = 'emi-display-container';
        
        // Find where to insert the display
        const formGroups = document.querySelectorAll('.form-group');
        if (formGroups.length > 0) {
            const interestRateGroup = document.querySelector('.form-group:nth-child(4)');
            if (interestRateGroup) {
                interestRateGroup.parentNode.insertBefore(emiDisplayElement, interestRateGroup.nextSibling);
            }
        }
    }
    
    // Check if we have all required values
    const hasRequiredNoCostValues = emiType === 'no-cost' && 
        totalAmount && !isNaN(parseFloat(totalAmount.value)) && 
        loanTenure && !isNaN(parseFloat(loanTenure.value)) && 
        parseFloat(loanTenure.value) > 0;
        
    const hasRequiredRegularValues = emiType === 'regular' && 
        totalAmount && !isNaN(parseFloat(totalAmount.value)) && 
        loanTenure && !isNaN(parseFloat(loanTenure.value)) && 
        interestRate && !isNaN(parseFloat(interestRate.value)) && 
        parseFloat(loanTenure.value) > 0;
    
    // Update display
    if ((hasRequiredNoCostValues || hasRequiredRegularValues) && emiAmount && emiAmount.value) {
        emiDisplayElement.innerHTML = `
            <div class="emi-display">
                <span>Monthly EMI Amount (₹) : </span>
                <span class="emi-amount">${formatCurrency(parseFloat(emiAmount.value))}</span>
            </div>
        `;
        emiDisplayElement.style.display = 'block';
    } else {
        emiDisplayElement.style.display = 'none';
    }
}

function handleInputChange() {
    const emiType = document.getElementById('emiType');
    if (emiType && emiType.value === 'no-cost') {
        calculateNoCostEMI();
    } else if (emiType && emiType.value === 'regular') {
        calculateRegularEMI();
    }
    updateEMIDisplay();
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
    
    const totalAmount = document.getElementById('totalAmount');
    const loanTenure = document.getElementById('loanTenure');
    const emiAmount = document.getElementById('emiAmount');
    const interestRate = document.getElementById('interestRate');
    const processingFees = document.getElementById('processingFees');
    const amount = parseFloat(totalAmount.value);
    const processingFeesValue = parseFloat(processingFees.value);

    try {
        const result = calculateEMIBreakdown(amount, loanTenure.value, emiAmount.value, interestRate.value, processingFeesValue);
        updateResults(result, amount);
    } catch (error) {
        console.error('Error calculating EMI breakdown:', error.message);
    }
    
    // Scroll to the results section with an offset
    const resultsDiv = document.getElementById('results');
    if (resultsDiv) {
        const offsetPosition = resultsDiv.getBoundingClientRect().top + window.scrollY - 100; // 100px offset
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
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

function updateResults(result, totalAmount) {
    const resultsDiv = document.getElementById('results');
    const tableBody = document.getElementById('emiTableBody');
    const summaryTotalInterest = document.getElementById('summary-total-interest');
    
    if (!resultsDiv || !tableBody) return;
    
    tableBody.innerHTML = '';
    result.breakdown.forEach(month => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${month.month}</td>
            <td>${formatCurrency(month.remainingBalance)}</td>
            <td>${formatCurrency(month.principalRepaid)}</td>
            <td>${formatCurrency(month.interest)}</td>
            <td>${formatCurrency(month.gstOnInterest)}</td>
            <td>${formatCurrency(month.processingFees)}</td>
            <td>${formatCurrency(month.totalMonthlyPayment)}</td>
        `;
        tableBody.appendChild(row);
    });
    
    const summaryTotal = document.getElementById('summary-total');
    const summaryHiddenCost = document.getElementById('summary-hidden-cost');
    const summaryTotalPayable = document.getElementById('summary-total-payable');
    const summaryHiddenPercentage = document.getElementById('summary-hidden-percentage');
    const emiType = document.getElementById('emiType')?.value || 'regular';
    
    if (summaryTotal) {
        summaryTotal.textContent = formatCurrency(totalAmount);
    }
    if (emiType === 'regular') {
        summaryTotalInterest.parentElement.style.display = 'flex'; // Show the Total Interest field
        summaryTotalInterest.textContent = formatCurrency(result.totalInterest);
    } else {
        summaryTotalInterest.parentElement.style.display = 'none'; // Hide the entire Total Interest field
    }
    if (emiType === 'regular') {
        if (summaryTotalPayable) {
            summaryTotalPayable.textContent = formatCurrency(totalAmount + result.totalHiddenCost + result.totalInterest);
        }
    } else {
        if (summaryTotalPayable) {
            summaryTotalPayable.textContent = formatCurrency(totalAmount + result.totalHiddenCost);
        }
    }
    if (summaryHiddenCost) {
        summaryHiddenCost.textContent = formatCurrency(result.totalHiddenCost);
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
    
    // Add listeners for interest rate and processing fees
    const interestRateInput = document.getElementById('interestRate');
    const processingFeesInput = document.getElementById('processingFees');
    
    if (interestRateInput) {
        interestRateInput.addEventListener('input', handleInputChange);
    }
    
    if (processingFeesInput) {
        processingFeesInput.addEventListener('input', handleInputChange);
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
        calculateRegularEMI,
        updateEMIDisplay,
        handleInputChange,
        updateEMITypeButtons,
        handleFormSubmit,
        handleRecalculate,
        calculateEMIAmount,
        GST_RATE
    };
}
