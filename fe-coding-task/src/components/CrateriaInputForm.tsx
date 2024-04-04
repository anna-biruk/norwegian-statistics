import {
  Alert,
  Box,
  Button,
  FormControl,
  Input,
  MenuItem,
  Select,
} from "@mui/material";
import { useForm } from "react-hook-form";

export interface InputData {
  fromQuarter: string;
  toQuarter: string;
  houseType: string;
}
interface NorwayStatisticFormProps {
  onSubmit: (data: InputData) => void;
  defaultFromQuarter?: string | null;
  defaultToQuarter?: string | null;
  defaultHouseType?: string | null;
}
const CrateriaInputForm: React.FC<NorwayStatisticFormProps> = ({
  onSubmit,
  defaultFromQuarter,
  defaultToQuarter,
  defaultHouseType,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InputData>();

  const validateQuarter = (value: string) => {
    const quarterYear = parseInt(value.split("K")[0]);
    const quarter = parseInt(value.split("K")[1]);

    if (quarterYear < 2009) {
      return "Quarters range for from quarter should not be earlier than 2009K1";
    } else if (quarterYear === 2020 && quarter > 4) {
      return "Quarters range for to quarter should not be later than 2020K4";
    } else if (quarter < 1 || quarter > 4) {
      return "Quarters should be from K1 to K4";
    } else {
      return true;
    }
  };

  return (
    <>
      <Box
        component="form"
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "400px",
          margin: "auto",
          padding: "20px",
        }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormControl>
          <label htmlFor="fromQuarter">From quarter:</label>
          <Input
            type="text"
            id="fromQuarter"
            {...register("fromQuarter", {
              required: true,
              validate: validateQuarter,
            })}
            defaultValue={defaultFromQuarter}
            error={!!errors.fromQuarter}
            placeholder="2009K1"
            sx={{ marginBottom: "10px" }}
          />
          {errors.fromQuarter && (
            <Alert severity="error">
              {(errors.fromQuarter.message ||
                errors.fromQuarter.type === "required") &&
                "Please enter a valid quarter"}
            </Alert>
          )}
        </FormControl>
        <FormControl>
          <label htmlFor="toQuarter">To quarter:</label>
          <Input
            type="text"
            id="toQuarter"
            defaultValue={defaultToQuarter}
            {...register("toQuarter", {
              required: true,
              validate: validateQuarter,
            })}
            error={!!errors.toQuarter}
            placeholder="2020K4"
            sx={{ marginBottom: "10px" }}
          />
          {errors.toQuarter && (
            <Alert severity="error">
              {(errors.toQuarter.message ||
                errors.toQuarter.type === "required") &&
                "Please enter a valid quarter"}
            </Alert>
          )}
        </FormControl>
        <FormControl>
          <label htmlFor="houseType">House Type:</label>
          <Select
            defaultValue={defaultHouseType}
            id="houseType"
            {...register("houseType", { required: true })}
            sx={{ marginBottom: "10px" }}
          >
            <MenuItem value="00">Boliger i alt</MenuItem>
            <MenuItem value="02">Småhus</MenuItem>
            <MenuItem value="03">Blokkleiligheter</MenuItem>
          </Select>
          {errors.houseType && (
            <Alert severity="error">This field is required.</Alert>
          )}
        </FormControl>
        <Button type="submit" variant="contained" sx={{ marginTop: "20px" }}>
          Search
        </Button>
      </Box>
    </>
  );
};

export default CrateriaInputForm;
