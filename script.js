// Global variables
let equipmentData = [];
let heroes = new Set();
let heroEquipment = new Map();

// DOM elements
const heroSelect = document.getElementById('heroSelect');
const equipmentSelect = document.getElementById('equipmentSelect');
const loading = document.getElementById('loading');
const noData = document.getElementById('noData');
const statsContainer = document.getElementById('statsContainer');
const statsTitle = document.getElementById('statsTitle');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    showLoading();
    try {
        await loadData();
        populateHeroDropdown();
        setupEventListeners();
        showNoData();
    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load equipment data. Please refresh the page.');
    }
});

// Load data from JSON file
async function loadData() {
    try {
        const response = await fetch('clash-helper.equipment.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        equipmentData = await response.json();
        processData();
    } catch (error) {
        throw new Error('Failed to load equipment data');
    }
}

// Process the loaded data to extract heroes and their equipment
function processData() {
    heroes.clear();
    heroEquipment.clear();

    equipmentData.forEach(item => {
        heroes.add(item.hero);
        
        if (!heroEquipment.has(item.hero)) {
            heroEquipment.set(item.hero, new Set());
        }
        heroEquipment.get(item.hero).add(item.equipment);
    });
}

// Populate hero dropdown
function populateHeroDropdown() {
    heroSelect.innerHTML = '<option value="">-- Choose a Hero --</option>';
    
    Array.from(heroes).sort().forEach(hero => {
        const option = document.createElement('option');
        option.value = hero;
        option.textContent = hero;
        heroSelect.appendChild(option);
    });
}

// Populate equipment dropdown for selected hero
function populateEquipmentDropdown(selectedHero) {
    equipmentSelect.innerHTML = '<option value="">-- Choose Equipment --</option>';
    
    if (!selectedHero) {
        equipmentSelect.disabled = true;
        return;
    }

    const equipment = heroEquipment.get(selectedHero);
    if (equipment) {
        Array.from(equipment).sort().forEach(eq => {
            const option = document.createElement('option');
            option.value = eq;
            option.textContent = eq;
            equipmentSelect.appendChild(option);
        });
        equipmentSelect.disabled = false;
    }
}

// Setup event listeners
function setupEventListeners() {
    heroSelect.addEventListener('change', (e) => {
        const selectedHero = e.target.value;
        populateEquipmentDropdown(selectedHero);
        equipmentSelect.value = '';
        showNoData();
    });

    equipmentSelect.addEventListener('change', (e) => {
        const selectedHero = heroSelect.value;
        const selectedEquipment = e.target.value;
        
        if (selectedHero && selectedEquipment) {
            displayStats(selectedHero, selectedEquipment);
        } else {
            showNoData();
        }
    });
}

// Display stats table for selected hero and equipment
function displayStats(hero, equipment) {
    const filteredData = equipmentData.filter(item => 
        item.hero === hero && item.equipment === equipment
    ).sort((a, b) => a.level - b.level);

    if (filteredData.length === 0) {
        showNoData();
        return;
    }

    createStatsTable(filteredData, hero, equipment);
    showStats();
}

// Create and populate the stats table
function createStatsTable(data, hero, equipment) {
    statsTitle.textContent = `${equipment} - ${hero}`;
    
    // Get all unique stat keys (excluding _id, hero, equipment, level)
    const statKeys = new Set();
    data.forEach(item => {
        Object.keys(item.stats).forEach(key => {
            if (key !== equipment) { // Exclude the equipment name key
                statKeys.add(key);
            }
        });
    });

    const sortedStatKeys = Array.from(statKeys).sort((a, b) => {
        // Put cost items at the end
        const aCost = a.toLowerCase().includes('cost');
        const bCost = b.toLowerCase().includes('cost');
        if (aCost && !bCost) return 1;
        if (!aCost && bCost) return -1;
        return a.localeCompare(b);
    });

    // Create table header
    tableHead.innerHTML = '';
    const headerRow = document.createElement('tr');
    
    // Level column
    const levelHeader = document.createElement('th');
    levelHeader.textContent = 'Level';
    headerRow.appendChild(levelHeader);
    
    // Stat columns
    sortedStatKeys.forEach(key => {
        const th = document.createElement('th');
        th.textContent = formatStatName(key);
        headerRow.appendChild(th);
    });
    
    tableHead.appendChild(headerRow);

    // Create table body
    tableBody.innerHTML = '';
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Level cell
        const levelCell = document.createElement('td');
        levelCell.textContent = item.level;
        levelCell.className = 'level-cell';
        row.appendChild(levelCell);
        
        // Stat cells
        sortedStatKeys.forEach(key => {
            const td = document.createElement('td');
            const value = item.stats[key];
            td.textContent = formatStatValue(value);
            
            if (key.toLowerCase().includes('cost')) {
                td.className = 'cost-cell';
            } else {
                td.className = 'stat-cell';
            }
            
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });
}

// Format stat names for display
function formatStatName(name) {
    return name
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
}

// Format stat values for display
function formatStatValue(value) {
    if (value === null || value === undefined) {
        return '-';
    }
    
    // If it's a number, format it nicely
    if (typeof value === 'number') {
        // For percentages or decimals
        if (value < 1 && value > 0) {
            return value.toFixed(2);
        }
        // For integers
        if (Number.isInteger(value)) {
            return value.toLocaleString();
        }
        // For other decimals
        return value.toFixed(1);
    }
    
    return value.toString();
}

// Show loading state
function showLoading() {
    hideAll();
    loading.classList.remove('hidden');
}

// Show no data state
function showNoData() {
    hideAll();
    noData.classList.remove('hidden');
}

// Show stats table
function showStats() {
    hideAll();
    statsContainer.classList.remove('hidden');
}

// Show error message
function showError(message) {
    hideAll();
    noData.innerHTML = `<p style="color: #e74c3c;">${message}</p>`;
    noData.classList.remove('hidden');
}

// Hide all content sections
function hideAll() {
    loading.classList.add('hidden');
    noData.classList.add('hidden');
    statsContainer.classList.add('hidden');
} 