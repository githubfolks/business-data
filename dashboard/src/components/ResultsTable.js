import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import '../styles/ResultsTable.css';

function ResultsTable({ businesses, onRowClick }) {
  const handleDownloadExcel = () => {
    if (!businesses || businesses.length === 0) {
      alert('No data to export');
      return;
    }

    // Prepare data for Excel
    const exportData = businesses.map((business) => ({
      ID: business.id || business._id || '',
      Name: business.name || '',
      Category: business.category || '',
      Subcategories: Array.isArray(business.subcategories) ? business.subcategories.join(', ') : '',
      Street: business.street || '',
      City: business.city || '',
      State: business.state || '',
      'Postal Code': business.postal_code || '',
      Country: business.country || '',
      Phone: Array.isArray(business.phone_numbers) ? business.phone_numbers.join(', ') : '',
      Website: business.website || '',
      Email: business.email || '',
      Rating: business.rating || '',
      'Review Count': business.review_count || '',
      Status: business.status || '',
      Verified: business.verified ? 'Yes' : 'No',
      'Last Synced': business.last_synced ? new Date(business.last_synced).toLocaleString() : '',
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.min(20, Math.max(10, key.length + 2)),
    }));
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Businesses');

    // Download file
    const filename = `businesses_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  if (!businesses || businesses.length === 0) {
    return <div className="no-results">No results to display</div>;
  }

  return (
    <div className="results-table-container">
      <div className="table-header">
        <h3>Search Results ({businesses.length})</h3>
        <button className="export-btn" onClick={handleDownloadExcel}>
          <Download size={16} />
          Download Excel
        </button>
      </div>

      <div className="table-wrapper">
        <table className="results-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Location</th>
              <th>Phone</th>
              <th>Website</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {businesses.map((business) => (
              <tr key={business.id || business._id} className="table-row">
                <td className="name-cell">
                  <strong>{business.name}</strong>
                  {business.city && <div className="sub-text">{business.city}</div>}
                </td>
                <td>
                  <span className="category-badge">{business.category}</span>
                  {business.subcategories && business.subcategories.length > 0 && (
                    <div className="sub-text">{business.subcategories.join(', ')}</div>
                  )}
                </td>
                <td>
                  <div className="location-cell">
                    {business.city && <div>{business.city}</div>}
                    {business.state && <div>{business.state}</div>}
                    {business.postal_code && <div>{business.postal_code}</div>}
                    {business.country && <div className="sub-text">{business.country}</div>}
                  </div>
                </td>
                <td>
                  {business.phone_numbers && business.phone_numbers.length > 0 ? (
                    <a href={`tel:${business.phone_numbers[0]}`}>{business.phone_numbers[0]}</a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {business.website ? (
                    <a href={business.website} target="_blank" rel="noopener noreferrer">
                      Visit
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  {business.rating ? (
                    <span className="rating-badge">
                      ⭐ {business.rating.toFixed(1)}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${business.status || 'active'}`}>
                    {business.status || 'active'}
                  </span>
                </td>
                <td>
                  <button
                    className="view-btn"
                    onClick={() => onRowClick && onRowClick(business)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ResultsTable;
