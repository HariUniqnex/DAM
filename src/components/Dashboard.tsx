import { useState, useEffect } from 'react';
import {
  BarChart3, Image, CheckCircle2, Clock, TrendingUp,
  RefreshCw, Crop, Eraser, Sparkles, Grid3x3, Palette,
  Minimize2, FileImage, Droplets, Box, Video, Settings2
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProcessingStats {
  totalImagesUploaded: number;
  totalImagesProcessed: number;
  operationCounts: Record<string, number>;
  recentOperations: RecentOperation[];
}

interface RecentOperation {
  id: string;
  operationType: string;
  status: string;
  createdAt: string;
  processingTimeMs: number | null;
}

const OPERATION_ICONS: Record<string, any> = {
  'resize': Minimize2,
  'bg-remove': Eraser,
  'retouch': Sparkles,
  'crop': Crop,
  'compress': Minimize2,
  'lifestyle': Image,
  'infographic': Grid3x3,
  'line-diagram': FileImage,
  'swatch': Palette,
  'color-analysis': Droplets,
  '3d-model': Box,
  '360-spin': Video,
  'recolor': Palette,
  'configurator': Settings2,
  'pdf-extract': FileImage
};

const OPERATION_LABELS: Record<string, string> = {
  'resize': 'Image Resizing',
  'bg-remove': 'Background Removal',
  'retouch': 'Image Retouch',
  'crop': 'Image Cropping',
  'compress': 'Image Compression',
  'lifestyle': 'Lifestyle Creation',
  'infographic': 'Infographic Creation',
  'line-diagram': 'Line Diagram',
  'swatch': 'Material Swatch',
  'color-analysis': 'Color Analysis',
  '3d-model': '3D Modeling',
  '360-spin': '360° Product Spin',
  'recolor': 'Image Re-coloring',
  'configurator': '3D Configurator',
  'pdf-extract': 'PDF Extraction'
};

export function Dashboard() {
  const [stats, setStats] = useState<ProcessingStats>({
    totalImagesUploaded: 0,
    totalImagesProcessed: 0,
    operationCounts: {},
    recentOperations: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatistics = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data: statsData } = await supabase
        .from('processing_statistics')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: recentOps } = await supabase
        .from('image_processing_operations')
        .select('id, operation_type, status, created_at, processing_time_ms')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setStats({
        totalImagesUploaded: statsData?.total_images_uploaded || 0,
        totalImagesProcessed: statsData?.total_images_processed || 0,
        operationCounts: statsData?.operation_counts || {},
        recentOperations: recentOps?.map(op => ({
          id: op.id,
          operationType: op.operation_type,
          status: op.status,
          createdAt: op.created_at,
          processingTimeMs: op.processing_time_ms
        })) || []
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'processing': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'processing': return RefreshCw;
      default: return Clock;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const sortedOperations = Object.entries(stats.operationCounts)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Overview of your image processing activities</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="font-medium text-slate-700">Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Image className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Uploaded</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.totalImagesUploaded}</p>
          <p className="text-sm text-slate-500 mt-2">Images uploaded to platform</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Total Processed</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.totalImagesProcessed}</p>
          <p className="text-sm text-slate-500 mt-2">Successfully completed operations</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-sm font-medium text-slate-600 mb-1">Operation Types</h3>
          <p className="text-3xl font-bold text-slate-900">{sortedOperations.length}</p>
          <p className="text-sm text-slate-500 mt-2">Different processing types used</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Operations by Type</h2>
        {sortedOperations.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No operations yet. Start by uploading and processing images.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedOperations.map(([operationType, count]) => {
              const Icon = OPERATION_ICONS[operationType] || FileImage;
              const label = OPERATION_LABELS[operationType] || operationType;

              return (
                <div
                  key={operationType}
                  className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Operations</h2>
        {stats.recentOperations.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No recent operations to display.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentOperations.map((operation) => {
              const StatusIcon = getStatusIcon(operation.status);
              const Icon = OPERATION_ICONS[operation.operationType] || FileImage;
              const label = OPERATION_LABELS[operation.operationType] || operation.operationType;

              return (
                <div
                  key={operation.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <Icon className="w-5 h-5 text-slate-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(operation.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {operation.processingTimeMs && (
                      <span className="text-xs text-slate-500">
                        {(operation.processingTimeMs / 1000).toFixed(2)}s
                      </span>
                    )}
                    <span className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(operation.status)}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${operation.status === 'processing' ? 'animate-spin' : ''}`} />
                      <span className="capitalize">{operation.status}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
