/**
 * Chart Demo Component
 * 
 * Demonstration component for testing and showcasing admin panel charts.
 * Uses sample data to display all available chart types for development and testing.
 * 
 * Features:
 * - All chart types demonstration
 * - Sample data for testing
 * - Responsive grid layout
 * - Development and testing tool
 * 
 * @component
 * @returns {JSX.Element} Chart demonstration interface
 */

import React from 'react';
import { 
  UserDistributionChart, 
  LessonsByStatusChart, 
  SalaryDistributionChart, 
  UserGrowthChart,
  ActiveVsBannedChart 
} from './AdminCharts';

/**
 * Demo data for testing charts
 * Contains sample data that mimics real application data structure
 */
const demoData = {
  usersByRole: {
    parents: 45,
    students: 120,
    teachers: 25,
    admins: 3
  },
  activeUsers: 180,
  bannedUsers: 13,
  lessonsByStatus: {
    booked: 35,
    inProgress: 12,
    completed: 156,
    cancelled: 8
  },
  salaryReport: [
    {
      teacher: { firstName: 'John', lastName: 'Smith' },
      totalSalary: 2500.00,
      totalHours: 50
    },
    {
      teacher: { firstName: 'Sarah', lastName: 'Johnson' },
      totalSalary: 2200.00,
      totalHours: 44
    },
    {
      teacher: { firstName: 'Mike', lastName: 'Davis' },
      totalSalary: 1800.00,
      totalHours: 36
    },
    {
      teacher: { firstName: 'Emily', lastName: 'Wilson' },
      totalSalary: 1600.00,
      totalHours: 32
    },
    {
      teacher: { firstName: 'David', lastName: 'Brown' },
      totalSalary: 1400.00,
      totalHours: 28
    }
  ],
  users: [
    { role: 'Parent', createdAt: '2024-01-15T00:00:00.000Z' },
    { role: 'Student', createdAt: '2024-01-20T00:00:00.000Z' },
    { role: 'Teacher', createdAt: '2024-02-01T00:00:00.000Z' },
    { role: 'Student', createdAt: '2024-02-10T00:00:00.000Z' },
    { role: 'Parent', createdAt: '2024-02-15T00:00:00.000Z' },
    { role: 'Student', createdAt: '2024-03-01T00:00:00.000Z' },
    { role: 'Teacher', createdAt: '2024-03-05T00:00:00.000Z' },
    { role: 'Student', createdAt: '2024-03-10T00:00:00.000Z' },
    { role: 'Parent', createdAt: '2024-03-15T00:00:00.000Z' },
    { role: 'Student', createdAt: '2024-03-20T00:00:00.000Z' }
  ]
};

const ChartDemo = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Admin Charts Demo</h1>
      <p>This is a demo of the admin panel charts with sample data.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <UserDistributionChart usersByRole={demoData.usersByRole} />
        <ActiveVsBannedChart 
          activeUsers={demoData.activeUsers} 
          bannedUsers={demoData.bannedUsers} 
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <LessonsByStatusChart lessonsByStatus={demoData.lessonsByStatus} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <SalaryDistributionChart salaryReport={demoData.salaryReport} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <UserGrowthChart users={demoData.users} />
      </div>
    </div>
  );
};

export default ChartDemo;
