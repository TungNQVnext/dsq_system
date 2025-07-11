import React, { useState } from 'react';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { LANGUAGES } from "../constants/constants";

const ReceiveNumber = () => {
  const [currentNumber] = useState({
    number: 'A001',
    service: 'Visa',
    nationality: 'Việt Nam',
    startTime: '09:30',
    status: 'serving'
  });

  // Queue items data
  const [queueItems] = useState([
    {
      number: 'B001',
      nationality: 'Việt Nam',
      counter: 1,
      priorityClass: 'priority'
    },
    {
      number: 'A003',
      nationality: 'Quốc tịch khác',
      counter: 2,
      priorityClass: 'normal'
    },
    {
      number: 'C001',
      nationality: 'Việt Nam',
      counter: 1,
      priorityClass: 'urgent'
    },
    {
      number: 'A004',
      nationality: 'Việt Nam',
      counter: 1,
      priorityClass: 'normal'
    },
    {
      number: 'C001',
      nationality: 'Việt Nam',
      counter: 1,
      priorityClass: 'urgent'
    },
    {
      number: 'C001',
      nationality: 'Việt Nam',
      counter: 1,
      priorityClass: 'urgent'
    },
    {
      number: 'C001',
      nationality: 'Việt Nam',
      counter: 1,
      priorityClass: 'urgent'
    },
  ]);

  const [waitingCount] = useState(5);
  const [completedCount] = useState(0);
  const [finishedCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("vietnamese+japanese");

 

    return (
    <div className='min-h-screen flex flex-col'>
      <Header/>
      
      {/* Title Section */}
      <div className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Hệ thống nhận hồ sơ
            </h1>
          </div>
          
          <div className="flex justify-center items-center gap-8">
            {/* Cửa dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">Cửa:</span>
              <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            
            {/* Giọng nói section */}
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium">Giọng nói:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(LANGUAGES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - Takes remaining space */}
      <div className="flex-1 flex-col font-sans">
        {/* Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-6 max-w-7xl mx-auto w-full">
          {/* Left Panel - Queue List */}
          <div className="flex flex-col">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Danh sách số (5 số)
                </h2>
                <div className="flex gap-3">
                 
                  <select className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Tất cả quốc tịch</option>
                    <option>Việt Nam</option>
                    <option>Quốc tịch khác</option>
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button className="flex-1 px-4 py-3 text-sm font-medium text-blue-600 bg-white border-b-2 border-blue-600">
                  Hàng đợi sẵn sàng ({waitingCount})
                </button>
                <button className="flex-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
                  Đã bỏ qua ({completedCount})
                </button>
                <button className="flex-1 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent">
                  Đã hoàn tất ({finishedCount})
                </button>
              </div>

              {/* Queue Items */}
              <div className="max-h-96 overflow-y-auto">
                {queueItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-6 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-blue-600 min-w-[60px]">
                        {item.number}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="font-semibold text-gray-900 text-sm">
                          {item.service}
                        </div>
                        <div className="text-xs text-gray-600">
                          {item.nationality}
                        </div>
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Current Serving */}
          <div className="flex flex-col">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Số đang xử lý
              </h2>
              
              {/* Current Number Display */}
              <div className="text-center mb-8 p-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="text-6xl font-black text-blue-700 mb-4 tracking-tight">
                  {currentNumber.number}
                </div>
                
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:-translate-y-0.5">
                  Gọi lại
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:-translate-y-0.5">
                  Bỏ qua
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg">
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex justify-center items-center gap-10 p-6 max-w-7xl mx-auto w-full">
          <button className="flex items-center w-1/3 justify-center gap-2 px-8 py-4 bg-green-700 text-white text-base font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:-translate-y-1 shadow-lg min-w-[140px]">
            Gọi tiếp
          </button>
          
         
          <button className="flex items-center w-1/3 justify-center gap-2 px-8 py-4 bg-white border border-gray-300 text-gray-700 text-base font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:-translate-y-1 min-w-[140px]">
            Gọi thủ công
          </button>
        </div>
      </div>
      
      {/* Footer - Always at bottom */}
      <Footer/>
    </div>
    
  );
};

export default ReceiveNumber;

