import { useEffect, useState } from "react";
export interface SearchHistoryItem {
  title: string;
  time: string;
}
const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("searchHistory");
    if (storedHistory) {
      setSearchHistory(JSON.parse(storedHistory));
    }
  }, []);

  const addToSearchHistory = (
    fromQuarter: string,
    toQuarter: string,
    houseType: string
  ) => {
    const searchEntry = {
      title: `From: ${fromQuarter}, To: ${toQuarter}, House Type: ${houseType}`,
      time: new Date().toISOString(),
    };

    setSearchHistory((prevHistory) => {
      const newHistory = [...prevHistory, searchEntry];
      localStorage.setItem("searchHistory", JSON.stringify(newHistory));
      return newHistory;
    });

    return searchEntry;
  };

  return { addToSearchHistory, searchHistory };
};

export default useSearchHistory;
