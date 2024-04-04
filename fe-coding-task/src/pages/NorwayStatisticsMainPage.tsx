import { Alert, CircularProgress, Grid } from "@mui/material";
import { StringParam, useQueryParams } from "use-query-params";
import useStatisticsFetch from "../hooks/useStatisticsFetch";
import { useState } from "react";
import CrateriaInputForm, { InputData } from "../components/CrateriaInputForm";
import SaveConfirmationDialog from "../components/SaveConfirmationDialog";
import useSearchHistory from "../hooks/useSearchHistory";
import StatisticsBarChart from "../components/StatisticsBarChart";
import SearchHistory from "../components/SearchHistory";

const NorwayStatisticsMainPage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [query, setQuery] = useQueryParams({
    fromQuarter: StringParam,
    toQuarter: StringParam,
    houseType: StringParam,
  });

  const { addToSearchHistory, searchHistory } = useSearchHistory();

  const { data, loading, error, fetchData } = useStatisticsFetch(
    query.fromQuarter,
    query.toQuarter,
    query.houseType
  );

  const handleFormSubmit = (formData: InputData) => {
    const { fromQuarter, toQuarter, houseType } = formData;

    setQuery({ fromQuarter, toQuarter, houseType });
    setOpenDialog(true);
    fetchData();
  };

  const handleConfirmSave = () => {
    if (!query.fromQuarter || !query.toQuarter || !query.houseType) {
      setOpenDialog(false);
      return;
    }
    addToSearchHistory(query.fromQuarter, query.toQuarter, query.houseType);
    setOpenDialog(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <Grid container justifyContent="center" spacing={3}>
        <Grid item>
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            spacing={6}
          >
            <Grid item xs={12} lg={6}>
              <CrateriaInputForm
                defaultFromQuarter={query.fromQuarter}
                defaultToQuarter={query.toQuarter}
                defaultHouseType={query.houseType}
                onSubmit={handleFormSubmit}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <SearchHistory searchHistory={searchHistory} />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={9}>
          {loading && <CircularProgress />}
          {error && <Alert severity="error">{error}</Alert>}
          {data.values.length > 0 && (
            <StatisticsBarChart labels={data.labels} values={data.values} />
          )}
        </Grid>
      </Grid>
      <SaveConfirmationDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmSave}
      />
    </>
  );
};
export default NorwayStatisticsMainPage;
