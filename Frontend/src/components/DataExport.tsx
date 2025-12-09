import React, { useState } from 'react';
import { Download, FileText, MapPin, CheckCircle, Calendar, Filter } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const DataExport: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'geojson'>('csv');
  const [dateRange, setDateRange] = useState('7days');
  const [selectedMetrics, setSelectedMetrics] = useState(['aqi', 'voc', 'co2']);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  const sampleData = [
    { location: 'Delhi', aqi: 78, voc: 45, co2: 420, timestamp: '2024-01-15 10:00:00', lat: 28.6139, lng: 77.2090 },
    { location: 'Mumbai', aqi: 92, voc: 52, co2: 445, timestamp: '2024-01-15 10:00:00', lat: 19.0760, lng: 72.8777 },
    { location: 'Bangalore', aqi: 65, voc: 38, co2: 380, timestamp: '2024-01-15 10:00:00', lat: 12.9716, lng: 77.5946 },
    { location: 'Chennai', aqi: 58, voc: 32, co2: 365, timestamp: '2024-01-15 10:00:00', lat: 13.0827, lng: 80.2707 },
    { location: 'Kolkata', aqi: 85, voc: 48, co2: 435, timestamp: '2024-01-15 10:00:00', lat: 22.5726, lng: 88.3639 },
  ];

  const metrics = [
    { id: 'aqi', label: 'Air Quality Index', icon: FileText },
    { id: 'voc', label: 'VOC Levels', icon: Filter },
    { id: 'co2', label: 'CO₂ Concentration', icon: Filter },
    { id: 'location', label: 'Location Data', icon: MapPin },
  ];

  const handleExport = async (format: 'csv' | 'geojson') => {
    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create and download file
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'csv') {
      const headers = ['Location', 'AQI', 'VOC (ppb)', 'CO₂ (ppm)', 'Timestamp', 'Latitude', 'Longitude'];
      const rows = sampleData.map(row => [
        row.location,
        row.aqi,
        row.voc,
        row.co2,
        row.timestamp,
        row.lat,
        row.lng
      ]);
      
      content = [headers, ...rows].map(row => row.join(',')).join('\n');
      filename = `atmostrack-data-${dateRange}.csv`;
      mimeType = 'text/csv';
    } else {
      const geojson = {
        type: 'FeatureCollection',
        features: sampleData.map(point => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat]
          },
          properties: {
            location: point.location,
            aqi: point.aqi,
            voc: point.voc,
            co2: point.co2,
            timestamp: point.timestamp
          }
        }))
      };
      
      content = JSON.stringify(geojson, null, 2);
      filename = `atmostrack-data-${dateRange}.geojson`;
      mimeType = 'application/geo+json';
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsExporting(false);
    showToast(`Data exported successfully as ${format.toUpperCase()}!`, 'success');
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  return (
    <div className="pt-16 p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-cream-50 to-orange-50">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Data Export Center</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Export comprehensive air quality data in multiple formats for analysis, reporting, and integration with external systems.
        </p>
      </div>

      {/* Export Configuration */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Options */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Export Configuration</h2>
          
          {/* Format Selection */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Format Selection</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportFormat('csv')}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02]
                  ${exportFormat === 'csv' 
                    ? 'border-orange-400 bg-orange-50 text-orange-700' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">CSV Format</div>
                <div className="text-sm opacity-75">Spreadsheet compatible</div>
              </button>
              
              <button
                onClick={() => setExportFormat('geojson')}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02]
                  ${exportFormat === 'geojson' 
                    ? 'border-orange-400 bg-orange-50 text-orange-700' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">GeoJSON</div>
                <div className="text-sm opacity-75">Geographic data format</div>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date Range
            </h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors duration-200"
            >
              <option value="24hours">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>

          {/* Metrics Selection */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Metrics</h3>
            <div className="space-y-3">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <label
                    key={metric.id}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={() => toggleMetric(metric.id)}
                      className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-400"
                    />
                    <Icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700">{metric.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Export Actions & Preview */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Export Actions</h2>
          
          {/* Export Buttons */}
          <div className="space-y-4">
            <button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className={`
                w-full p-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl
                font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200
                ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                flex items-center justify-center space-x-3
              `}
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Export as CSV</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => handleExport('geojson')}
              disabled={isExporting}
              className={`
                w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl
                font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200
                ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                flex items-center justify-center space-x-3
              `}
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Export as GeoJSON</span>
                </>
              )}
            </button>
          </div>

          {/* Data Preview */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Location</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">AQI</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">VOC</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">CO₂</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.slice(0, 3).map((row, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-800">{row.location}</td>
                      <td className="py-2 px-3 text-gray-600">{row.aqi}</td>
                      <td className="py-2 px-3 text-gray-600">{row.voc} ppb</td>
                      <td className="py-2 px-3 text-gray-600">{row.co2} ppm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-center py-3 text-sm text-gray-500">
                + {sampleData.length - 3} more rows
              </div>
            </div>
          </div>

          {/* Format Information */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Format Information</h3>
            {exportFormat === 'csv' ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>CSV (Comma-Separated Values)</strong></p>
                <p>• Compatible with Excel, Google Sheets, and most data analysis tools</p>
                <p>• Contains all numeric data and timestamps</p>
                <p>• Easy to import into databases and statistical software</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>GeoJSON (Geographic JavaScript Object Notation)</strong></p>
                <p>• Standard format for geographic data exchange</p>
                <p>• Compatible with GIS software and mapping libraries</p>
                <p>• Includes coordinate information for spatial analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExport;