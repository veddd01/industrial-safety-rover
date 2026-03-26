import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import TopNav from '@/components/dashboard/TopNav';
import GasMapPanel from '@/components/dashboard/GasMapPanel';
import RGBCameraPanel from '@/components/dashboard/RGBCameraPanel';
import ThermalPanel from '@/components/dashboard/ThermalPanel';
import SensorPanel from '@/components/dashboard/SensorPanel';
import { useRoverData } from '@/hooks/useRoverData';
import { Wind, Camera, Thermometer } from 'lucide-react';

interface CollapsiblePanelProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

const CollapsiblePanel = ({ title, icon, isOpen, onToggle, children, className = '' }: CollapsiblePanelProps) => (
  <div className={className}>
    {!isOpen ? (
      <button
        onClick={onToggle}
        className="glass-card rounded-xl w-full px-4 py-4 flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors h-full min-h-[60px]"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
    ) : (
      <div className="relative h-full">
        <button
          onClick={onToggle}
          className="absolute top-3 right-10 z-10 p-1 rounded-md hover:bg-secondary/50 transition-colors"
          title="Collapse"
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground rotate-180 transition-transform" />
        </button>
        {children}
      </div>
    )}
  </div>
);

const Dashboard = () => {
  const { sensorData, logs, gasMap, thermalMap, selectedGas, setSelectedGas, riskLevel } = useRoverData();
  const [openPanels, setOpenPanels] = useState({ gas: true, rgb: true, thermal: true });

  const toggle = (key: keyof typeof openPanels) =>
    setOpenPanels(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav isOnline={sensorData.isOnline} batteryLevel={sensorData.batteryLevel} />

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-fr">
        <CollapsiblePanel
          title="Gas Mapping"
          icon={<Wind className="w-4 h-4 text-primary" />}
          isOpen={openPanels.gas}
          onToggle={() => toggle('gas')}
          className={`lg:col-span-1 ${openPanels.gas ? 'min-h-[300px]' : ''}`}
        >
          <GasMapPanel gasMap={gasMap} selectedGas={selectedGas} onGasChange={setSelectedGas} />
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Live RGB Camera"
          icon={<Camera className="w-4 h-4 text-primary" />}
          isOpen={openPanels.rgb}
          onToggle={() => toggle('rgb')}
          className={`lg:col-span-1 ${openPanels.rgb ? 'min-h-[300px]' : ''}`}
        >
          <RGBCameraPanel fps={sensorData.fps} />
        </CollapsiblePanel>

        <div className="lg:row-span-2 min-h-[300px]">
          <SensorPanel
            gases={sensorData.gases}
            temperature={sensorData.temperature}
            humidity={sensorData.humidity}
            riskLevel={riskLevel}
            logs={logs}
          />
        </div>

        <CollapsiblePanel
          title="Thermal Imaging"
          icon={<Thermometer className="w-4 h-4 text-primary" />}
          isOpen={openPanels.thermal}
          onToggle={() => toggle('thermal')}
          className={`lg:col-span-2 ${openPanels.thermal ? 'min-h-[300px]' : ''}`}
        >
          <ThermalPanel
            thermalMap={thermalMap}
            thermalMax={sensorData.thermalMax}
            thermalMin={sensorData.thermalMin}
          />
        </CollapsiblePanel>
      </main>
    </div>
  );
};

export default Dashboard;
