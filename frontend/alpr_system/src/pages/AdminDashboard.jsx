import { Routes, Route } from 'react-router-dom'
import Layout from '../components/common/Layout'
import LiveMonitor from '../components/staff/LiveMonitor'
import UserManagement from '../components/admin/UserManagement'
import VehicleApprovals from '../components/admin/VehicleApprovals'
import SystemSettings from '../components/admin/SystemSettings'
import HistoricalLogs from '../components/staff/HistoricalLogs'
import ParkingOccupancy from '../components/staff/ParkingOccupancy'
import CameraPanel from '../components/staff/CameraPanel'

function Overview() {
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

export default function AdminDashboard() {
  return (
    <Layout title="Admin Panel">
      <Routes>
        <Route index            element={<Overview />} />
        <Route path="users"     element={<UserManagement />} />
        <Route path="vehicles"  element={<VehicleApprovals />} />
        <Route path="logs"      element={<HistoricalLogs />} />
        <Route path="settings"  element={<SystemSettings />} />
      </Routes>
    </Layout>
  )
}