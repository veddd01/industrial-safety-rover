import { Camera, Scan } from 'lucide-react';

interface RGBCameraPanelProps {
  fps: number;
}

const RGBCameraPanel = ({ fps }: RGBCameraPanelProps) => {
  return (
    <div className="glass-card rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Live RGB Camera</h2>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          <span className="text-[10px] text-danger font-medium">LIVE</span>
        </div>
      </div>

      <div className="flex-1 relative bg-muted rounded-lg overflow-hidden min-h-[200px] flex items-center justify-center">
        {/* Simulated camera feed */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-secondary to-muted">
          {/* Simulated scene elements */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="grid grid-cols-4 gap-4 p-8 w-full h-full">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-border/40 rounded-sm" />
              ))}
            </div>
          </div>

          {/* Detection bounding box */}
          <div className="absolute top-[20%] left-[25%] w-[30%] h-[40%] border-2 border-primary rounded-sm">
            <div className="absolute -top-5 left-0 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-sm font-medium">
              Obstacle 92%
            </div>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-primary" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-primary" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-primary" />
          </div>

          {/* Second detection */}
          <div className="absolute top-[50%] right-[15%] w-[20%] h-[25%] border border-warning rounded-sm">
            <div className="absolute -top-5 left-0 bg-warning text-warning-foreground text-[9px] px-1.5 py-0.5 rounded-sm font-medium">
              Pipe 78%
            </div>
          </div>

          {/* Crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Scan className="w-12 h-12 text-primary/20" />
          </div>
        </div>

        {/* Overlays */}
        <div className="absolute top-2 left-2 bg-background/70 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-muted-foreground font-mono">
          {fps} FPS
        </div>
        <div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-muted-foreground font-mono">
          640×480
        </div>
        <div className="absolute bottom-2 left-2 bg-background/70 backdrop-blur-sm rounded px-2 py-1 text-[10px] text-muted-foreground font-mono">
          ESP32-CAM
        </div>
      </div>
    </div>
  );
};

export default RGBCameraPanel;
