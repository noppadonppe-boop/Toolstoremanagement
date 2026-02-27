export const SITES = [
  { id: 'HQ', name: 'HQ Warehouse', type: 'hq', location: 'Bangkok HQ' },
  { id: 'SITE-A', name: 'Site Alpha', type: 'site', location: 'Sukhumvit Project' },
  { id: 'SITE-B', name: 'Site Beta', type: 'site', location: 'Silom Tower Project' },
  { id: 'SITE-C', name: 'Site Gamma', type: 'site', location: 'Rama IX Project' },
];

export const USERS = [
  { id: 'u1', name: 'Somchai Jaidee', username: 'admin', password: 'admin123', role: 'Admin', siteId: 'HQ', avatar: 'SJ' },
  { id: 'u2', name: 'Priya Patel', username: 'procurement', password: 'proc123', role: 'ProcurementManager', siteId: 'HQ', avatar: 'PP' },
  { id: 'u3', name: 'Arun Kumar', username: 'pm_alpha', password: 'pm123', role: 'PM', siteId: 'SITE-A', avatar: 'AK' },
  { id: 'u4', name: 'Wanchai Srithong', username: 'pm_beta', password: 'pm123', role: 'PM', siteId: 'SITE-B', avatar: 'WS' },
  { id: 'u5', name: 'Natthida Wongsuk', username: 'cm_alpha', password: 'cm123', role: 'CM', siteId: 'SITE-A', avatar: 'NW' },
  { id: 'u6', name: 'Krit Phonsiri', username: 'storemain', password: 'store123', role: 'StoreMain', siteId: 'HQ', avatar: 'KP' },
  { id: 'u7', name: 'Malee Thammasak', username: 'storesite_a', password: 'store123', role: 'StoreSite', siteId: 'SITE-A', avatar: 'MT' },
  { id: 'u8', name: 'Thanit Ratchada', username: 'storesite_b', password: 'store123', role: 'StoreSite', siteId: 'SITE-B', avatar: 'TR' },
  { id: 'u9', name: 'Jirapat Suwannak', username: 'sup_alpha', password: 'sup123', role: 'Supervisor', siteId: 'SITE-A', avatar: 'JS' },
  { id: 'u10', name: 'Busaba Chatree', username: 'sup_beta', password: 'sup123', role: 'Supervisor', siteId: 'SITE-B', avatar: 'BC' },
  { id: 'u11', name: 'Prasert Thongdee', username: 'md', password: 'md123', role: 'MD', siteId: 'HQ', avatar: 'PT' },
];

export const CATEGORIES = ['Power Tools', 'Hand Tools', 'Safety Equipment', 'Measuring Equipment', 'Heavy Machinery', 'Electrical', 'Plumbing'];

