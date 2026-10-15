import { Component, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables, zoomPlugin, annotationPlugin);

interface BookingRecord {
  date: string;
  location: string;
  examMode: string;
  completedCount: number;
  disconnectedCount: number;
  notAttendedCount: number;
  incompleteCount: number;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements AfterViewInit {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;

  startDate: string = '';
  endDate: string = '';
  selectedLocations: string[] = [];
  selectedExamModes: string[] = [];
  totalCount: number | null = null;
  completedTotal: number | null = null;
  disconnectedTotal: number | null = null;
  notAttendedTotal: number | null = null;
  incompleteTotal: number | null = null;
  showResult: boolean = false;
  isFutureRange: boolean = false;
  chart: Chart | null = null;

  // Threshold alert data
  thresholdAlerts: { label: string; count: number; color: string }[] = [];

  // Stability Metrics Data
  stabilityMetrics: { name: string; value: number; threshold: number; unit: string; direction: string; description: string }[] = [
    { name: 'Reconnection Rate', value: 5.42, threshold: 7, unit: '%', direction: 'lte', description: 'Measures candidates requiring reconnection' },
    { name: 'Incomplete Recordings (<12 min)', value: 0.28, threshold: 0.25, unit: '%', direction: 'lte', description: 'Measures truncated or incomplete recording risk' },
    { name: 'Missing Audio (Outstanding)', value: 3.7, threshold: 5, unit: '%', direction: 'lte', description: 'Measures unresolved audio availability risk' },
    { name: 'Incident Rate per TT', value: 10.0, threshold: 12, unit: '%', direction: 'lte', description: 'Measures overall candidate-impacting incident rate' },
    { name: 'Webhook Delay Rate', value: 0.69, threshold: 2, unit: '%', direction: 'lte', description: 'Measures delayed event delivery risk' },
    { name: 'First-Attempt Success', value: 94.58, threshold: 90, unit: '%', direction: 'gte', description: 'Measures candidates completing without reconnection' }
  ];

  isMetricPassing(metric: { value: number; threshold: number; direction: string }): boolean {
    return metric.direction === 'gte' ? metric.value >= metric.threshold : metric.value <= metric.threshold;
  }

  // Dropdown open state
  locationDropdownOpen: boolean = false;
  examModeDropdownOpen: boolean = false;

  // Today's date in YYYY-MM-DD format for max date validation
  today: string = new Date().toISOString().split('T')[0];

  // Date presets for future booking view
  datePresets: { label: string; value: string }[] = [
    { label: 'Tomorrow', value: 'tomorrow' },
    { label: 'Next 7 Days', value: 'next7days' },
    { label: 'Next Month', value: 'nextMonth' }
  ];

  locations: string[] = [
    'Chennai',
    'Bangalore',
    'Hyderabad',
    'Mumbai',
    'Delhi',
    'Kolkata',
    'Pune',
    'Coimbatore'
  ];

  examModes: string[] = [
    'IOL',
    'IC-Remote',
    'IC-F2F',
    'IC-Offline'
  ];

  // Sample data simulating exam booking records
  bookingData: BookingRecord[] = [
    { date: '2026-07-01', location: 'Chennai', examMode: 'IOL', completedCount: 135, disconnectedCount: 5, notAttendedCount: 15, incompleteCount: 0 },
    { date: '2026-07-02', location: 'Chennai', examMode: 'IC-Remote', completedCount: 25, disconnectedCount: 4, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-03', location: 'Chennai', examMode: 'IC-F2F', completedCount: 22, disconnectedCount: 3, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-04', location: 'Chennai', examMode: 'IC-Offline', completedCount: 10, disconnectedCount: 2, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-05', location: 'Bangalore', examMode: 'IOL', completedCount: 42, disconnectedCount: 7, notAttendedCount: 6, incompleteCount: 0 },
    { date: '2026-07-06', location: 'Bangalore', examMode: 'IC-Remote', completedCount: 30, disconnectedCount: 5, notAttendedCount: 5, incompleteCount: 0 },
    { date: '2026-07-07', location: 'Bangalore', examMode: 'IC-F2F', completedCount: 128, disconnectedCount: 4, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-08', location: 'Bangalore', examMode: 'IC-Offline', completedCount: 14, disconnectedCount: 3, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-09', location: 'Hyderabad', examMode: 'IOL', completedCount: 30, disconnectedCount: 4, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-10', location: 'Hyderabad', examMode: 'IC-Remote', completedCount: 18, disconnectedCount: 3, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-11', location: 'Hyderabad', examMode: 'IC-F2F', completedCount: 16, disconnectedCount: 3, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-12', location: 'Hyderabad', examMode: 'IC-Offline', completedCount: 120, disconnectedCount: 3, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-13', location: 'Mumbai', examMode: 'IOL', completedCount: 48, disconnectedCount: 6, notAttendedCount: 6, incompleteCount: 0 },
    { date: '2026-07-14', location: 'Mumbai', examMode: 'IC-Remote', completedCount: 34, disconnectedCount: 4, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-15', location: 'Mumbai', examMode: 'IC-F2F', completedCount: 23, disconnectedCount: 3, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-16', location: 'Mumbai', examMode: 'IC-Offline', completedCount: 18, disconnectedCount: 4, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-17', location: 'Delhi', examMode: 'IOL', completedCount: 38, disconnectedCount: 6, notAttendedCount: 6, incompleteCount: 0 },
    { date: '2026-07-18', location: 'Delhi', examMode: 'IC-Remote', completedCount: 28, disconnectedCount: 4, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-19', location: 'Delhi', examMode: 'IC-F2F', completedCount: 20, disconnectedCount: 3, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-20', location: 'Delhi', examMode: 'IC-Offline', completedCount: 13, disconnectedCount: 3, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-21', location: 'Kolkata', examMode: 'IOL', completedCount: 25, disconnectedCount: 4, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-22', location: 'Kolkata', examMode: 'IC-Remote', completedCount: 20, disconnectedCount: 4, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-23', location: 'Kolkata', examMode: 'IC-F2F', completedCount: 14, disconnectedCount: 3, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-24', location: 'Kolkata', examMode: 'IC-Offline', completedCount: 9, disconnectedCount: 2, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-25', location: 'Pune', examMode: 'IOL', completedCount: 33, disconnectedCount: 5, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-26', location: 'Pune', examMode: 'IC-Remote', completedCount: 22, disconnectedCount: 4, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-27', location: 'Pune', examMode: 'IC-F2F', completedCount: 18, disconnectedCount: 3, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-01', location: 'Pune', examMode: 'IC-Offline', completedCount: 11, disconnectedCount: 2, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-02', location: 'Coimbatore', examMode: 'IOL', completedCount: 22, disconnectedCount: 3, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-03', location: 'Coimbatore', examMode: 'IC-Remote', completedCount: 16, disconnectedCount: 3, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-04', location: 'Coimbatore', examMode: 'IC-F2F', completedCount: 13, disconnectedCount: 2, notAttendedCount: 3, incompleteCount: 0 },
    { date: '2026-07-05', location: 'Coimbatore', examMode: 'IC-Offline', completedCount: 8, disconnectedCount: 2, notAttendedCount: 2, incompleteCount: 0 },
    { date: '2026-07-10', location: 'Chennai', examMode: 'IOL', completedCount: 40, disconnectedCount: 6, notAttendedCount: 0, incompleteCount: 0 },
    { date: '2026-07-15', location: 'Chennai', examMode: 'IOL', completedCount: 38, disconnectedCount: 5, notAttendedCount: 1, incompleteCount: 0 },
    { date: '2026-07-20', location: 'Bangalore', examMode: 'IOL', completedCount: 45, disconnectedCount: 7, notAttendedCount: 6, incompleteCount: 0 },
    { date: '2026-07-25', location: 'Bangalore', examMode: 'IC-Remote', completedCount: 34, disconnectedCount: 5, notAttendedCount: 5, incompleteCount: 0 },
    { date: '2026-07-28', location: 'Chennai', examMode: 'IOL', completedCount: 42, disconnectedCount: 4, notAttendedCount: 5, incompleteCount: 0 },
    { date: '2026-07-29', location: 'Chennai', examMode: 'IC-Remote', completedCount: 30, disconnectedCount: 3, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-30', location: 'Chennai', examMode: 'IOL', completedCount: 37, disconnectedCount: 5, notAttendedCount: 4, incompleteCount: 0 },
    { date: '2026-07-28', location: 'Bangalore', examMode: 'IOL', completedCount: 50, disconnectedCount: 6, notAttendedCount: 5, incompleteCount: 0 },
    { date: '2026-07-30', location: 'Mumbai', examMode: 'IOL', completedCount: 44, disconnectedCount: 5, notAttendedCount: 6, incompleteCount: 0 },
    // Future booking data (scheduled exams - not yet taken)
    { date: '2026-08-06', location: 'Chennai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 40 },
    { date: '2026-08-06', location: 'Chennai', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 28 },
    { date: '2026-08-06', location: 'Bangalore', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 50 },
    { date: '2026-08-06', location: 'Bangalore', examMode: 'IC-F2F', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 30 },
    { date: '2026-08-06', location: 'Hyderabad', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 32 },
    { date: '2026-08-06', location: 'Mumbai', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 38 },
    { date: '2026-08-06', location: 'Delhi', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 35 },
    { date: '2026-08-06', location: 'Pune', examMode: 'IC-Offline', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 15 },
    { date: '2026-08-06', location: 'Kolkata', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 22 },
    { date: '2026-08-06', location: 'Coimbatore', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 18 },
    { date: '2026-08-07', location: 'Chennai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 38 },
    { date: '2026-08-07', location: 'Chennai', examMode: 'IC-F2F', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 20 },
    { date: '2026-08-07', location: 'Bangalore', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 35 },
    { date: '2026-08-07', location: 'Hyderabad', examMode: 'IC-F2F', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 18 },
    { date: '2026-08-07', location: 'Mumbai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 46 },
    { date: '2026-08-07', location: 'Kolkata', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 22 },
    { date: '2026-08-08', location: 'Chennai', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 26 },
    { date: '2026-08-08', location: 'Bangalore', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 48 },
    { date: '2026-08-08', location: 'Delhi', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 30 },
    { date: '2026-08-08', location: 'Pune', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 34 },
    { date: '2026-08-08', location: 'Coimbatore', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 20 },
    { date: '2026-08-09', location: 'Chennai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 42 },
    { date: '2026-08-09', location: 'Bangalore', examMode: 'IC-F2F', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 25 },
    { date: '2026-08-09', location: 'Mumbai', examMode: 'IC-Offline', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 16 },
    { date: '2026-08-10', location: 'Chennai', examMode: 'IC-Offline', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 12 },
    { date: '2026-08-10', location: 'Bangalore', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 44 },
    { date: '2026-08-10', location: 'Hyderabad', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 22 },
    { date: '2026-08-10', location: 'Delhi', examMode: 'IC-F2F', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 18 },
    { date: '2026-08-11', location: 'Chennai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 39 },
    { date: '2026-08-11', location: 'Mumbai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 50 },
    { date: '2026-08-11', location: 'Kolkata', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 24 },
    { date: '2026-08-12', location: 'Bangalore', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 52 },
    { date: '2026-08-12', location: 'Pune', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 26 },
    { date: '2026-08-12', location: 'Coimbatore', examMode: 'IC-F2F', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 14 },
    { date: '2026-08-20', location: 'Chennai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 45 },
    { date: '2026-08-20', location: 'Bangalore', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 32 },
    { date: '2026-08-20', location: 'Mumbai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 55 },
    { date: '2026-08-25', location: 'Chennai', examMode: 'IC-F2F', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 24 },
    { date: '2026-08-25', location: 'Delhi', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 40 },
    { date: '2026-08-25', location: 'Hyderabad', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 36 },
    { date: '2026-08-30', location: 'Chennai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 83 },
    { date: '2026-08-30', location: 'Bangalore', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 48 },
    { date: '2026-08-30', location: 'Mumbai', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 36 },
    { date: '2026-09-01', location: 'Chennai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 141 },
    { date: '2026-09-01', location: 'Bangalore', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 46 },
    { date: '2026-09-01', location: 'Mumbai', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 52 },
    { date: '2026-09-05', location: 'Delhi', examMode: 'IC-Remote', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 30 },
    { date: '2026-09-05', location: 'Pune', examMode: 'IOL', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 35 },
    { date: '2026-09-05', location: 'Coimbatore', examMode: 'IC-Offline', completedCount: 0, disconnectedCount: 0, notAttendedCount: 0, incompleteCount: 10 },
  ];

  ngAfterViewInit(): void {
    // Chart will be created when user clicks count
  }

  applyPreset(preset: string): void {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let start: Date;
    let end: Date;

    switch (preset) {
      case 'tomorrow':
        start = new Date(todayDate);
        start.setDate(start.getDate() + 1);
        end = new Date(start);
        break;
      case 'next7days':
        start = new Date(todayDate);
        start.setDate(start.getDate() + 1);
        end = new Date(todayDate);
        end.setDate(end.getDate() + 7);
        break;
      case 'nextMonth':
        start = new Date(todayDate);
        start.setDate(start.getDate() + 1);
        end = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, todayDate.getDate());
        break;
      default:
        return;
    }

    this.startDate = this.toDateString(start);
    this.endDate = this.toDateString(end);
    this.isFutureRange = true;
  }

  private toDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.multi-select-dropdown')) {
      this.closeDropdowns();
    }
  }

  // Multi-select dropdown helpers
  toggleLocationDropdown(): void {
    this.locationDropdownOpen = !this.locationDropdownOpen;
    this.examModeDropdownOpen = false;
  }

  toggleExamModeDropdown(): void {
    this.examModeDropdownOpen = !this.examModeDropdownOpen;
    this.locationDropdownOpen = false;
  }

  closeDropdowns(): void {
    this.locationDropdownOpen = false;
    this.examModeDropdownOpen = false;
  }

  isLocationSelected(loc: string): boolean {
    return this.selectedLocations.includes(loc);
  }

  isExamModeSelected(mode: string): boolean {
    return this.selectedExamModes.includes(mode);
  }

  toggleLocation(loc: string): void {
    const index = this.selectedLocations.indexOf(loc);
    if (index > -1) {
      this.selectedLocations.splice(index, 1);
    } else {
      this.selectedLocations.push(loc);
    }
  }

  toggleExamMode(mode: string): void {
    const index = this.selectedExamModes.indexOf(mode);
    if (index > -1) {
      this.selectedExamModes.splice(index, 1);
    } else {
      this.selectedExamModes.push(mode);
    }
  }

  toggleAllLocations(): void {
    if (this.selectedLocations.length === this.locations.length) {
      this.selectedLocations = [];
    } else {
      this.selectedLocations = [...this.locations];
    }
  }

  toggleAllExamModes(): void {
    if (this.selectedExamModes.length === this.examModes.length) {
      this.selectedExamModes = [];
    } else {
      this.selectedExamModes = [...this.examModes];
    }
  }

  get allLocationsSelected(): boolean {
    return this.selectedLocations.length === this.locations.length;
  }

  get allExamModesSelected(): boolean {
    return this.selectedExamModes.length === this.examModes.length;
  }

  get locationDisplayText(): string {
    if (this.selectedLocations.length === 0) return 'Select Location';
    if (this.selectedLocations.length === this.locations.length) return 'All Locations';
    if (this.selectedLocations.length <= 2) return this.selectedLocations.join(', ');
    return `${this.selectedLocations.length} Locations selected`;
  }

  get examModeDisplayText(): string {
    if (this.selectedExamModes.length === 0) return 'Select Exam Mode';
    if (this.selectedExamModes.length === this.examModes.length) return 'All Exam Modes';
    if (this.selectedExamModes.length <= 2) return this.selectedExamModes.join(', ');
    return `${this.selectedExamModes.length} Exam Modes selected`;
  }

  getCount(): void {
    if (!this.startDate || !this.endDate || this.selectedLocations.length === 0 || this.selectedExamModes.length === 0) {
      alert('Please fill all fields before getting the count.');
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (start > end) {
      alert('Start date cannot be after end date.');
      return;
    }

    // Determine if the date range is in the future
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    this.isFutureRange = start > todayDate;

    // Filter records based on selections
    const filteredRecords = this.bookingData.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= start &&
             recordDate <= end &&
             this.selectedLocations.includes(record.location) &&
             this.selectedExamModes.includes(record.examMode);
    });

    // Calculate totals based on whether it's a future or past range
    if (this.isFutureRange) {
      this.incompleteTotal = filteredRecords.reduce((sum, record) => sum + record.incompleteCount, 0);
      this.completedTotal = null;
      this.disconnectedTotal = null;
      this.notAttendedTotal = null;
      this.totalCount = this.incompleteTotal;
    } else {
      this.completedTotal = filteredRecords.reduce((sum, record) => sum + record.completedCount, 0);
      this.disconnectedTotal = filteredRecords.reduce((sum, record) => sum + record.disconnectedCount, 0);
      this.notAttendedTotal = filteredRecords.reduce((sum, record) => sum + record.notAttendedCount, 0);
      this.incompleteTotal = null;
      this.totalCount = this.completedTotal + this.disconnectedTotal + this.notAttendedTotal;
    }
    this.showResult = true;

    // Calculate threshold alerts
    this.thresholdAlerts = [];
    if (this.isFutureRange) {
      const dateIncompleteMap = new Map<string, number>();

      filteredRecords.forEach(record => {
        const existing = dateIncompleteMap.get(record.date) || 0;
        dateIncompleteMap.set(record.date, existing + record.incompleteCount);
      });

      const incompleteExceeded = Array.from(dateIncompleteMap.values()).filter(v => v > 50).length;
      if (incompleteExceeded > 0) {
        this.thresholdAlerts.push({ label: `Incomplete Test exceeded 50 on ${incompleteExceeded} date(s)`, count: incompleteExceeded, color: '#7c4dff' });
      }

      const sortedDates = Array.from(dateIncompleteMap.keys()).sort();
      const incompleteCounts = sortedDates.map(date => dateIncompleteMap.get(date) || 0);

      setTimeout(() => {
        this.renderFutureChart(sortedDates, incompleteCounts);
      });
    } else {
      const dateCompletedMap = new Map<string, number>();
      const dateDisconnectedMap = new Map<string, number>();
      const dateNotAttendedMap = new Map<string, number>();

      filteredRecords.forEach(record => {
        const existingCompleted = dateCompletedMap.get(record.date) || 0;
        dateCompletedMap.set(record.date, existingCompleted + record.completedCount);

        const existingDisconnected = dateDisconnectedMap.get(record.date) || 0;
        dateDisconnectedMap.set(record.date, existingDisconnected + record.disconnectedCount);

        const existingNotAttended = dateNotAttendedMap.get(record.date) || 0;
        dateNotAttendedMap.set(record.date, existingNotAttended + record.notAttendedCount);
      });

      const sortedDates = Array.from(dateCompletedMap.keys()).sort();
      const completedCounts = sortedDates.map(date => dateCompletedMap.get(date) || 0);
      const disconnectedCounts = sortedDates.map(date => dateDisconnectedMap.get(date) || 0);
      const notAttendedCounts = sortedDates.map(date => dateNotAttendedMap.get(date) || 0);

      const completedExceeded = completedCounts.filter(v => v > 50).length;
      const disconnectedExceeded = disconnectedCounts.filter(v => v > 5).length;
      const notAttendedExceeded = notAttendedCounts.filter(v => v > 10).length;

      if (completedExceeded > 0) {
        this.thresholdAlerts.push({ label: `Test Completed exceeded 50 on ${completedExceeded} date(s)`, count: completedExceeded, color: '#28a745' });
      }
      if (disconnectedExceeded > 0) {
        this.thresholdAlerts.push({ label: `Disconnected exceeded 5 on ${disconnectedExceeded} date(s)`, count: disconnectedExceeded, color: '#ff8c00' });
      }
      if (notAttendedExceeded > 0) {
        this.thresholdAlerts.push({ label: `Not Attended exceeded 10 on ${notAttendedExceeded} date(s)`, count: notAttendedExceeded, color: '#dc3545' });
      }

      setTimeout(() => {
        this.renderChart(sortedDates, completedCounts, disconnectedCounts, notAttendedCounts);
      });
    }
  }

  private renderChart(labels: string[], completedData: number[], disconnectedData: number[], notAttendedData: number[]): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const canvas = this.barChartRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.map(d => this.formatDate(d)),
        datasets: [
          {
            label: 'Test Completed',
            data: completedData,
            borderColor: 'rgba(40, 167, 69, 1)',
            backgroundColor: 'rgba(40, 167, 69, 0.15)',
            borderWidth: 2,
            pointBackgroundColor: completedData.map(v => v > 50 ? '#005500' : 'rgba(40, 167, 69, 1)'),
            pointBorderColor: completedData.map(v => v > 50 ? '#005500' : 'rgba(40, 167, 69, 1)'),
            pointRadius: completedData.map(v => v > 50 ? 8 : 5),
            pointHoverRadius: 9,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Disconnected',
            data: disconnectedData,
            borderColor: 'rgba(255, 165, 0, 1)',
            backgroundColor: 'rgba(255, 165, 0, 0.15)',
            borderWidth: 2,
            pointBackgroundColor: disconnectedData.map(v => v > 5 ? '#cc5500' : 'rgba(255, 165, 0, 1)'),
            pointBorderColor: disconnectedData.map(v => v > 5 ? '#cc5500' : 'rgba(255, 165, 0, 1)'),
            pointRadius: disconnectedData.map(v => v > 5 ? 8 : 5),
            pointHoverRadius: 9,
            tension: 0.3,
            fill: true
          },
          {
            label: 'Not Attended',
            data: notAttendedData,
            borderColor: 'rgba(220, 53, 69, 1)',
            backgroundColor: 'rgba(220, 53, 69, 0.15)',
            borderWidth: 2,
            pointBackgroundColor: notAttendedData.map(v => v > 10 ? '#8b0000' : 'rgba(220, 53, 69, 1)'),
            pointBorderColor: notAttendedData.map(v => v > 10 ? '#8b0000' : 'rgba(220, 53, 69, 1)'),
            pointRadius: notAttendedData.map(v => v > 10 ? 8 : 5),
            pointHoverRadius: 9,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { size: 14, weight: 'bold' }
            }
          },
          title: {
            display: true,
            text: `Exam Booking Count: ${this.locationDisplayText} | ${this.examModeDisplayText}`,
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                return tooltipItems[0].label;
              },
              afterTitle: () => {
                return `Location: ${this.locationDisplayText}\nExam Mode: ${this.examModeDisplayText}`;
              },
              label: (tooltipItem) => {
                const datasetLabel = tooltipItem.dataset.label || '';
                const value = tooltipItem.raw;
                return `${datasetLabel}: ${value}`;
              }
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              drag: {
                enabled: true,
                backgroundColor: 'rgba(25, 118, 210, 0.15)',
                borderColor: 'rgba(25, 118, 210, 0.6)',
                borderWidth: 1
              },
              mode: 'x'
            }
          },
          annotation: {
            annotations: {
              ...(completedData.some(v => v > 50) ? {
                completedThreshold: {
                  type: 'line' as const,
                  yMin: 50,
                  yMax: 50,
                  borderColor: 'rgba(40, 167, 69, 0.8)',
                  borderWidth: 2,
                  borderDash: [6, 4],
                  label: {
                    display: true,
                    content: 'Completed Threshold (50)',
                    position: 'start' as const,
                    backgroundColor: 'rgba(40, 167, 69, 0.8)',
                    font: { size: 10, weight: 'bold' as const }
                  }
                }
              } : {}),
              ...(disconnectedData.some(v => v > 5) ? {
                disconnectedThreshold: {
                  type: 'line' as const,
                  yMin: 5,
                  yMax: 5,
                  borderColor: 'rgba(255, 165, 0, 0.8)',
                  borderWidth: 2,
                  borderDash: [6, 4],
                  label: {
                    display: true,
                    content: 'Disconnected Threshold (5)',
                    position: 'end' as const,
                    backgroundColor: 'rgba(255, 165, 0, 0.8)',
                    font: { size: 10, weight: 'bold' as const }
                  }
                }
              } : {}),
              ...(notAttendedData.some(v => v > 10) ? {
                notAttendedThreshold: {
                  type: 'line' as const,
                  yMin: 10,
                  yMax: 10,
                  borderColor: 'rgba(220, 53, 69, 0.8)',
                  borderWidth: 2,
                  borderDash: [6, 4],
                  label: {
                    display: true,
                    content: 'Not Attended Threshold (10)',
                    position: 'start' as const,
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    font: { size: 10, weight: 'bold' as const }
                  }
                }
              } : {})
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
              font: { size: 13, weight: 'bold' }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Student Count',
              font: { size: 13, weight: 'bold' }
            },
            ticks: {
              stepSize: 5
            }
          }
        }
      }
    });
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private renderFutureChart(labels: string[], incompleteData: number[]): void {
    if (this.chart) {
      this.chart.destroy();
    }

    const canvas = this.barChartRef.nativeElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.map(d => this.formatDate(d)),
        datasets: [
          {
            label: 'Incomplete Test (Scheduled)',
            data: incompleteData,
            borderColor: 'rgba(124, 77, 255, 1)',
            backgroundColor: 'rgba(124, 77, 255, 0.15)',
            borderWidth: 2,
            pointBackgroundColor: incompleteData.map(v => v > 50 ? '#311b92' : 'rgba(124, 77, 255, 1)'),
            pointBorderColor: incompleteData.map(v => v > 50 ? '#311b92' : 'rgba(124, 77, 255, 1)'),
            pointRadius: incompleteData.map(v => v > 50 ? 8 : 5),
            pointHoverRadius: 9,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: { size: 14, weight: 'bold' }
            }
          },
          title: {
            display: true,
            text: `Upcoming Exam Booking Count: ${this.locationDisplayText} | ${this.examModeDisplayText}`,
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => {
                return tooltipItems[0].label;
              },
              afterTitle: () => {
                return `Location: ${this.locationDisplayText}\nExam Mode: ${this.examModeDisplayText}`;
              },
              label: (tooltipItem) => {
                const datasetLabel = tooltipItem.dataset.label || '';
                const value = tooltipItem.raw;
                return `${datasetLabel}: ${value}`;
              }
            }
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x'
            },
            zoom: {
              wheel: {
                enabled: true
              },
              drag: {
                enabled: true,
                backgroundColor: 'rgba(124, 77, 255, 0.15)',
                borderColor: 'rgba(124, 77, 255, 0.6)',
                borderWidth: 1
              },
              mode: 'x'
            }
          },
          annotation: {
            annotations: {
              ...(incompleteData.some(v => v > 50) ? {
                incompleteThreshold: {
                  type: 'line' as const,
                  yMin: 50,
                  yMax: 50,
                  borderColor: 'rgba(124, 77, 255, 0.8)',
                  borderWidth: 2,
                  borderDash: [6, 4],
                  label: {
                    display: true,
                    content: 'High Booking Threshold (50)',
                    position: 'start' as const,
                    backgroundColor: 'rgba(124, 77, 255, 0.8)',
                    font: { size: 10, weight: 'bold' as const }
                  }
                }
              } : {})
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
              font: { size: 13, weight: 'bold' }
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Booking Count',
              font: { size: 13, weight: 'bold' }
            },
            ticks: {
              stepSize: 5
            }
          }
        }
      }
    });
  }

  resetZoom(): void {
    if (this.chart) {
      (this.chart as any).resetZoom();
    }
  }

  resetForm(): void {
    this.startDate = '';
    this.endDate = '';
    this.selectedLocations = [];
    this.selectedExamModes = [];
    this.totalCount = null;
    this.completedTotal = null;
    this.disconnectedTotal = null;
    this.notAttendedTotal = null;
    this.incompleteTotal = null;
    this.showResult = false;
    this.isFutureRange = false;
    this.thresholdAlerts = [];
    this.locationDropdownOpen = false;
    this.examModeDropdownOpen = false;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
