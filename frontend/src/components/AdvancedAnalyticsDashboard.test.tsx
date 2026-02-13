import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';
import * as backendApi from '@/services/backendApi';

vi.mock('@/services/backendApi', () => ({
  backendApi: {
    baseUrl: 'https://api.test.com',
    getAnalyticsEfficiency: vi.fn(),
    getAnalyticsCharging: vi.fn(),
  },
}));

global.fetch = vi.fn();

describe('AdvancedAnalyticsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(backendApi.backendApi.getAnalyticsEfficiency).mockImplementation(
      () => new Promise(() => {})
    );
    vi.mocked(backendApi.backendApi.getAnalyticsCharging).mockImplementation(
      () => new Promise(() => {})
    );
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {}));

    render(<AdvancedAnalyticsDashboard />);

    expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
  });

  it('shows empty states when no data is available', async () => {
    vi.mocked(backendApi.backendApi.getAnalyticsEfficiency).mockResolvedValue({});
    vi.mocked(backendApi.backendApi.getAnalyticsCharging).mockResolvedValue({});
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: false }),
    });

    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const emptyStates = screen.getAllByText(/Metrics appear after your first drive/i);
      expect(emptyStates.length).toBeGreaterThan(0);
    });
  });

  it('renders metric cards with data', async () => {
    vi.mocked(backendApi.backendApi.getAnalyticsEfficiency).mockResolvedValue({
      efficiency: [],
    });
    vi.mocked(backendApi.backendApi.getAnalyticsCharging).mockResolvedValue({
      byChargerType: [],
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        totalDistance: 1250,
        totalEnergy: 300,
        averageEfficiency: 4.17,
        totalCost: 45.5,
        costPerMile: 0.036,
        costSavings: 89.75,
        carbonSaved: 550,
        totalDrives: 12,
        totalCharges: 8,
        totalEnergyAdded: 310,
      }),
    });

    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,250 mi')).toBeInTheDocument();
      const efficiencies = screen.getAllByText('4.17 mi/kWh');
      expect(efficiencies.length).toBeGreaterThan(0);
      expect(screen.getByText('$89.75')).toBeInTheDocument();
      expect(screen.getByText('550 lbs')).toBeInTheDocument();
    });
  });

  it('displays efficiency trends when data is available', async () => {
    vi.mocked(backendApi.backendApi.getAnalyticsEfficiency).mockResolvedValue({
      efficiency: [
        {
          date: '2024-01-15',
          miles_driven: 50,
          energy_consumed_kwh: 12.5,
          efficiency_miles_per_kwh: 4.0,
          avg_outside_temp_f: 65,
          avg_speed_mph: 60,
        },
        {
          date: '2024-01-14',
          miles_driven: 60,
          energy_consumed_kwh: 14.0,
          efficiency_miles_per_kwh: 4.29,
          avg_outside_temp_f: 68,
          avg_speed_mph: 55,
        },
      ],
    });
    vi.mocked(backendApi.backendApi.getAnalyticsCharging).mockResolvedValue({
      byChargerType: [],
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        totalDistance: 1250,
        totalEnergy: 300,
        averageEfficiency: 4.17,
        totalCost: 45.5,
        costPerMile: 0.036,
        costSavings: 89.75,
        carbonSaved: 550,
        totalDrives: 12,
        totalCharges: 8,
        totalEnergyAdded: 310,
      }),
    });

    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const efficiencyTab = screen.getByRole('tab', { name: /Efficiency/i });
      expect(efficiencyTab).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('2024-01-14')).toBeInTheDocument();
    });
  });

  it('displays charging data when available', async () => {
    const user = userEvent.setup();

    vi.mocked(backendApi.backendApi.getAnalyticsEfficiency).mockResolvedValue({
      efficiency: [],
    });
    vi.mocked(backendApi.backendApi.getAnalyticsCharging).mockResolvedValue({
      byChargerType: [
        {
          charger_type: 'Supercharger',
          session_count: 5,
          total_energy_added_kwh: 150,
          avg_cost_per_kwh: 0.25,
          avg_duration_minutes: 25,
        },
        {
          charger_type: 'Home',
          session_count: 15,
          total_energy_added_kwh: 200,
          avg_cost_per_kwh: 0.12,
          avg_duration_minutes: 420,
        },
      ],
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        totalDistance: 1250,
        totalEnergy: 300,
        averageEfficiency: 4.17,
        totalCost: 45.5,
        costPerMile: 0.036,
        costSavings: 89.75,
        carbonSaved: 550,
        totalDrives: 12,
        totalCharges: 20,
        totalEnergyAdded: 350,
      }),
    });

    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const efficiencies = screen.getAllByText('4.17 mi/kWh');
      expect(efficiencies.length).toBeGreaterThan(0);
    });

    const costTab = screen.getByRole('tab', { name: /Cost Analysis/i });
    await user.click(costTab);

    await waitFor(() => {
      expect(screen.getByText('Supercharger')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('5 sessions')).toBeInTheDocument();
      expect(screen.getByText('15 sessions')).toBeInTheDocument();
    });
  });

  it('shows empty state for charging data when none available', async () => {
    const user = userEvent.setup();

    vi.mocked(backendApi.backendApi.getAnalyticsEfficiency).mockResolvedValue({
      efficiency: [],
    });
    vi.mocked(backendApi.backendApi.getAnalyticsCharging).mockResolvedValue({
      byChargerType: [],
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        totalDistance: 1250,
        totalEnergy: 300,
        averageEfficiency: 4.17,
        totalCost: 45.5,
        costPerMile: 0.036,
        costSavings: 89.75,
        carbonSaved: 550,
        totalDrives: 12,
        totalCharges: 0,
        totalEnergyAdded: 0,
      }),
    });

    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const efficiencies = screen.queryAllByText('4.17 mi/kWh');
      expect(efficiencies.length).toBeGreaterThan(0);
    });

    const costTab = screen.getByRole('tab', { name: /Cost Analysis/i });
    await user.click(costTab);

    await waitFor(() => {
      expect(
        screen.getByText(/Charging data appears after your first charging session/i)
      ).toBeInTheDocument();
    });
  });

  it('shows AI insights when sufficient data is available', async () => {
    vi.mocked(backendApi.backendApi.getAnalyticsEfficiency).mockResolvedValue({
      efficiency: [],
    });
    vi.mocked(backendApi.backendApi.getAnalyticsCharging).mockResolvedValue({
      byChargerType: [],
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        totalDistance: 1250,
        totalEnergy: 300,
        averageEfficiency: 4.17,
        totalCost: 45.5,
        costPerMile: 0.036,
        costSavings: 89.75,
        carbonSaved: 550,
        totalDrives: 10,
        totalCharges: 8,
        totalEnergyAdded: 310,
      }),
    });

    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const efficiencies = screen.queryAllByText(/mi\/kWh/);
      expect(efficiencies.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(screen.getByText('Efficiency Opportunity')).toBeInTheDocument();
      expect(screen.getByText('Cost Optimization')).toBeInTheDocument();
      expect(screen.getByText('Charging Pattern')).toBeInTheDocument();
    });
  });

  it('shows empty state for AI insights when insufficient data', async () => {
    vi.mocked(backendApi.backendApi.getAnalyticsEfficiency).mockResolvedValue({
      efficiency: [],
    });
    vi.mocked(backendApi.backendApi.getAnalyticsCharging).mockResolvedValue({
      byChargerType: [],
    });
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        totalDistance: 100,
        totalEnergy: 25,
        averageEfficiency: 4.0,
        totalCost: 5.0,
        costPerMile: 0.05,
        costSavings: 10,
        carbonSaved: 50,
        totalDrives: 2,
        totalCharges: 1,
        totalEnergyAdded: 30,
      }),
    });

    render(<AdvancedAnalyticsDashboard />);

    await waitFor(() => {
      const efficiencies = screen.queryAllByText(/mi\/kWh/);
      expect(efficiencies.length).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/AI insights generate after enough data is collected/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Complete at least 5 drives to unlock personalized recommendations/i)
      ).toBeInTheDocument();
    });
  });
});
