import { Thermometer } from 'lucide-react';

interface ThermalPanelProps {
  thermalMap: number[][];
  thermalMax: number;
  thermalMin: number;
}

const getThermalColor = (temp: number, min: number, max: number): string => {
  const ratio = (temp - min) / (max - min);
  if (ratio < 0.25) return `hsl(240, 70%, ${30 + ratio * 80}%)`;
  if (ratio < 0.5) return `hsl(${240 - (ratio - 0.25) * 480}, 80%, 50%)`;
  if (ratio < 0.75) return `hsl(${120 - (ratio - 0.5) * 480}, 90%, 50%)`;
  return `hsl(${0}, ${85 + ratio * 15}%, ${55 - (ratio - 0.75) * 40}%)`;
};

const ThermalPanel = ({ thermalMap, thermalMax, thermalMin }: ThermalPanelProps) => {
  return (
    <div className="glass-card rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Thermal Imaging</h2>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {thermalMin.toFixed(1)}°C – {thermalMax.toFixed(1)}°C
        </span>
      </div>

      <div className="flex-1 flex gap-2 min-h-[200px]">
        <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
          <svg viewBox="0 0 16 12" className="w-full h-full" preserveAspectRatio="none">
            {thermalMap.map((row, y) =>
              row.map((temp, x) => (
                <rect
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  width={1.05}
                  height={1.05}
                  fill={getThermalColor(temp, thermalMin, thermalMax)}
                  opacity={0.9}
                />
              ))
            )}
          </svg>

          {/* Hotspot markers */}
          {thermalMap.flatMap((row, y) =>
            row.map((temp, x) => {
              if (temp > thermalMax - 5) {
                return (
                  <div
                    key={`hotspot-${x}-${y}`}
                    className="absolute w-1.5 h-1.5 border border-foreground rounded-full animate-pulse"
                    style={{
                      left: `${(x / 16) * 100}%`,
                      top: `${(y / 12) * 100}%`,
                    }}
                  />
                );
              }
              return null;
            })
          )}
        </div>

        {/* Temperature scale */}
        <div className="w-4 rounded-lg overflow-hidden flex flex-col relative">
          <div className="flex-1 rounded-lg" style={{
            background: 'linear-gradient(to bottom, hsl(0 90% 45%), hsl(60 90% 50%), hsl(120 80% 50%), hsl(240 70% 45%))'
          }} />
          <div className="absolute top-0 left-6 text-[9px] text-muted-foreground font-mono whitespace-nowrap">
            {thermalMax.toFixed(0)}°C
          </div>
          <div className="absolute bottom-0 left-6 text-[9px] text-muted-foreground font-mono whitespace-nowrap">
            {thermalMin.toFixed(0)}°C
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThermalPanel;
