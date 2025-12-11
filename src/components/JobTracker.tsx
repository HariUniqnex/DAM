import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/api";

interface Job {
  id: string;
  type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
  input_data: any;
}

export function JobTracker() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "processing":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-100 text-green-700",
      failed: "bg-red-100 text-red-700",
      processing: "bg-blue-100 text-blue-700",
      pending: "bg-slate-100 text-slate-700",
    };

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status}
      </span>
    );
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      segment: "Segmentation",
      stain: "Stain Recolor",
      "3d": "3D Generation",
      render: "360° Render",
      export: "Export",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-4">
        Processing Jobs
      </h2>
      <p className="text-slate-600 mb-6">
        Track the status of your image processing, 3D generation, and rendering
        jobs.
      </p>

      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">No jobs yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Upload images and start processing to see jobs here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-0.5">{getStatusIcon(job.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {getJobTypeLabel(job.type)}
                      </h3>
                      {getStatusBadge(job.status)}
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      Created: {new Date(job.created_at).toLocaleString()}
                    </p>
                    {job.completed_at && (
                      <p className="text-sm text-slate-600 mb-2">
                        Completed: {new Date(job.completed_at).toLocaleString()}
                      </p>
                    )}
                    {job.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        {job.error_message}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-mono ml-4">
                  {job.id.slice(0, 8)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> This is a demonstration interface. In
          production, jobs would be processed by GPU workers with OpenAI models,
          photogrammetry tools, and Blender rendering.
        </p>
      </div>
    </div>
  );
}
