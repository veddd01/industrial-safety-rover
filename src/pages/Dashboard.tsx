import TopNav from '@/components/dashboard/TopNav';
import GasMapPanel from '@/components/dashboard/GasMapPanel';
import RGBCameraPanel from '@/components/dashboard/RGBCameraPanel';
import ThermalPanel from '@/components/dashboard/ThermalPanel';
import SensorPanel from '@/components/dashboard/SensorPanel';
import { useRoverData } from '@/hooks/useRoverData';

const Dashboard = () => {
  const { sensorData, logs, gasMap, thermalMap, selectedGas, setSelectedGas, riskLevel } = useRoverData();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav isOnline={sensorData.isOnline} batteryLevel={sensorData.batteryLevel} />

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-fr">
        {/* Top-left: Gas Mapping */}
        <div className="lg:col-span-1 min-h-[300px]">
          <GasMapPanel gasMap={gasMap} selectedGas={selectedGas} onGasChange={setSelectedGas} />
        </div>

        {/* Top-right: RGB Camera */}
        <div className="lg:col-span-1 min-h-[300px]">
          <RGBCameraPanel fps={sensorData.fps} />
        </div>

        {/* Right panel spanning full height on large screens */}
        <div className="lg:row-span-2 min-h-[300px]">
          <SensorPanel
            gases={sensorData.gases}
            temperature={sensorData.temperature}
            humidity={sensorData.humidity}
            riskLevel={riskLevel}
            logs={logs}
          />
        </div>

        {/* Bottom-left: Thermal */}
        <div className="lg:col-span-2 min-h-[300px]">
          <ThermalPanel
            thermalMap={thermalMap}
            thermalMax={sensorData.thermalMax}
            thermalMin={sensorData.thermalMin}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
