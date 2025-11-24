const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const fromFlag = document.getElementById('from-flag');
const toFlag = document.getElementById('to-flag');
const swapBtn = document.getElementById('swap-btn');
const conversionText = document.querySelector('.conversion-text');
const conversionResult = document.querySelector('.conversion-result');
const lastUpdated = document.getElementById('last-updated');

const API_URL = 'https://api.frankfurter.app';

// Default currencies
let from = 'USD';
let to = 'IDR';

// Initialize
async function init() {
    await loadCurrencies();
    // Set defaults
    fromCurrency.value = from;
    toCurrency.value = to;
    updateFlags();
    convertCurrency();
}

// Load Currencies
async function loadCurrencies() {
    try {
        const res = await fetch(`${API_URL}/currencies`);
        const data = await res.json();
        const currencies = Object.keys(data);

        // Populate selects
        const options = currencies.map(curr => `<option value="${curr}">${curr}</option>`).join('');

        fromCurrency.innerHTML = options;
        toCurrency.innerHTML = options;
    } catch (error) {
        console.error('Error loading currencies:', error);
        alert('Failed to load currencies. Please check your internet connection.');
    }
}

// Update Flags
function updateFlags() {
    const fromCode = fromCurrency.value.slice(0, 2).toLowerCase();
    const toCode = toCurrency.value.slice(0, 2).toLowerCase();

    fromFlag.src = `https://flagcdn.com/w40/${fromCode}.png`;
    toFlag.src = `https://flagcdn.com/w40/${toCode}.png`;
}

// Convert
async function convertCurrency() {
    const amount = amountInput.value;
    from = fromCurrency.value;
    to = toCurrency.value;

    if (amount === '' || amount <= 0) {
        conversionResult.innerText = '0';
        return;
    }

    if (from === to) {
        conversionResult.innerText = `${amount} ${to}`;
        conversionText.innerText = `1 ${from} = 1 ${to}`;
        return;
    }

    conversionResult.innerText = 'Loading...';

    try {
        const res = await fetch(`${API_URL}/latest?amount=${amount}&from=${from}&to=${to}`);
        const data = await res.json();
        const rate = data.rates[to];

        // Format numbers
        const formattedRate = new Intl.NumberFormat('en-US', { style: 'currency', currency: to }).format(rate);
        const singleRate = (rate / amount).toFixed(4);

        conversionResult.innerText = formattedRate;
        conversionText.innerText = `1 ${from} = ${singleRate} ${to}`;

        const date = new Date(data.date).toLocaleDateString();
        lastUpdated.innerText = `Last updated: ${date}`;

    } catch (error) {
        console.error('Error converting:', error);
        conversionResult.innerText = 'Error';
    }
}

// Event Listeners
fromCurrency.addEventListener('change', () => {
    updateFlags();
    convertCurrency();
});

toCurrency.addEventListener('change', () => {
    updateFlags();
    convertCurrency();
});

amountInput.addEventListener('input', debounce(convertCurrency, 500));

swapBtn.addEventListener('click', () => {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    updateFlags();
    convertCurrency();
});

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

init();
