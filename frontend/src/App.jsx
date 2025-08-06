import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Login from './pages/Login'
import Menu from "./pages/Menu";
import GetNumber from "./pages/GetNumber";
import GetNumberOption from "./pages/GetNumberOption";
import GetNumberService from "./pages/GetNumberService";
import CallSystem from "./pages/CallSystem"
import ReceiveNumber from "./pages/ReceiveNumber";
import UserManagement from "./pages/UserManagement";
import { ReturnNumberDisplay } from "./components/ReturnNumberDisplay";
import {ReceiveNumberDisplay} from "./pages/ReceiveNumberDisplay";


function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/get-number-option" element={<GetNumberOption />} />
        <Route path="/get-number-service" element={<GetNumberService />} />
        <Route path="/get-number" element={<GetNumber />} />
        <Route path="/return-record-control" element={<CallSystem />} />
        <Route path="/return-record-display" element={<ReturnNumberDisplay />} />
        <Route path="/receive-number-control" element={<ReceiveNumber />} />
        <Route path="/receive-number-display" element={<ReceiveNumberDisplay />} />
        <Route path="/user-management" element={<UserManagement />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App
