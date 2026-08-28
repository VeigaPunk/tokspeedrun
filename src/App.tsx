import { Routes, Route } from 'react-router'
import { Toaster } from "@/components/ui/sonner"
import Home from './pages/Home'
import Board from './pages/Board'
import RunDetail from './pages/RunDetail'
import Submit from './pages/Submit'
import Admin from './pages/Admin'
import Login from "./pages/Login"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/board" element={<Board />} />
        <Route path="/runs/:id" element={<RunDetail />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster theme="dark" />
    </>
  )
}
