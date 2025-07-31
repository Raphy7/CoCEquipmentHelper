// Global variables
let equipmentData = [];
let heroes = new Set();
let heroEquipment = new Map();
let selectedRow = null; // Track currently selected row
let isHidingLowerLevels = false; // Track if lower levels are hidden
let currentTableData = []; // Store current table data for cost calculations
let tooltipTimeout = null; // Timeout for hiding tooltip
let currentHoveredLevel = null; // Track currently hovered level

// DOM elements
const heroSelect = document.getElementById('heroSelect');
const equipmentSelect = document.getElementById('equipmentSelect');
const loading = document.getElementById('loading');
const noData = document.getElementById('noData');
const statsContainer = document.getElementById('statsContainer');
const statsTitle = document.getElementById('statsTitle');
const tableHead = document.getElementById('tableHead');
const tableBody = document.getElementById('tableBody');
const hideRowsBtn = document.getElementById('hideRowsBtn');
const costTooltip = document.getElementById('costTooltip');
const tooltipContent = document.getElementById('tooltipContent');
const tooltipCloseBtn = document.getElementById('tooltipCloseBtn');

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
        resetTableState();
        showNoData();
    });

    equipmentSelect.addEventListener('change', (e) => {
        const selectedHero = heroSelect.value;
        const selectedEquipment = e.target.value;
        
        if (selectedHero && selectedEquipment) {
            resetTableState();
            displayStats(selectedHero, selectedEquipment);
        } else {
            showNoData();
        }
    });

    // Add event listener for hide rows button
    hideRowsBtn.addEventListener('click', toggleHideLowerLevels);
    
    // Add event listener for tooltip close button
    tooltipCloseBtn.addEventListener('click', hideCostTooltip);
    
    // Add touch event for mobile devices
    tooltipCloseBtn.addEventListener('touchend', (e) => {
        e.preventDefault(); // Prevent double-firing on mobile
        hideCostTooltip();
    });
    
    // Prevent tooltip from hiding when hovering over the tooltip itself
    costTooltip.addEventListener('mouseenter', () => {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
    });
    
    costTooltip.addEventListener('mouseleave', () => {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
        }
        
        tooltipTimeout = setTimeout(() => {
            currentHoveredLevel = null;
            hideCostTooltip();
        }, 150);
    });
}

// Reset table state when changing hero/equipment
function resetTableState() {
    selectedRow = null;
    isHidingLowerLevels = false;
    currentHoveredLevel = null;
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
    
    // Clear any checked checkboxes
    const allCheckboxes = document.querySelectorAll('.level-checkbox');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    hideCostTooltip(); // Hide tooltip when resetting
    updateHideRowsButton();
}

// Toggle hiding lower level rows
function toggleHideLowerLevels() {
    if (!selectedRow) {
        return; // Should not happen as button is disabled when no row selected
    }

    isHidingLowerLevels = !isHidingLowerLevels;
    updateRowVisibility();
    updateHideRowsButton();
}

// Update visibility of rows based on selected level
function updateRowVisibility() {
    if (!selectedRow) {
        // Show all rows if no selection
        const allRows = tableBody.querySelectorAll('tr');
        allRows.forEach(row => {
            row.style.display = '';
        });
        return;
    }

    const selectedLevel = parseInt(selectedRow.dataset.level);
    const allRows = tableBody.querySelectorAll('tr');

    allRows.forEach(row => {
        const rowLevel = parseInt(row.dataset.level);
        
        if (isHidingLowerLevels && rowLevel < selectedLevel) {
            row.style.display = 'none';
        } else {
            row.style.display = '';
        }
    });
}

