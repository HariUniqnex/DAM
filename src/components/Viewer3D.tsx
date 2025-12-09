import { useEffect, useRef, useState } from 'react';
import { Maximize2, Download, RotateCcw } from 'lucide-react';

interface Viewer3DProps {
  modelUrl?: string;
  usdzUrl?: string;
}

export function Viewer3D({ modelUrl, usdzUrl }: Viewer3DProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!modelUrl) {
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
    document.head.appendChild(script);

    script.onload = () => setIsLoading(false);
    script.onerror = () => {
      setError('Failed to load 3D viewer');
      setIsLoading(false);
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [modelUrl]);

  if (!modelUrl) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">3D Viewer</h2>
        <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Maximize2 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No 3D model loaded</p>
            <p className="text-slate-500 text-sm mt-1">Upload images and generate a 3D model to view it here</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">3D Viewer</h2>
        <div className="aspect-square bg-red-50 rounded-lg flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-slate-900">3D Viewer</h2>
        <div className="flex items-center space-x-2">
          {usdzUrl && (
            <a
              href={usdzUrl}
              download
              className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center space-x-2 text-sm"
            >
              <Download className="w-4 h-4" />
              <span>USDZ</span>
            </a>
          )}
          <a
            href={modelUrl}
            download
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>GLB</span>
          </a>
        </div>
      </div>

      <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden" ref={viewerRef}>
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <RotateCcw className="w-8 h-8 text-slate-400 animate-spin" />
          </div>
        ) : (
          <model-viewer
            src={modelUrl}
            ios-src={usdzUrl}
            alt="3D model"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            touch-action="pan-y"
            auto-rotate
            shadow-intensity="1"
            style={{ width: '100%', height: '100%' }}
          />
        )}
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>AR Ready:</strong> Click the AR button or scan with your phone to view in augmented reality.
        </p>
      </div>
    </div>
  );
}
