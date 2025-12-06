import React, { useState, useRef, useEffect } from 'react';
import { Video, Square, Play, Wifi, WifiOff, Activity } from 'lucide-react';
import { backendService } from '../services/backendService';

interface LiveStreamingPanelProps {
  eventId: string;
  cameraId: string;
  onMetricsUpdate?: (metrics: any) => void;
}

const LiveStreamingPanel: React.FC<LiveStreamingPanelProps> = ({
  eventId,
  cameraId,
  onMetricsUpdate
}) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [frameCount, setFrameCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      stopStreaming();
      backendService.disconnectWebSocket();
    };
  }, []);

  const startStreaming = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      wsRef.current = backendService.connectWebSocket(
        eventId,
        handleWebSocketMessage,
        (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        },
        () => {
          setIsConnected(false);
        }
      );

      setIsConnected(true);
      setIsStreaming(true);

      intervalRef.current = setInterval(async () => {
        if (videoRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          try {
            const frameData = await backendService.captureFrameFromVideo(videoRef.current);
            backendService.sendFrame(frameData, cameraId, frameCount);
            setFrameCount(prev => prev + 1);
          } catch (err) {
            console.error('Failed to capture frame:', err);
          }
        }
      }, 1000);

    } catch (err) {
      console.error('Failed to start streaming:', err);
      alert('Camera access denied or not available');
    }
  };

  const stopStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    backendService.disconnectWebSocket();
    setIsStreaming(false);
    setIsConnected(false);
    setFrameCount(0);
  };

  const handleWebSocketMessage = (message: any) => {
    if (message.type === 'metrics_update') {
      setMetrics(message.data);
      if (onMetricsUpdate) {
        onMetricsUpdate(message.data);
      }
    } else if (message.type === 'alert') {
      console.log('Alert received:', message.data);
    } else if (message.type === 'connected') {
      console.log('WebSocket connected:', message.data);
    }
  };

  return (
    <div className="glass p-6 rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-400" />
          Live Camera Feed
        </h3>
        <div className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded ${
          isConnected ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'
        }`}>
          {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden border border-white/10">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <p className="text-slate-400 text-sm">Camera feed inactive</p>
            </div>
          )}
          {isStreaming && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              REC
            </div>
          )}
        </div>

        {metrics && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Count</p>
              <p className="text-2xl font-bold text-white">{metrics.count}</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Density</p>
              <p className="text-2xl font-bold text-white">{metrics.density?.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Risk</p>
              <p className={`text-2xl font-bold ${
                metrics.risk_score > 70 ? 'text-red-400' :
                metrics.risk_score > 40 ? 'text-yellow-400' : 'text-green-400'
              }`}>{Math.round(metrics.risk_score)}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {!isStreaming ? (
            <button
              onClick={startStreaming}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Streaming
            </button>
          ) : (
            <button
              onClick={stopStreaming}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              Stop Streaming
            </button>
          )}
        </div>

        {isStreaming && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Frames processed: {frameCount}</span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 animate-pulse" />
              Processing...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreamingPanel;
