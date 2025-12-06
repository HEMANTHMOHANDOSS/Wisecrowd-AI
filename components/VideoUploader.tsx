import React, { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { backendService } from '../services/backendService';

interface VideoUploaderProps {
  eventId: string;
  cameraId?: string;
  onUploadComplete?: (jobId: string) => void;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ eventId, cameraId, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
        setUploadStatus('idle');
        setError(null);
      } else {
        setError('Please select a valid video file');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('uploading');
    setError(null);

    try {
      const result = await backendService.uploadVideo(selectedFile, eventId, cameraId);
      setJobId(result.job_id);
      setUploadStatus('success');

      if (onUploadComplete) {
        onUploadComplete(result.job_id);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass p-6 rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-400" />
        Upload Video for Analysis
      </h3>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="video-upload"
            disabled={uploading}
          />
          <label
            htmlFor="video-upload"
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-blue-500 transition-colors bg-slate-900/50"
          >
            {selectedFile ? (
              <div className="flex items-center gap-3 text-slate-300">
                <File className="w-6 h-6 text-blue-400" />
                <div>
                  <p className="font-bold">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Click to select video file</p>
                <p className="text-slate-600 text-xs mt-1">MP4, MOV, AVI supported</p>
              </div>
            )}
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {uploadStatus === 'success' && jobId && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4" />
            Upload successful! Job ID: {jobId.slice(0, 8)}...
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload & Process
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VideoUploader;
