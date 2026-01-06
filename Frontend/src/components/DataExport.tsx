import React, { useState } from 'react';
import { Download, FileText, MapPin, CheckCircle, Calendar, Filter } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

type ExportFormat = 'csv' | 'geojson';

interface PreviewRow {
  _id: string;
  timestamp: string;
  air?: {
    aqi?: number;
    co2ppm?: number;
  };
  environment?: {
    temperature?: number;
    humidity?: number;
  };
  location?: {
    lat?: number;
    lng?: number;
    context?: string;
  };
}

const DataExport: React.FC = () => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState('7days');
  const [selectedMetrics, setSelectedMetrics] = useState(['aqi', 'voc', 'co2']);
  const [isExporting, setIsExporting] = useState(false);
  const [totalMatches, setTotalMatches] = useState<number | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [recipeName, setRecipeName] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [runUrl, setRunUrl] = useState<string | null>(null);
  const { showToast } = useToast();

  const metrics = [
    { id: 'aqi', label: 'Air Quality Index', icon: FileText },
    { id: 'voc', label: 'VOC Levels', icon: Filter },
    { id: 'co2', label: 'CO₂ Concentration', icon: Filter },
    { id: 'location', label: 'Location Data', icon: MapPin },
  ];

  const getRange = () => {
    const now = new Date();
    const to = now.toISOString();
    const fromDate = new Date(now);

    if (dateRange === '24hours') {
      fromDate.setDate(fromDate.getDate() - 1);
    } else if (dateRange === '7days') {
      fromDate.setDate(fromDate.getDate() - 7);
    } else if (dateRange === '30days') {
      fromDate.setDate(fromDate.getDate() - 30);
    } else if (dateRange === '90days') {
      fromDate.setDate(fromDate.getDate() - 90);
    }

    const from = fromDate.toISOString();
    return { from, to };
  };

  const selectedFields = () => {
    const base = ['timestamp', 'deviceId', 'location.lat', 'location.lng'];
    const extra: string[] = [];
    if (selectedMetrics.includes('aqi')) extra.push('air.aqi');
    if (selectedMetrics.includes('co2')) extra.push('air.co2ppm');
    if (selectedMetrics.includes('voc')) extra.push('aiFeatures.vocAvg');
    if (selectedMetrics.includes('location')) {
      extra.push('location.context', 'location.lat', 'location.lng');
    }
    return Array.from(new Set([...base, ...extra]));
  };

  const handleExport = async (format: ExportFormat) => {
    if (format === 'geojson') {
      showToast('GeoJSON export will be enabled soon.', 'info');
      return;
    }

    try {
      setIsExporting(true);
      const { from, to } = getRange();
      const params = new URLSearchParams({
        from,
        to,
        context: 'indoor',
      });

      const res = await fetch(
        `http://localhost:5000/api/exports/readings?${params.toString()}`
      );

      if (!res.ok) {
        let errBody: any = {};
        try {
          errBody = await res.json();
        } catch {
          /* ignore */
        }
        showToast(errBody.error || 'Export failed', 'error');
        setIsExporting(false);
        return;
      }

      let data: any = {};
      try {
        data = await res.json();
        setTotalMatches(data.totalMatches ?? 0);
        setPreviewRows(data.previewSample ?? []);
      } catch {
        /* ignore preview errors */
      }

      const csvUrl = `http://localhost:5000/api/exports/readings/csv?${params.toString()}`;
      window.location.href = csvUrl;

      showToast(
        `Downloading ${(data && data.totalMatches) ?? 0} readings as CSV with current filter.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('Network error while preparing export.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateRecipe = async () => {
    if (!recipeName.trim()) {
      showToast('Please enter a recipe name.', 'error');
      return;
    }

    if (!emailTo.trim()) {
      showToast('Please enter an email for daily reports.', 'error');
      return;
    }

    try {
      const { from, to } = getRange();

      const body = {
        name: recipeName.trim(),
        questionText: '',
        deviceId: 'ATMOSTRACK-01',
        context: 'indoor',
        timeRange: { from, to },
        fields: selectedFields(),
        format: 'csv',
        language: 'python',
        delivery: {
          emailEnabled: true,
          emailTo: emailTo.trim(),
          driveEnabled: false,
          driveType: null,
          drivePath: null,
        },
      };

      const res = await fetch('http://localhost:5000/api/exports/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        showToast(data.error || 'Failed to create recipe.', 'error');
        return;
      }

      setRunUrl(data.runUrl);
      showToast('Export recipe created. Daily automation will use this recipe.', 'success');

      // Tell backend to subscribe this email + kick n8n webhook once
      try {
        await fetch('http://localhost:5000/api/exports/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailTo.trim(),
            exports: {
              co2Digest: true,
              emissionsLedger: false,
              sourceDebug: false,
            },
            runUrl: data.runUrl,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while creating recipe.', 'error');
    }
  };

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metricId) ? prev.filter((id) => id !== metricId) : [...prev, metricId]
    );
  };

  return (
    <div className="pt-16 p-6 space-y-8 animate-fade-in min-h-screen bg-gradient-to-br from-cream-50 to-orange-50">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Data Export Center</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Export AtmosTrack readings with researcher-friendly filters and previews.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Export Configuration</h2>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Format Selection</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportFormat('csv')}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02]
                  ${
                    exportFormat === 'csv'
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
                  ${
                    exportFormat === 'geojson'
                      ? 'border-orange-400 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }
                `}
              >
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">GeoJSON</div>
                <div className="text-sm opacity-75">Geographic data format (soon)</div>
              </button>
            </div>
          </div>

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

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Export Actions</h2>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Create Export Recipe</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipe name
                </label>
                <input
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="e.g. Daily Indoor CO₂ Digest"
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (required for daily reports)
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                />
              </div>

              <button
                onClick={handleCreateRecipe}
                disabled={isExporting}
                className={`
                  w-full p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl
                  font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200
                  ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                  flex items-center justify-center space-x-2
                `}
              >
                <CheckCircle className="h-5 w-5" />
                <span>Start daily automation emails</span>
              </button>

              {runUrl && (
                <div className="mt-2 text-xs text-gray-600 break-all bg-gray-50 border border-dashed border-gray-200 rounded-lg p-2">
                  <div className="font-semibold mb-1">Automation URL (for backend/n8n):</div>
                  <div>{runUrl}</div>
                </div>
              )}
            </div>
          </div>

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
                  <span>Preparing filter...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>Download CSV</span>
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
              <Download className="h-5 w-5" />
              <span>Export as GeoJSON (coming soon)</span>
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Preview</h3>
            <p className="text-sm text-gray-500 mb-4">
              {totalMatches === null
                ? 'Run an export to see matching readings.'
                : `Found ${totalMatches} readings. Showing latest ${previewRows.length} for this filter.`}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Timestamp</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">AQI</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">CO₂ (ppm)</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Temp (°C)</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-600">Humidity (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row._id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium text-gray-800">
                        {new Date(row.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-gray-600">{row.air?.aqi ?? '—'}</td>
                      <td className="py-2 px-3 text-gray-600">{row.air?.co2ppm ?? '—'}</td>
                      <td className="py-2 px-3 text-gray-600">
                        {row.environment?.temperature ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-gray-600">
                        {row.environment?.humidity ?? '—'}
                      </td>
                    </tr>
                  ))}
                  {previewRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-400">
                        No preview yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-cream-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Format Information</h3>
            {exportFormat === 'csv' ? (
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>CSV (Comma-Separated Values)</strong>
                </p>
                <p>• Compatible with Excel, Python/pandas, R, and most tools.</p>
                <p>• Perfect for reproducible analysis workflows.</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <strong>GeoJSON (coming soon)</strong>
                </p>
                <p>• Standard format for geographic data and mapping tools.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExport;
