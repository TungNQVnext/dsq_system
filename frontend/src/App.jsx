import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import Login from './pages/Login'
import Menu from "./pages/Menu";
import GetNumber from "./pages/GetNumber";
import GetNumberOption from "./pages/GetNumberOption";
import CallSystem from "./pages/CallSystem"
import Test from "./pages/Test"
import { TVDisplay } from "./components/TVDisplay";


function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/get-number-option" element={<GetNumberOption />} />
        <Route path="/get-number" element={<GetNumber />} />
        <Route path="/return-record-control" element={<CallSystem />} />
        <Route path="/return-record-display" element={<TVDisplay />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App
