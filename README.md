# 🏰 Clash Equipment Helper

A static website that displays equipment stats for different heroes in Clash of Clans. View detailed statistics for each equipment piece across all levels.

## Features

- **Hero Selection**: Choose from available heroes (Barbarian King, Archer Queen, etc.)
- **Equipment Selection**: Select from equipment available for the chosen hero
- **Level Progression**: View stats progression from level 1 to maximum level
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Modern UI**: Clean, modern interface with glassmorphism design

## How to Use

1. **Select a Hero**: Choose a hero from the first dropdown menu
2. **Select Equipment**: After selecting a hero, choose an equipment piece from the second dropdown
3. **View Stats**: The table will display all stats for each level of the selected equipment

## Stats Display

The table shows:
- **Level**: Equipment level (highlighted in blue)
- **Equipment Stats**: Combat statistics (highlighted in green)
- **Upgrade Costs**: Ore costs for upgrades (highlighted in red)

## Running the Site

### Option 1: Simple HTTP Server (Recommended)
```bash
# Using Python (Python 3)
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js (if you have it installed)
npx serve .
```

Then open your browser and go to `http://localhost:8000`

### Option 2: Open Directly
For basic functionality, you can open `index.html` directly in your browser. However, some browsers may block loading JSON files for security reasons, so using an HTTP server is recommended.

## Files Structure

```
├── index.html              # Main HTML file
├── styles.css              # CSS styles
├── script.js               # JavaScript functionality
├── clash-helper.equipment.json  # Equipment data
└── README.md               # This file
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Data Source

The equipment data is loaded from `clash-helper.equipment.json` which contains comprehensive stats for all equipment pieces across different heroes and levels.

## Customization

You can easily customize the appearance by modifying `styles.css`. The color scheme uses CSS custom properties for easy theming.

## License

This project is open source and available under the MIT License. 