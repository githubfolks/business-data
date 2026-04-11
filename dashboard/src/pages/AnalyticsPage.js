import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyticsAPI } from '../api';
import './AnalyticsPage.css';

function AnalyticsPage({ setError }) {
  const [metrics, setMetrics] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [ratingData, setRatingData] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metricsRes, categoryRes, statusRes, ratingRes] = await Promise.all([
          analyticsAPI.getMetrics(),
          analyticsAPI.getByCategory(),
          analyticsAPI.getByStatus(),
          analyticsAPI.getRatingDistribution(),
        ]);

        setMetrics(metricsRes.data);
        
        // Format category data
        if (categoryRes.data.by_category) {
          setCategoryData(Object.entries(categoryRes.data.by_category).map(([key, value]) => ({
            name: key,
            count: value,
          })));
        }

        // Format status data
        if (statusRes.data.by_status) {
          setStatusData(Object.entries(statusRes.data.by_status).map(([key, value]) => ({
            name: key,
            count: value,
          })));
        }

        // Format rating data
        if (ratingRes.data.rating_distribution) {
          setRatingData(ratingRes.data.rating_distribution);
        }
      } catch (err) {
        setError('Failed to load analytics: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setError]);

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="analytics-page container">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <p>Business insights and statistics</p>
      </div>

      {metrics && (
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Total Businesses</h3>
            <p className="metric-value">{metrics.total_businesses || 0}</p>
          </div>
          <div className="metric-card">
            <h3>Active</h3>
            <p className="metric-value" style={{ color: '#28a745' }}>{metrics.active_businesses || 0}</p>
          </div>
          <div className="metric-card">
            <h3>Average Rating</h3>
            <p className="metric-value">⭐ {(metrics.average_rating || 0).toFixed(2)}</p>
          </div>
          <div className="metric-card">
            <h3>Categories</h3>
            <p className="metric-value">{metrics.total_categories || 0}</p>
          </div>
        </div>
      )}

      <div className="charts-grid">
        {categoryData.length > 0 && (
          <div className="chart-card">
            <h2>Businesses by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#667eea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {statusData.length > 0 && (
          <div className="chart-card">
            <h2>Businesses by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {ratingData.length > 0 && (
          <div className="chart-card">
            <h2>Rating Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#764ba2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {metrics && (
        <div className="stats-section">
          <h2>Additional Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <span>Total Reviews</span>
              <p>{metrics.total_reviews || 0}</p>
            </div>
            <div className="stat-item">
              <span>Data Providers</span>
              <p>{metrics.total_providers || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
