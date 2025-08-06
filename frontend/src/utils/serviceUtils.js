// Utility functions for service type handling

/**
 * Convert service type from database to Vietnamese display name
 * @param {string} serviceType - Service type from database (e.g., "passport", "birth", etc.)
 * @returns {string} - Vietnamese display name
 */
export const getServiceTypeName = (serviceType) => {
  const serviceMapping = {
    "passport": "Hộ chiếu",
    "birth": "Khai sinh", 
    "marriage": "Kết hôn",
    "license": "Bằng lái xe",
    "others": "Các thủ tục khác"
  };
  
  // Handle null/undefined
  if (!serviceType) {
    return '';
  }
  
  // Handle comma-separated multiple services
  if (serviceType.includes(',')) {
    return serviceType.split(',')
      .map(service => serviceMapping[service.trim()] || service.trim())
      .join(', ');
  }
  
  // Return mapped name or original value if not found
  return serviceMapping[serviceType] || serviceType;
};

/**
 * Get all available service types with their Vietnamese names
 * @returns {Array} - Array of service objects with id and vietnamese name
 */
export const getAllServiceTypes = () => {
  return [
    { id: "passport", vietnamese: "Hộ chiếu", japanese: "パスポート" },
    { id: "birth", vietnamese: "Khai sinh", japanese: "出生届" },
    { id: "marriage", vietnamese: "Kết hôn", japanese: "結婚受理" },
    { id: "license", vietnamese: "Bằng lái xe", japanese: "運転免許認証" },
    { id: "others", vietnamese: "Các thủ tục khác", japanese: "その他の手続き" }
  ];
};
