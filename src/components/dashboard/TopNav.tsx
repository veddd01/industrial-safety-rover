import { Wifi, WifiOff, BatteryMedium, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TopNavProps {
  isOnline: boolean;
  batteryLevel: number;
}

const TopNav = ({ isOnline, batteryLevel }: TopNavProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="glass-card border-b border-border/50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
        <h1 className="text-lg font-semibold tracking-wide text-foreground">
          Industrial Safety Rover Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-6 text-sm">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4 text-safe" />
              <span className="text-safe font-medium">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-danger" />
              <span className="text-danger font-medium">Offline</span>
            </>
          )}
        </div>

        {/* Battery */}
        <div className="flex items-center gap-2">
          <BatteryMedium className={`w-4 h-4 ${batteryLevel < 20 ? 'text-danger' : batteryLevel < 50 ? 'text-warning' : 'text-safe'}`} />
          <span className="text-muted-foreground">{Math.round(batteryLevel)}%</span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground font-mono text-xs">
            {time.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
