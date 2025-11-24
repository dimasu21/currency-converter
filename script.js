const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('from-currency');
const toCurrency = document.getElementById('to-currency');
const fromFlag = document.getElementById('from-flag');
const toFlag = document.getElementById('to-flag');
const swapBtn = document.getElementById('swap-btn');
const conversionText = document.querySelector('.conversion-text');
const conversionResult = document.querySelector('.conversion-result');
const lastUpdated = document.getElementById('last-updated');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');

const API_URL = 'https://api.frankfurter.app';

// Theme Logic
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
    themeIcon.classList.replace('fa-sun', 'fa-moon');
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');

    if (isLight) {
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
});

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

// Chart Logic
let rateChart = null;

async function updateChart(fromCurrency, toCurrency) {
    const ctx = document.getElementById('rateChart').getContext('2d');

    // Get dates
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];

    try {
        const res = await fetch(`${API_URL}/${startDateStr}..${endDate}?from=${fromCurrency}&to=${toCurrency}`);
        const data = await res.json();

        if (!data.rates) return;

        const labels = Object.keys(data.rates);
        const rates = labels.map(date => data.rates[date][toCurrency]);

        const isLight = document.body.classList.contains('light-theme');
        const gridColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';
        const textColor = isLight ? '#6B7280' : '#8A8F98';

        if (rateChart) {
            rateChart.destroy();
        }

        rateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${fromCurrency} to ${toCurrency}`,
                    data: rates,
                    borderColor: '#5E6AD2',
                    backgroundColor: 'rgba(94, 106, 210, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: textColor,
                            maxTicksLimit: 6
                        }
                    },
                    y: {
                        grid: {
                            color: gridColor
                        },
                        ticks: {
                            color: textColor
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

    } catch (error) {
        console.error('Error fetching chart data:', error);
    }
}

// Multi-Currency Logic
const addCurrencyBtn = document.getElementById('add-currency-btn');
const extraCurrenciesContainer = document.getElementById('extra-currencies');
let extraCurrencies = [];

addCurrencyBtn.addEventListener('click', () => {
    addCurrencyRow('EUR');
});

function addCurrencyRow(defaultCurrency) {
    const id = Date.now();
    const div = document.createElement('div');
    div.className = 'extra-currency-row';
    div.id = `row-${id}`;

    div.innerHTML = `
        <div class="select-wrapper" style="flex: 1;">
            <img src="https://flagcdn.com/w40/${defaultCurrency.slice(0, 2).toLowerCase()}.png" class="currency-flag" id="flag-${id}">
            <select id="select-${id}" onchange="updateRowFlag('${id}')">
                ${fromCurrency.innerHTML}
            </select>
            <i class="fa-solid fa-chevron-down"></i>
        </div>
        <div class="conversion-result" style="font-size: 1.2rem; margin: 0;" id="result-${id}">0.00</div>
        <button type="button" class="remove-btn" onclick="removeRow('${id}')">
            <i class="fa-solid fa-trash"></i>
        </button>
    `;

    extraCurrenciesContainer.appendChild(div);

    // Set default value
    const select = document.getElementById(`select-${id}`);
    select.value = defaultCurrency;

    extraCurrencies.push(id);
    convertCurrency();
}

window.removeRow = (id) => {
    const row = document.getElementById(`row-${id}`);
    row.remove();
    extraCurrencies = extraCurrencies.filter(currId => currId !== id);
};

window.updateRowFlag = (id) => {
    const select = document.getElementById(`select-${id}`);
    const flag = document.getElementById(`flag-${id}`);
    const code = select.value.slice(0, 2).toLowerCase();
    flag.src = `https://flagcdn.com/w40/${code}.png`;
    convertCurrency();
};

async function updateExtraCurrencies(amount, from) {
    if (extraCurrencies.length === 0) return;

    const targets = extraCurrencies.map(id => document.getElementById(`select-${id}`).value).join(',');

    try {
        const res = await fetch(`${API_URL}/latest?amount=${amount}&from=${from}&to=${targets}`);
        const data = await res.json();

        extraCurrencies.forEach(id => {
            const target = document.getElementById(`select-${id}`).value;
            const resultEl = document.getElementById(`result-${id}`);

            // Handle single target vs multiple targets API response structure difference if needed
            // Frankfurter returns rates object. If amount is 1, rates are unit rates.
            // If amount > 1, rates are total converted values.

            let val = 0;
            if (data.rates[target]) {
                val = data.rates[target];
            }

            resultEl.innerText = new Intl.NumberFormat('en-US', { style: 'currency', currency: target }).format(val);
        });
    } catch (error) {
        console.error('Error updating extra currencies:', error);
    }
}

// Update convertCurrency to call updateExtraCurrencies
async function convertCurrency() {
    const amount = amountInput.value;
    from = fromCurrency.value;
    to = toCurrency.value;

    // Update chart if currencies changed
    updateChart(from, to);

    // Update extra currencies
    if (amount > 0) {
        updateExtraCurrencies(amount, from);
    }

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
