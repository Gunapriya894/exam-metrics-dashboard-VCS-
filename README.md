# Exam Booking Count

An Angular dashboard that displays student exam booking statistics by date, location, and exam mode. It visualizes completed, disconnected, and not-attended exam counts, previews upcoming scheduled bookings, and shows system stability metrics.

This dashboard is designed to be embedded as a linked page within a larger existing dashboard.

## Tech Stack

- **Framework:** Angular 16.1
- **Language:** TypeScript 5.1.3
- **Charts:** Chart.js 4.x
- **Chart Plugins:**
  - `chartjs-plugin-zoom` - zoom and pan on the line graph
  - `chartjs-plugin-annotation` - threshold lines on the chart
- **Styling:** SCSS

## Features

### 1. Search Filters
- **Start Date / End Date** pickers (restricted to today or earlier for manual selection)
- **Location** multi-select dropdown with "All Locations" option
- **Exam Mode** multi-select dropdown with "All Exam Modes" option (IOL, IC-Remote, IC-F2F, IC-Offline)
- Compact filter card layout

### 2. Booking Count Results
After selecting filters and clicking **Get Count**, the dashboard shows:
- Total student bookings for the selected range
- Status breakdown:
  - Test Completed
  - Disconnected
  - Not Attended

### 3. Future Booking Preview (Date Presets)
- Quick-select preset buttons: **Tomorrow**, **Next 7 Days**, **Next Month**
- When a future range is selected, the dashboard shows the **Incomplete Test (Scheduled)** count instead of past statuses
- Manual date selection is restricted to today or earlier; future dates are only reachable via presets

### 4. Line Graph Visualization
- Interactive line chart grouped by date
- Smooth curves with filled area and data points
- **Zoom & Pan:** scroll to zoom, drag to select a range, with a **Reset Zoom** button
- **Threshold lines** (dashed) that appear only when values exceed the limit:
  - Completed > 50
  - Disconnected > 5
  - Not Attended > 10
  - Incomplete (future) > 50
- **Point color change:** data points that cross a threshold turn a darker shade and grow larger
- **Alert card:** a warning banner above the chart listing how many dates exceeded each threshold

### 5. System Stability Metrics
Displays 6 fixed stability indicators as cards:

| Indicator | Threshold | Meaning |
|-----------|-----------|---------|
| Reconnection Rate | ≤ 7% | Measures candidates requiring reconnection |
| Incomplete Recordings (<12 min) | ≤ 0.25% | Measures truncated or incomplete recording risk |
| Missing Audio (Outstanding) | ≤ 5% | Measures unresolved audio availability risk |
| Incident Rate per TT | ≤ 12% | Measures overall candidate-impacting incident rate |
| Webhook Delay Rate | ≤ 2% | Measures delayed event delivery risk |
| First-Attempt Success | ≥ 90% | Measures candidates completing without reconnection |

Each card shows:
- A **green up arrow (▲)** if the metric passes its threshold
- A **red down arrow (▼)** if the metric fails
- The current value, the threshold, and a short description

> The indicator names, thresholds, and descriptions are fixed in the frontend. Only the **current values** are intended to come from the database in the future.

## Project Structure

```
src/app/
├── app.component.ts      # Component logic: data, filtering, chart rendering, metrics
├── app.component.html    # Template: filters, results, line graph, stability metrics
├── app.component.scss    # Styles for all sections
└── app.module.ts         # Root module (imports FormsModule)
```

## Data Source

Currently all data is **hardcoded** in `app.component.ts`:
- `bookingData` - sample past and future exam booking records
- `stabilityMetrics` - the 6 stability indicator definitions and current values

### Planned Backend Integration

The exam booking data will later be fetched from a PostgreSQL (RDS) database through an AWS Lambda + API Gateway backend, proxied via the BFF layer.

**Where to change for backend integration:**
- Replace the hardcoded `bookingData` array with an HTTP call (via a new Angular service)
- Update only the `value` field of each item in the `stabilityMetrics` array from the API; names, thresholds, and descriptions stay fixed in the frontend

## Getting Started

### Install dependencies
```
npm install
```

### Run the development server
```
ng serve
```
Then open `http://localhost:4200/` in your browser. The app reloads automatically on file changes.

### Build for production
```
ng build
```
Build artifacts are stored in the `dist/` directory.

### Run unit tests
```
ng test
```

## Notes

- The component style budget in `angular.json` was increased to accommodate the SCSS size (6 KB warning / 10 KB error).
- The chart renders as a line graph. Earlier bar-graph code has been fully removed.
