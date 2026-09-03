import { Camera, Scan } from 'lucide-react';

interface RGBCameraPanelProps {
  fps: number;
}

const CAMERA_URL = import.meta.env.VITE_CAMERA_STREAM_URL || '';

const RGBCameraPanel = ({ fps }: RGBCameraPanelProps) => {
  return (
    <div className="glass-card rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Live RGB Camera</h2>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${CAMERA_URL ? 'bg-danger animate-pulse' : 'bg-muted-foreground'}`} />
          <span className={`text-[10px] font-medium ${CAMERA_URL ? 'text-danger' : 'text-muted-foreground'}`}>
            {CAMERA_URL ? 'LIVE' : 'NOT CONFIGURED'}
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-muted rounded-lg overflow-hidden min-h-[200px] flex items-center justify-center">
        {CAMERA_URL ? (
          <img
            src={CAMERA_URL}
            alt="ESP32-CAM live feed"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center px-6 gap-2">
            <Camera className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">ESP32-CAM stream is not configured.</p>
            <p className="text-[10px] text-muted-foreground/70">Set VITE_CAMERA_STREAM_URL in the frontend environment.</p>
          </div>
        )}

        {/* Crosshair */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Scan className="w-12 h-12 text-primary/20" />
        </div>

        <div className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-muted-foreground font-mono">
          {fps > 0 ? `${fps} FPS` : '-- FPS'}
        </div>
        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-muted-foreground font-mono">
          ESP32-CAM
        </div>
      </div>
    </div>
  );
};

export default RGBCameraPanel;
