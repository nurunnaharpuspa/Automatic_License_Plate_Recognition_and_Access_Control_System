import { Routes, Route } from 'react-router-dom'
import Layout from '../components/common/Layout'
import CameraPanel from '../components/staff/CameraPanel'
import LiveFeedPanel from '../components/staff/LiveFeedPanel'
import LiveMonitor from '../components/staff/LiveMonitor'
import ParkingOccupancy from '../components/staff/ParkingOccupancy'
import CorrectionQueue from '../components/staff/CorrectionQueue'
import HistoricalLogs from '../components/staff/HistoricalLogs'
import GuestEntry from '../components/staff/GuestEntry'
import UserManagement from '../components/admin/UserManagement'
import VehicleApprovals from '../components/admin/VehicleApprovals'
import UnregisteredQueue from '../components/staff/UnregisteredQueue'

function LivePage() {
  return (
    <>
    <div className='mb-2'>
      <LiveMonitor />
    </div>
    
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      {/* left — camera inputs */}
      <div className="card">
        <CameraPanel />
      </div>
      {/* right — live feed + occupancy */}
      <div>
        <ParkingOccupancy />
      </div>
    </div>
    </>
  )
}

export default function StaffDashboard() {
  return (
    <Layout title="Staff Console">
      <Routes>
        <Route index          element={<LivePage />} />
        <Route path="queue"   element={<CorrectionQueue />} />
        <Route path="unregistered" element={<UnregisteredQueue />} />
        <Route path="guest"   element={<GuestEntry />} />
        <Route path="users"   element={<UserManagement />} />
        <Route path="logs"    element={<HistoricalLogs />} />

      </Routes>
    </Layout>
  )
}