import { useEffect, useState } from "react";
import generateQuarters from "../utils/generateQuaters";

const API_URL = "https://data.ssb.no/api/v0/no/table/07240";

export interface ApiResponse {
  dimension: {
    Tid: {
      category: {
        index: string[];
      };
    };
  };
  value: number[];
}
const useStatisticsFetch = (
  fromQuarter?: string | null,
  toQuarter?: string | null,
  houseType?: string | null
) => {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!fromQuarter || !toQuarter || !houseType) {
      setError("Please provide houseType, from and to quarters");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: [
            {
              code: "Boligtype",
              selection: {
                filter: "item",
                values: [houseType],
              },
            },
            {
              code: "ContentsCode",
              selection: {
                filter: "item",
                values: ["KvPris"],
              },
            },
            {
              code: "Tid",
              selection: {
                filter: "item",
                values: generateQuarters(fromQuarter, toQuarter),
              },
            },
          ],
          response: {
            format: "json-stat2",
          },
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const data = await response.json();
      setData(data);
    } catch (error: any) {
      setError(error.message);
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromQuarter && toQuarter && houseType) {
      fetchData();
    }
  }, []);

  return {
    data: {
      labels: Object.keys(data?.dimension?.Tid?.category?.index ?? {}) || [],
      values: data?.value || [],
    },
    loading,
    error,
    fetchData,
  };
};

export default useStatisticsFetch;
