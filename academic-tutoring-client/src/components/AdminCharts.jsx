/**
 * AdminCharts Component Library
 * 
 * Collection of reusable chart components for the admin dashboard.
 * Uses Recharts library for data visualization with consistent theming.
 * 
 * Features:
 * - User distribution pie chart
 * - Salary distribution bar chart
 * - User growth timeline
 * - Active vs banned users chart
 * - Responsive design with consistent colors
 * 
 * @file AdminCharts.jsx
 * @version 1.0.0
 * @author Academic Tutoring Team
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

/**
 * Color palette for consistent theming across all charts
 * Matches the application's design system
 */
const COLORS = {
  primary: '#667eea',    // Main brand color
  success: '#22c55e',    // Green for positive metrics
  warning: '#f59e0b',    // Orange for warnings
  danger: '#ef4444',     // Red for errors/negative metrics
  info: '#3b82f6',       // Blue for informational data
  purple: '#8b5cf6',     // Purple for parents
  teal: '#14b8a6',       // Teal for additional data
  orange: '#f97316'      // Orange for teachers
};

/**
 * Array of colors for multi-series charts
 * Provides consistent color assignment for data series
 */
const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.purple,
  COLORS.teal,
  COLORS.orange
];

/**
 * User Distribution Pie Chart Component
 * 
 * Displays the distribution of users by role in a pie chart format.
 * Shows the proportion of Parents, Students, Teachers, and Admins in the system.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.usersByRole - Object containing user counts by role
 * @param {number} [props.usersByRole.parents] - Number of parent users
 * @param {number} [props.usersByRole.students] - Number of student users
 * @param {number} [props.usersByRole.teachers] - Number of teacher users
 * @param {number} [props.usersByRole.admins] - Number of admin users
 * @returns {JSX.Element|null} Pie chart component or null if no data
 */
