import { Activity, AlertTriangle, Shield, ShieldAlert, Droplets, Thermometer, Wind } from 'lucide-react';
import type { GasReading, LogEntry } from '@/hooks/useRoverData';

interface SensorPanelProps {
  gases: GasReading[];
  temperature: number;
  humidity: number;
  riskLevel: 'safe' | 'warning' | 'danger';
  logs: LogEntry[];
}

const riskConfig = {
  safe: { icon: Shield, label: 'SAFE', color: 'text-safe', bg: 'bg-safe/10', border: 'border-safe/30' },
  warning: { icon: AlertTriangle, label: 'WARNING', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  danger: { icon: ShieldAlert, label: 'DANGER', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
};

const logTypeColors = {
  info: 'text-primary',
  warning: 'text-warning',
  danger: 'text-danger',
};

const SensorPanel = ({ gases, temperature, humidity, riskLevel, logs }: SensorPanelProps) => {
  const risk = riskConfig[riskLevel];
  const RiskIcon = risk.icon;

  return (
    <div className="glass-card rounded-xl p-4 flex flex-col h-full gap-4 overflow-hidden">
      {/* Risk Indicator */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${risk.bg} ${risk.border}`}>
        <RiskIcon className={`w-6 h-6 ${risk.color}`} />
        <div>
          <p className={`text-sm font-bold ${risk.color}`}>{risk.label}</p>
          <p className="text-[10px] text-muted-foreground">Risk Assessment</p>
        </div>
      </div>

      {/* Sensor Readings */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Sensor Readings</h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {gases.map((g) => {
            const ratio = g.value / g.threshold;
            const color = ratio > 1 ? 'text-danger' : ratio > 0.7 ? 'text-warning' : 'text-safe';
            return (
              <div key={g.name} className="bg-muted/50 rounded-lg p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Wind className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{g.name}</span>
                </div>
                <p className={`text-sm font-mono font-semibold ${color}`}>
                  {g.value.toFixed(1)} <span className="text-[9px] text-muted-foreground font-normal">{g.unit}</span>
                </p>
                {/* Bar */}
                <div className="h-1 bg-border rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${ratio > 1 ? 'bg-danger' : ratio > 0.7 ? 'bg-warning' : 'bg-safe'}`}
                    style={{ width: `${Math.min(100, ratio * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Temp & Humidity */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Temp</p>
              <p className="text-sm font-mono font-semibold text-foreground">{temperature.toFixed(1)}°C</p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Humidity</p>
              <p className="text-sm font-mono font-semibold text-foreground">{humidity.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Activity Log</h3>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-[10px] py-1 border-b border-border/30">
              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${logTypeColors[log.type] === 'text-primary' ? 'bg-primary' : log.type === 'warning' ? 'bg-warning' : 'bg-danger'}`} />
              <div className="min-w-0">
                <p className="text-muted-foreground truncate">{log.message}</p>
                <p className="text-muted-foreground/60 font-mono">
                  {log.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SensorPanel;
