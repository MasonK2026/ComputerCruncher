# Inventory Management System

A robust, web-based inventory tracking application designed to simplify the management of ADPE (Automated Data Processing Equipment) assets. This application allows users to upload inventory data via Excel, visualize it in an interactive dashboard, and generate scan-ready QR code labels.

## ✨ Key Features

- **📊 Excel Integration**: Seamlessly upload and parse `.xlsx` inventory spreadsheets using SheetJS.
- **🔍 Interactive Dashboard**:
  - Advanced filtering, sorting, and searching capabilities.
  - Column visibility toggles to manage complex data sets.
  - Built with the powerful MUI Data Grid.
- **🏷️ Smart Label Printing**:
  - **Custom Layout**: specifically designed for **Avery 5167** return address labels (80 per sheet).
  - **Selective Printing**: Choose individual items or print the entire filtered list.
  - **Dynamic Scaling**: Text automatically sizes to fit the label without cutting off important details.
  - **QR Codes**: Generates asset tags on the fly.
- **📱 Responsive Design**: Modern UI built with Tailwind CSS and Material UI for a polished look on any screen.

## 🛠️ Technology Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Material UI (MUI)
- **Data Handling**: `sheetjs` (xlsx)
- **Component Library**: `@mui/x-data-grid` for tables, `lucide-react` for icons
- **Utilities**: `react-qr-code` for generation, `react-to-print` for print layout

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MasonK2026/ComputerCruncher
   cd dad-inventory-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

### 📦 Building for Production

To create a production-ready build:

```bash
npm run build
```

To deploy to GitHub Pages (after configuring `vite.config.ts` base path):

```bash
npm run deploy
```

## 📝 Usage Guide

1. **Upload Data**: Click the "Upload Excel" button (or Reset) to load your `.xlsx` inventory file.
   - *Note: The app expects columns like "ASST ID", "MFR / MODEL", "SER #", etc.*
2. **Search & Filter**: Use the search bar at the top right or the column filters to find specific assets.
3. **Select Items**: Check the boxes next to the items you wish to print.
4. **Print**:
   - Click the **Printer Icon** on a specific row for a single label.
   - Click the main **"Print Selected"** button to generate a PDF sheet of labels for all selected items.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