export const INITIAL_TOOLS = [
  // HQ Tools
  { id: 'T001', name: 'Angle Grinder 4"', category: 'Power Tools', qrCode: 'QR-T001', currentStoreId: 'HQ', ownerSiteId: 'HQ', status: 'Available', serialNo: 'AG-2024-001', brand: 'Bosch', unitValue: 3500, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T002', name: 'Angle Grinder 4"', category: 'Power Tools', qrCode: 'QR-T002', currentStoreId: 'HQ', ownerSiteId: 'HQ', status: 'Available', serialNo: 'AG-2024-002', brand: 'Bosch', unitValue: 3500, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T003', name: 'Electric Drill 13mm', category: 'Power Tools', qrCode: 'QR-T003', currentStoreId: 'SITE-A', ownerSiteId: 'HQ', status: 'In-Use', serialNo: 'ED-2024-003', brand: 'Makita', unitValue: 4200, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T004', name: 'Electric Drill 13mm', category: 'Power Tools', qrCode: 'QR-T004', currentStoreId: 'SITE-B', ownerSiteId: 'HQ', status: 'Broken', serialNo: 'ED-2024-004', brand: 'Makita', unitValue: 4200, repairHistory: [{ id: 'R001', date: '2024-11-15', issue: 'Motor burnt', cost: 800, technician: 'AutoElec Co.', status: 'Completed' }], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T005', name: 'Impact Wrench 1/2"', category: 'Power Tools', qrCode: 'QR-T005', currentStoreId: 'SITE-A', ownerSiteId: 'HQ', status: 'In-Repair', serialNo: 'IW-2024-005', brand: 'Dewalt', unitValue: 6800, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T006', name: 'Circular Saw 7"', category: 'Power Tools', qrCode: 'QR-T006', currentStoreId: 'SITE-B', ownerSiteId: 'HQ', status: 'Available', serialNo: 'CS-2024-006', brand: 'Dewalt', unitValue: 5500, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T007', name: 'Rotary Hammer Drill', category: 'Power Tools', qrCode: 'QR-T007', currentStoreId: 'HQ', ownerSiteId: 'HQ', status: 'Available', serialNo: 'RH-2024-007', brand: 'Hilti', unitValue: 12000, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T008', name: 'Jigsaw 650W', category: 'Power Tools', qrCode: 'QR-T008', currentStoreId: 'SITE-C', ownerSiteId: 'HQ', status: 'Available', serialNo: 'JS-2024-008', brand: 'Bosch', unitValue: 3800, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  // Hand Tools
  { id: 'T009', name: 'Hammer 20oz', category: 'Hand Tools', qrCode: 'QR-T009', currentStoreId: 'SITE-A', ownerSiteId: 'HQ', status: 'Available', serialNo: 'HM-2024-009', brand: 'Stanley', unitValue: 450, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T010', name: 'Screwdriver Set', category: 'Hand Tools', qrCode: 'QR-T010', currentStoreId: 'SITE-A', ownerSiteId: 'HQ', status: 'Lost', serialNo: 'SD-2024-010', brand: 'Stanley', unitValue: 650, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T011', name: 'Adjustable Wrench 12"', category: 'Hand Tools', qrCode: 'QR-T011', currentStoreId: 'SITE-B', ownerSiteId: 'HQ', status: 'Available', serialNo: 'AW-2024-011', brand: 'Bahco', unitValue: 780, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T012', name: 'Tape Measure 7.5m', category: 'Hand Tools', qrCode: 'QR-T012', currentStoreId: 'SITE-C', ownerSiteId: 'HQ', status: 'Available', serialNo: 'TM-2024-012', brand: 'Stanley', unitValue: 320, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  // Safety Equipment
  { id: 'T013', name: 'Safety Harness Full-Body', category: 'Safety Equipment', qrCode: 'QR-T013', currentStoreId: 'SITE-A', ownerSiteId: 'HQ', status: 'In-Use', serialNo: 'SH-2024-013', brand: '3M', unitValue: 2800, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T014', name: 'Safety Harness Full-Body', category: 'Safety Equipment', qrCode: 'QR-T014', currentStoreId: 'SITE-B', ownerSiteId: 'HQ', status: 'Available', serialNo: 'SH-2024-014', brand: '3M', unitValue: 2800, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T015', name: 'Welding Mask Auto', category: 'Safety Equipment', qrCode: 'QR-T015', currentStoreId: 'HQ', ownerSiteId: 'HQ', status: 'Written-Off', serialNo: 'WM-2024-015', brand: 'Lincoln', unitValue: 1800, repairHistory: [], writeOffDetails: { reason: 'Damaged beyond repair - lens shattered', approvedBy: 'Priya Patel', date: '2024-12-01', approvedById: 'u2' }, borrowedBySiteId: null },
  // Measuring Equipment
  { id: 'T016', name: 'Laser Level 3-Line', category: 'Measuring Equipment', qrCode: 'QR-T016', currentStoreId: 'SITE-A', ownerSiteId: 'HQ', status: 'Available', serialNo: 'LL-2024-016', brand: 'Bosch', unitValue: 5200, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T017', name: 'Digital Theodolite', category: 'Measuring Equipment', qrCode: 'QR-T017', currentStoreId: 'SITE-B', ownerSiteId: 'HQ', status: 'In-Repair', serialNo: 'DT-2024-017', brand: 'Leica', unitValue: 45000, repairHistory: [{ id: 'R002', date: '2025-01-10', issue: 'Calibration error & cracked prism', cost: 8500, technician: 'Survey Instruments Ltd.', status: 'In-Progress' }], writeOffDetails: null, borrowedBySiteId: 'SITE-A' },
  { id: 'T018', name: 'Total Station', category: 'Measuring Equipment', qrCode: 'QR-T018', currentStoreId: 'SITE-C', ownerSiteId: 'HQ', status: 'Available', serialNo: 'TS-2024-018', brand: 'Trimble', unitValue: 120000, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  // Heavy Machinery
  { id: 'T019', name: 'Concrete Mixer 350L', category: 'Heavy Machinery', qrCode: 'QR-T019', currentStoreId: 'SITE-A', ownerSiteId: 'HQ', status: 'In-Use', serialNo: 'CM-2024-019', brand: 'Honda', unitValue: 28000, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T020', name: 'Concrete Mixer 350L', category: 'Heavy Machinery', qrCode: 'QR-T020', currentStoreId: 'SITE-B', ownerSiteId: 'HQ', status: 'Available', serialNo: 'CM-2024-020', brand: 'Honda', unitValue: 28000, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T021', name: 'Generator 5kVA', category: 'Electrical', qrCode: 'QR-T021', currentStoreId: 'HQ', ownerSiteId: 'HQ', status: 'Available', serialNo: 'GN-2024-021', brand: 'Yamaha', unitValue: 35000, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T022', name: 'Generator 5kVA', category: 'Electrical', qrCode: 'QR-T022', currentStoreId: 'SITE-C', ownerSiteId: 'HQ', status: 'Broken', serialNo: 'GN-2024-022', brand: 'Yamaha', unitValue: 35000, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T023', name: 'Pipe Wrench 24"', category: 'Plumbing', qrCode: 'QR-T023', currentStoreId: 'SITE-A', ownerSiteId: 'HQ', status: 'Available', serialNo: 'PW-2024-023', brand: 'Ridgid', unitValue: 980, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T024', name: 'Water Pump 2HP', category: 'Plumbing', qrCode: 'QR-T024', currentStoreId: 'SITE-B', ownerSiteId: 'HQ', status: 'Available', serialNo: 'WP-2024-024', brand: 'Grundfos', unitValue: 8500, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
  { id: 'T025', name: 'Scaffolding Set (10 frames)', category: 'Heavy Machinery', qrCode: 'QR-T025', currentStoreId: 'SITE-C', ownerSiteId: 'HQ', status: 'In-Use', serialNo: 'SC-2024-025', brand: 'SGB', unitValue: 45000, repairHistory: [], writeOffDetails: null, borrowedBySiteId: null },
];

export const INITIAL_REQUESTS = [
  {
    id: 'REQ-001', type: 'ProjectSetup', fromSiteId: 'HQ', toSiteId: 'SITE-A',
    items: [{ toolId: 'T003', toolName: 'Electric Drill 13mm' }, { toolId: 'T013', toolName: 'Safety Harness Full-Body' }],
    requestedBy: 'u5', requestedByName: 'Natthida Wongsuk', status: 'Completed',
    createdAt: '2024-10-01', approvedAt: '2024-10-02', approvedBy: 'u3', completedAt: '2024-10-03', notes: 'Project Alpha initial setup'
  },
  {
    id: 'REQ-002', type: 'DailyBooking', fromSiteId: null, toSiteId: 'SITE-A',
    items: [{ toolId: 'T009', toolName: 'Hammer 20oz' }, { toolId: 'T023', toolName: 'Pipe Wrench 24"' }],
    requestedBy: 'u9', requestedByName: 'Jirapat Suwannak', status: 'Pending',
    createdAt: '2025-01-20', approvedAt: null, approvedBy: null, completedAt: null, notes: 'Need for morning work'
  },
  {
    id: 'REQ-003', type: 'InterSiteBorrow', fromSiteId: 'SITE-A', toSiteId: 'SITE-B',
    items: [{ toolId: 'T017', toolName: 'Digital Theodolite' }],
    requestedBy: 'u3', requestedByName: 'Arun Kumar', status: 'Active',
    createdAt: '2025-01-10', approvedAt: '2025-01-11', approvedBy: 'u4', completedAt: null, notes: 'Need for site survey alignment'
  },
  {
    id: 'REQ-004', type: 'ProjectClosure', fromSiteId: 'SITE-C', toSiteId: 'HQ',
    items: [{ toolId: 'T008', toolName: 'Jigsaw 650W' }, { toolId: 'T018', toolName: 'Total Station' }],
    requestedBy: 'u6', requestedByName: 'Krit Phonsiri', status: 'Pending',
    createdAt: '2025-01-18', approvedAt: null, approvedBy: null, completedAt: null, notes: 'Site Gamma phase 1 complete'
  },
  {
    id: 'REQ-005', type: 'InterSiteBorrow', fromSiteId: 'SITE-B', toSiteId: 'SITE-C',
    items: [{ toolId: 'T006', toolName: 'Circular Saw 7"' }],
    requestedBy: 'u4', requestedByName: 'Wanchai Srithong', status: 'Pending',
    createdAt: '2025-01-21', approvedAt: null, approvedBy: null, completedAt: null, notes: 'Urgent - saw broken on site'
  },
];

export const INITIAL_REPAIRS = [
  {
    id: 'REP-001', toolId: 'T004', toolName: 'Electric Drill 13mm', issue: 'Motor burnt out during use',
    reportedBy: 'u8', reportedByName: 'Thanit Ratchada', reportedAt: '2024-11-15',
    responsibleSiteId: 'SITE-B', ownerSiteId: 'HQ',
    cost: 800, technician: 'AutoElec Co.', status: 'Completed',
    completedAt: '2024-11-20', notes: 'Replaced motor winding', isBorrowedBreakage: false
  },
  {
    id: 'REP-002', toolId: 'T005', toolName: 'Impact Wrench 1/2"', issue: 'Torque mechanism stripped',
    reportedBy: 'u7', reportedByName: 'Malee Thammasak', reportedAt: '2025-01-05',
    responsibleSiteId: 'SITE-A', ownerSiteId: 'HQ',
    cost: 1200, technician: 'Power Tools Service Center', status: 'In-Progress',
    completedAt: null, notes: 'Awaiting spare parts', isBorrowedBreakage: false
  },
  {
    id: 'REP-003', toolId: 'T017', toolName: 'Digital Theodolite', issue: 'Calibration error & cracked prism - broken while borrowed by Site A',
    reportedBy: 'u7', reportedByName: 'Malee Thammasak', reportedAt: '2025-01-10',
    responsibleSiteId: 'SITE-A', ownerSiteId: 'SITE-B',
    cost: 8500, technician: 'Survey Instruments Ltd.', status: 'In-Progress',
    completedAt: null, notes: 'Liability assigned to SITE-A (borrower)', isBorrowedBreakage: true
  },
  {
    id: 'REP-004', toolId: 'T022', toolName: 'Generator 5kVA', issue: 'Engine seized - overheating',
    reportedBy: 'u6', reportedByName: 'Krit Phonsiri', reportedAt: '2025-01-15',
    responsibleSiteId: 'SITE-C', ownerSiteId: 'HQ',
    cost: 4500, technician: null, status: 'Pending',
    completedAt: null, notes: 'Awaiting vendor assessment', isBorrowedBreakage: false
  },
];

export const INITIAL_WRITEOFF_REQUESTS = [
  {
    id: 'WO-001', toolId: 'T010', toolName: 'Screwdriver Set', reason: 'Reported Lost by Supervisor on Site Alpha',
    reportedBy: 'u9', reportedByName: 'Jirapat Suwannak', reportedAt: '2025-01-18',
    status: 'Pending', approvedBy: null, approvedAt: null, siteId: 'SITE-A'
  },
  {
    id: 'WO-002', toolId: 'T015', toolName: 'Welding Mask Auto', reason: 'Damaged beyond repair - lens shattered',
    reportedBy: 'u8', reportedByName: 'Thanit Ratchada', reportedAt: '2024-11-28',
    status: 'Approved', approvedBy: 'u2', approvedByName: 'Priya Patel', approvedAt: '2024-12-01', siteId: 'SITE-B'
  },
];