export const UserDistributionChart = ({ usersByRole }) => {
  // Return null if no data provided
  if (!usersByRole) return null;

  // Prepare data for pie chart with role-specific colors
  const data = [
    { name: 'Parents', value: usersByRole.parents || 0, color: COLORS.purple },
    { name: 'Students', value: usersByRole.students || 0, color: COLORS.success },
    { name: 'Teachers', value: usersByRole.teachers || 0, color: COLORS.warning },
    { name: 'Admins', value: usersByRole.admins || 0, color: COLORS.danger }
  ].filter(item => item.value > 0); // Only show roles with users

  return (
    <div className="chart-container">
      <h4 className="chart-title">User Distribution</h4>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// 2. Lessons by Status Chart
export const LessonsByStatusChart = ({ lessonsByStatus }) => {
  if (!lessonsByStatus) return null;

  const data = [
    { name: 'Booked', value: lessonsByStatus.booked || 0, color: COLORS.info },
    { name: 'In Progress', value: lessonsByStatus.inProgress || 0, color: COLORS.warning },
    { name: 'Completed', value: lessonsByStatus.completed || 0, color: COLORS.success },
    { name: 'Cancelled', value: lessonsByStatus.cancelled || 0, color: COLORS.danger }
  ].filter(item => item.value > 0);

  return (
    <div className="chart-container">
      <h4 className="chart-title">Lessons by Status</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill={COLORS.primary} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 3. Salary Distribution Bar Chart
export const SalaryDistributionChart = ({ salaryReport }) => {
  if (!salaryReport || salaryReport.length === 0) return null;

  const data = salaryReport
    .map(report => ({
      name: `${report.teacher.firstName} ${report.teacher.lastName}`,
      salary: report.totalSalary,
      hours: report.totalHours
    }))
    .sort((a, b) => b.salary - a.salary)
    .slice(0, 10); // Top 10 teachers

  return (
    <div className="chart-container">
      <h4 className="chart-title">Top 10 Teachers by Salary</h4>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis />
          <Tooltip 
            formatter={(value, name) => [
              name === 'salary' ? `$${value.toFixed(2)}` : value,
              name === 'salary' ? 'Salary' : 'Hours'
            ]}
          />
          <Bar dataKey="salary" fill={COLORS.success} name="Total Salary" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// 4. User Growth Timeline
export const UserGrowthChart = ({ users }) => {
  console.log('UserGrowthChart - users data:', users);
  console.log('UserGrowthChart - users length:', users?.length);
  
  if (!users || users.length === 0) {
    console.log('UserGrowthChart - returning null because no users data');
    return (
      <div className="chart-container">
        <h4 className="chart-title">User Growth Over Time</h4>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No user data available for growth chart</p>
          <small>Load users in the "Manage Users" tab first</small>
        </div>
      </div>
    );
  }

  // Create a complete timeline (last 12 months)
  const now = new Date();
  const monthlyData = {};
  
  // Initialize last 12 months with zero values
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    monthlyData[monthKey] = {
      month: monthKey,
      total: 0,
      parents: 0,
      students: 0,
      teachers: 0
    };
  }
  
  // Add actual user data (exclude admins)
  users.forEach(user => {
    if (user.role.toLowerCase() === 'admin') return; // Skip admins
    
    const date = new Date(user.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].total++;
      monthlyData[monthKey][user.role.toLowerCase() + 's']++;
    }
  });

  const data = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((item, index, array) => {
      // Calculate cumulative totals
      const cumulativeTotal = array.slice(0, index + 1).reduce((sum, month) => sum + month.total, 0);
      const cumulativeParents = array.slice(0, index + 1).reduce((sum, month) => sum + month.parents, 0);
      const cumulativeStudents = array.slice(0, index + 1).reduce((sum, month) => sum + month.students, 0);
      const cumulativeTeachers = array.slice(0, index + 1).reduce((sum, month) => sum + month.teachers, 0);
      
      return {
        ...item,
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        }),
        cumulativeTotal,
        cumulativeParents,
        cumulativeStudents,
        cumulativeTeachers
      };
    });

  return (
    <div className="chart-container">
      <h4 className="chart-title">User Growth Over Time (Last 12 Months)</h4>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
        Showing monthly user registrations by role (excluding admins)
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke={COLORS.primary} 
            strokeWidth={2}
            name="Monthly New Users"
          />
          <Line 
            type="monotone" 
            dataKey="cumulativeTotal" 
            stroke={COLORS.primary} 
            strokeWidth={3}
            strokeDasharray="5 5"
            name="Total Users (Cumulative)"
          />
          <Line 
            type="monotone" 
            dataKey="parents" 
            stroke={COLORS.purple} 
            strokeWidth={2}
            name="Parents"
          />
          <Line 
            type="monotone" 
            dataKey="students" 
            stroke={COLORS.success} 
            strokeWidth={2}
            name="Students"
          />
          <Line 
            type="monotone" 
            dataKey="teachers" 
            stroke={COLORS.warning} 
            strokeWidth={2}
            name="Teachers"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// 5. Active vs Banned Users Donut Chart
export const ActiveVsBannedChart = ({ activeUsers, bannedUsers }) => {
  const data = [
    { name: 'Active Users', value: activeUsers || 0, color: COLORS.success },
    { name: 'Banned Users', value: bannedUsers || 0, color: COLORS.danger }
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="chart-container">
      <h4 className="chart-title">User Status Overview</h4>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <text 
            x="50%" 
            y="50%" 
            textAnchor="middle" 
            dominantBaseline="middle" 
            className="donut-center-text"
          >
            {total}
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Chart container styles
const chartStyles = `
.chart-container {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  border: 1px solid var(--border-light);
}

.chart-title {
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.donut-center-text {
  font-size: 24px;
  font-weight: bold;
  fill: var(--text-primary);
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = chartStyles;
  document.head.appendChild(styleSheet);
}
