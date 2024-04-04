const generateQuarters = (from: string, to: string): string[] => {
  const [startYear, startQuarter] = from.split("K");
  const [endYear, endQuarter] = to.split("K");
  const quarters = [];

  for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
    const startQ = year === parseInt(startYear) ? parseInt(startQuarter) : 1;
    const endQ = year === parseInt(endYear) ? parseInt(endQuarter) : 4;
    for (let quarter = startQ; quarter <= endQ; quarter++) {
      quarters.push(`${year}K${quarter}`);
    }
  }

  return quarters;
};

export default generateQuarters;
