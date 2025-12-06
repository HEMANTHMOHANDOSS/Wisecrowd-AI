import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader, BarChart3 } from 'lucide-react';
import { backendService } from '../services/backendService';

interface JobMonitorProps {
  jobId: string;
  onComplete?: (result: any) => void;
}

const JobMonitor: React.FC<JobMonitorProps> = ({ jobId, onComplete }) => {
  const [job, setJob] = useState<any>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const jobData = await backendService.getJobStatus(jobId);
        setJob(jobData);

        if (jobData.status === 'completed' || jobData.status === 'failed') {
          setPolling(false);
          if (jobData.status === 'completed' && onComplete) {
            onComplete(jobData.result ? JSON.parse(jobData.result) : null);
          }
        }
      } catch (err) {
        console.error('Failed to fetch job status:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, polling, onComplete]);

  if (!job) {
    return (
      <div className="glass p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-400 animate-spin" />
          <span className="text-slate-300">Loading job status...</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-400" />;
      case 'processing':
        return <Loader className="w-6 h-6 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'failed':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'processing':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
      default:
        return 'bg-slate-700/20 border-slate-700/30 text-slate-400';
    }
  };

  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-slate-900/50 rounded-xl">
          {getStatusIcon()}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white">Video Processing Job</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded border ${getStatusColor()}`}>
              {job.status.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-slate-500 font-mono mb-4">Job ID: {jobId.slice(0, 16)}...</p>

          {job.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className="text-blue-400 font-bold">{Math.round(job.progress)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}

          {job.status === 'completed' && job.result && (
            <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-green-500/20">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-green-400" />
                Analysis Results
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {JSON.parse(job.result).current_count !== undefined && (
                  <div>
                    <span className="text-slate-500">Current Count:</span>
                    <span className="ml-2 text-white font-bold">{JSON.parse(job.result).current_count}</span>
                  </div>
                )}
                {JSON.parse(job.result).peak_count !== undefined && (
                  <div>
                    <span className="text-slate-500">Peak Count:</span>
                    <span className="ml-2 text-white font-bold">{JSON.parse(job.result).peak_count}</span>
                  </div>
                )}
                {JSON.parse(job.result).risk_score !== undefined && (
                  <div>
                    <span className="text-slate-500">Risk Score:</span>
                    <span className="ml-2 text-white font-bold">{JSON.parse(job.result).risk_score.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {job.status === 'failed' && job.error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{job.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobMonitor;
