import LiveMonitor from './LiveMonitor'
import ParkingOccupancy from './ParkingOccupancy'

export default function LiveFeedPanel() {
  return (
    <div className="flex flex-col gap-6">
      <ParkingOccupancy />
      <LiveMonitor />
    </div>
  )
}