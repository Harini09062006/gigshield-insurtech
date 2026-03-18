export interface InsurancePlan {
  id: string;
  name: string;
  costPerWeek: number;
  maxPayout: number;
  description: string;
}

export const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'basic',
    name: 'Basic Shield',
    costPerWeek: 10,
    maxPayout: 60,
    description: 'Essential coverage for part-time gig workers.'
  },
  {
    id: 'pro',
    name: 'Pro Shield',
    costPerWeek: 25,
    maxPayout: 240,
    description: 'Comprehensive protection for active full-time workers.'
  },
  {
    id: 'elite',
    name: 'Elite Shield',
    costPerWeek: 50,
    maxPayout: 600,
    description: 'Maximum security for high-earning gig professionals.'
  }
];

export const MOCK_WORKER_PROFILE = {
  id: 'worker-123',
  name: 'Rahul Sharma',
  role: 'Worker',
  currentPlanId: 'pro',
  policyStartDate: '2023-11-01',
  policyWeek: 2,
  autoRenew: true,
  lastEarningSnapshot: [
    { timestamp: '2023-11-20T08:00:00Z', hoursWorked: 4, earnings: 450, location: 'Mumbai, MH' },
    { timestamp: '2023-11-20T17:00:00Z', hoursWorked: 3, earnings: 600, location: 'Mumbai, MH' },
    { timestamp: '2023-11-21T09:00:00Z', hoursWorked: 5, earnings: 550, location: 'Mumbai, MH' },
    { timestamp: '2023-11-21T18:00:00Z', hoursWorked: 4, earnings: 800, location: 'Mumbai, MH' },
    { timestamp: '2023-11-22T08:30:00Z', hoursWorked: 6, earnings: 700, location: 'Mumbai, MH' },
    { timestamp: '2023-11-22T19:00:00Z', hoursWorked: 2, earnings: 400, location: 'Mumbai, MH' },
  ]
};

export const MOCK_DISRUPTION_EVENTS = [
  { id: 'd1', timestamp: new Date().toISOString(), latitude: 19.0760, longitude: 72.8777, workersCount: 15, locationName: 'Mumbai Central' },
  { id: 'd2', timestamp: new Date(Date.now() - 3600000).toISOString(), latitude: 28.6139, longitude: 77.2090, workersCount: 12, locationName: 'New Delhi CP' },
  { id: 'd3', timestamp: new Date(Date.now() - 86400000).toISOString(), latitude: 12.9716, longitude: 77.5946, workersCount: 22, locationName: 'Bangalore MG Road' },
];
