import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

const EXPORTS = [
  {
    key: 'allocation',
    label: 'Mentor-Student Allocation',
    description: 'Download a CSV of all accepted mentor-student allocations with project details.',
    endpoint: '/admin/export/allocation',
    filename: 'allocation-report.csv',
  },
  {
    key: 'internal',
    label: 'Internal Marks Report',
    description: 'Download evaluation marks submitted by mentors for each student.',
    endpoint: '/admin/export/internal-marks',
    filename: 'internal-marks.csv',
  },
  {
    key: 'presentation',
    label: 'Presentation Marks Report',
    description: 'Download presentation evaluation scores from faculty panels.',
    endpoint: '/admin/export/presentation-marks',
    filename: 'presentation-marks.csv',
  },
  {
    key: 'final',
    label: 'Final Consolidated Report',
    description: 'Download a consolidated report combining allocation, internal, and presentation data.',
    endpoint: '/admin/export/final-report',
    filename: 'final-report.csv',
  },
];

export default function ExportsAdmin() {
  const [downloading, setDownloading] = useState(null);
  const [results, setResults] = useState({});

  const handleDownload = async (exp) => {
    setDownloading(exp.key);
    setResults((p) => ({ ...p, [exp.key]: null }));

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api${exp.endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        const data = await res.json();
        // Convert JSON array to CSV
        if (Array.isArray(data) && data.length > 0) {
          const headers = Object.keys(data[0]);
          const csv = [
            headers.join(','),
            ...data.map((row) => headers.map((h) => {
              const val = row[h];
              if (typeof val === 'string' && (val.includes(',') || val.includes('"')))
                return `"${val.replace(/"/g, '""')}"`;
              return val ?? '';
            }).join(',')),
          ].join('\n');
          downloadBlob(csv, exp.filename, 'text/csv');
        } else {
          downloadBlob(JSON.stringify(data, null, 2), exp.filename.replace('.csv', '.json'), 'application/json');
        }
      } else {
        const blob = await res.blob();
        downloadBlob(blob, exp.filename, contentType);
      }
      setResults((p) => ({ ...p, [exp.key]: 'success' }));
    } catch (e) {
      setResults((p) => ({ ...p, [exp.key]: 'error' }));
    } finally {
      setDownloading(null);
    }
  };

  const downloadBlob = (content, filename, type) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Export Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Download CSV reports for allocation, marks, and evaluations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORTS.map((exp) => (
          <div key={exp.key} className="card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-muj-orange/10 text-muj-orange flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-semibold">{exp.label}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">{exp.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleDownload(exp)}
                disabled={downloading === exp.key}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {downloading === exp.key ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Downloading…</>
                ) : (
                  <><Download className="w-4 h-4" /> Download</>
                )}
              </button>
              {results[exp.key] === 'success' && <span className="text-green-600 text-xs font-medium">✓ Downloaded</span>}
              {results[exp.key] === 'error' && <span className="text-red-600 text-xs font-medium">✗ Failed</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
