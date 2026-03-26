import { Wind } from 'lucide-react';
import type { GasMapPoint } from '@/hooks/useRoverData';

interface GasMapPanelProps {
  gasMap: GasMapPoint[];
  selectedGas: string;
  onGasChange: (gas: string) => void;
}

const gasOptions = ['CO', 'CH₄', 'H₂S', 'O₂'];

const getColor = (value: number): string => {
  if (value < 30) return `hsl(142, 71%, ${45 - value * 0.3}%)`;
  if (value < 60) return `hsl(${52 - (value - 30) * 0.5}, 90%, 50%)`;
  return `hsl(${15 - (value - 60) * 0.375}, 85%, ${55 - (value - 60) * 0.15}%)`;
};

const GasMapPanel = ({ gasMap, selectedGas, onGasChange }: GasMapPanelProps) => {
  return (
    <div className="glass-card rounded-xl p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Gas Mapping</h2>
        </div>
        <select
          value={selectedGas}
          onChange={(e) => onGasChange(e.target.value)}
          className="bg-secondary text-secondary-foreground text-xs rounded-md px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {gasOptions.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 relative bg-muted rounded-lg overflow-hidden min-h-[200px]">
        <svg viewBox="0 0 20 15" className="w-full h-full" preserveAspectRatio="none">
          {gasMap.map((p, i) => (
            <rect
              key={i}
              x={p.x}
              y={p.y}
              width={1.05}
              height={1.05}
              fill={getColor(p.value)}
              opacity={0.85}
            />
          ))}
        </svg>
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border) / 0.15) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border) / 0.15) 1px, transparent 1px)`,
            backgroundSize: '5% 6.66%',
          }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] text-muted-foreground">Low</span>
        <div className="flex-1 h-2 rounded-full" style={{
          background: 'linear-gradient(to right, hsl(142 71% 45%), hsl(48 90% 50%), hsl(0 85% 50%))'
        }} />
        <span className="text-[10px] text-muted-foreground">High</span>
      </div>
    </div>
  );
};

export default GasMapPanel;
