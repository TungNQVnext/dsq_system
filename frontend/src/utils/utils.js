import { LANGUAGES, SPINS } from "../constants/constants";

export const getLanguageDisplay = (language) => {
  return LANGUAGES[language] || language;
};

export const getSpinDisplay = (spin) => {
  return "Quầy số 3";
};

export const getFilterCounts = (records) => {
  const counts = {
    all: records.length,
    waiting_to_receive: 0,
    completed: 0,
  };
  for (const record of records) {
    const status = record.status;
    if (counts.hasOwnProperty(status)){
      counts[status]++;
    }
  }
  return counts;
};