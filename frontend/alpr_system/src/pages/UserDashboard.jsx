import { Routes, Route } from 'react-router-dom'
import Layout from '../components/common/Layout'
import Dashboard from '../components/user/Dashboard'
import VehicleList from '../components/user/VehicleList'
import ParkingHistory from '../components/user/ParkingHistory'

export default function UserDashboard() {
  return (
    <Layout title="My Parking">
      <Routes>
        <Route index          element={<Dashboard />} />
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="history"  element={<ParkingHistory />} />
      </Routes>
    </Layout>
  )
}