// Update hide rows button state and text
function updateHideRowsButton() {
    if (!selectedRow) {
        hideRowsBtn.disabled = true;
        hideRowsBtn.textContent = 'Hide Lower Levels';
        hideRowsBtn.classList.remove('active');
    } else {
        hideRowsBtn.disabled = false;
        if (isHidingLowerLevels) {
            hideRowsBtn.textContent = 'Show All Levels';
            hideRowsBtn.classList.add('active');
        } else {
            hideRowsBtn.textContent = `Hide Levels < ${selectedRow.dataset.level}`;
            hideRowsBtn.classList.remove('active');
        }
    }
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
    currentTableData = data; // Store data for cost calculations
    
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
    
    // Current level checkbox column
    const currentLevelHeader = document.createElement('th');
    currentLevelHeader.textContent = 'Current';
    currentLevelHeader.className = 'current-level-header';
    headerRow.appendChild(currentLevelHeader);
    
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
    selectedRow = null; // Reset selection when creating new table
    isHidingLowerLevels = false; // Reset hiding state
    
    data.forEach((item, index) => {
        const row = document.createElement('tr');
        row.dataset.level = item.level; // Store level in data attribute
        row.dataset.index = index; // Store index for easy reference
        
        // Current level checkbox cell
        const checkboxCell = document.createElement('td');
        checkboxCell.className = 'checkbox-cell';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'level-checkbox';
        checkbox.dataset.level = item.level;
        checkbox.dataset.row = index;
        
        // Add change handler for checkbox
        checkbox.addEventListener('change', (e) => {
            handleCheckboxChange(e, row);
        });
        
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);
        
        // Level cell
        const levelCell = document.createElement('td');
        levelCell.textContent = item.level;
        levelCell.className = 'level-cell';
        
        // Add hover handlers to level cell
        addCellHoverHandlers(levelCell, item.level);
        
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
            
            // Add hover handlers to stat cells
            addCellHoverHandlers(td, item.level);
            
            row.appendChild(td);
        });
        
        tableBody.appendChild(row);
    });
    
    // Initialize button state
    updateHideRowsButton();
}

// Add hover handlers to individual cells (excludes checkbox cell)
function addCellHoverHandlers(cell, level) {
    cell.addEventListener('mouseenter', (e) => {
        handleRowMouseEnter(e, level);
    });
    
    cell.addEventListener('mouseleave', (e) => {
        handleRowMouseLeave(e);
    });
    
    cell.addEventListener('mousemove', (e) => {
        updateTooltipPosition(e);
    });
}

// Handle checkbox change events
function handleCheckboxChange(event, row) {
    const checkbox = event.target;
    
    if (checkbox.checked) {
        // Uncheck all other checkboxes (radio button behavior)
        const allCheckboxes = tableBody.querySelectorAll('.level-checkbox');
        allCheckboxes.forEach(cb => {
            if (cb !== checkbox) {
                cb.checked = false;
                // Remove selection from other rows
                const otherRow = cb.closest('tr');
                if (otherRow) {
                    otherRow.classList.remove('selected-row');
                }
            }
        });
        
        // Select the current row
        selectRow(row);
    } else {
        // Deselect the current row
        deselectRow(row);
    }
}

// Handle row selection (updated to work with checkboxes)
function selectRow(clickedRow) {
    // Remove selection from previously selected row
    if (selectedRow && selectedRow !== clickedRow) {
        selectedRow.classList.remove('selected-row');
    }
    
    // Select the new row
    selectedRow = clickedRow;
    selectedRow.classList.add('selected-row');
    
    // Update button state and apply current visibility rules
    updateHideRowsButton();
    updateRowVisibility();
}

// Handle row deselection
function deselectRow(row) {
    selectedRow = null;
    row.classList.remove('selected-row');
    isHidingLowerLevels = false; // Reset hiding state when deselecting
    updateRowVisibility();
    updateHideRowsButton();
}

// Handle mouse enter on row with improved stability
function handleRowMouseEnter(event, hoveredLevel) {
    // Clear any pending hide timeout
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
    
    // Don't show tooltip if it's for the same level we're already showing
    if (currentHoveredLevel === hoveredLevel && !costTooltip.classList.contains('hidden')) {
        return;
    }
    
    currentHoveredLevel = hoveredLevel;
    showCostTooltip(event, hoveredLevel);
}

