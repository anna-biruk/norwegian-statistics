import { SearchHistoryItem } from "../hooks/useSearchHistory";

const SearchHistory = ({
  searchHistory,
}: {
  searchHistory: SearchHistoryItem[];
}) => {
  if (searchHistory.length === 0) {
    return null;
  }
  return (
    <div>
      <h2>Search History</h2>
      <ul>
        {searchHistory.map((entry, index) => (
          <li key={index}>{entry.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default SearchHistory;