// Handle mouse leave on row with improved stability
function handleRowMouseLeave(event) {
    // Only hide after a short delay to prevent flickering
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
    }
    
    tooltipTimeout = setTimeout(() => {
        currentHoveredLevel = null;
        hideCostTooltip();
    }, 150); // 150ms delay before hiding
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

// Show cost tooltip when hovering over a level
function showCostTooltip(event, hoveredLevel) {
    // Only show tooltip if:
    // 1. A level is currently selected
    // 2. The hovered level is higher than the selected level
    if (!selectedRow || hoveredLevel <= parseInt(selectedRow.dataset.level)) {
        hideCostTooltip();
        return;
    }
    
    const selectedLevel = parseInt(selectedRow.dataset.level);
    const cumulativeCosts = calculateCumulativeCosts(selectedLevel, hoveredLevel);
    
    if (Object.keys(cumulativeCosts).length === 0) {
        hideCostTooltip();
        return;
    }
    
    // Update tooltip header with specific upgrade path
    const tooltipTitle = costTooltip.querySelector('.tooltip-title');
    tooltipTitle.textContent = `Upgrade from lvl ${selectedLevel} → ${hoveredLevel}`;
    
    // Build tooltip content
    let tooltipHTML = '';
    let totalCostValue = 0;
    
    Object.entries(cumulativeCosts).forEach(([costType, totalCost]) => {
        tooltipHTML += `
            <div class="cost-item">
                <span class="cost-label">${formatStatName(costType)}:</span>
                <span class="cost-value">${formatStatValue(totalCost)}</span>
            </div>
        `;
        
        // Sum up numeric costs for total (assuming costs are numbers)
        if (typeof totalCost === 'number') {
            totalCostValue += totalCost;
        }
    });
    
    // Add total if there are multiple cost types
    const costTypes = Object.keys(cumulativeCosts);
    if (costTypes.length > 1) {
        tooltipHTML += `
            <div class="cost-item total-cost">
                <span class="cost-label">Total Cost:</span>
                <span class="cost-value">${formatStatValue(totalCostValue)}</span>
            </div>
        `;
    }
    
    tooltipContent.innerHTML = tooltipHTML;
    updateTooltipPosition(event);
    
    // Show tooltip immediately if not already visible
    if (costTooltip.classList.contains('hidden')) {
        costTooltip.classList.remove('hidden');
        // Small delay to ensure smooth animation
        requestAnimationFrame(() => {
            costTooltip.classList.add('visible');
        });
    }
}

// Calculate cumulative costs from current level to target level
function calculateCumulativeCosts(fromLevel, toLevel) {
    const costs = {};
    
    // Find all levels between fromLevel (exclusive) and toLevel (inclusive)
    const relevantLevels = currentTableData.filter(item => 
        item.level > fromLevel && item.level <= toLevel
    );
    
    relevantLevels.forEach(levelData => {
        Object.entries(levelData.stats).forEach(([key, value]) => {
            // Only include cost-related stats
            if (key.toLowerCase().includes('cost') && typeof value === 'number') {
                if (!costs[key]) {
                    costs[key] = 0;
                }
                costs[key] += value;
            }
        });
    });
    
    return costs;
}

// Update tooltip position to follow mouse
function updateTooltipPosition(event) {
    const tooltip = costTooltip;
    const rect = statsContainer.getBoundingClientRect();
    
    let x = event.clientX - rect.left + 15;
    let y = event.clientY - rect.top - 10;
    
    // Ensure tooltip doesn't go off screen
    const tooltipRect = tooltip.getBoundingClientRect();
    const containerRect = statsContainer.getBoundingClientRect();
    
    if (x + tooltipRect.width > containerRect.width) {
        x = event.clientX - rect.left - tooltipRect.width - 15;
    }
    
    if (y < 0) {
        y = event.clientY - rect.top + 25;
    }
    
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}

// Hide cost tooltip
function hideCostTooltip() {
    // Clear any pending timeout
    if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
    }
    
    costTooltip.classList.remove('visible');
    setTimeout(() => {
        if (!costTooltip.classList.contains('visible')) {
            costTooltip.classList.add('hidden');
        }
    }, 300);
} 