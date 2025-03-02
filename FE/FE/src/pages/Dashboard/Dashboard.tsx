import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Button
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const summaryData = [
    { title: "Total Detections", value: 10, buttonText: "View Detections" },
    { title: "Violation Detection", value: 9, buttonText: "View", showDot: true },
    { title: "List of Devices", value: 5, buttonText: "View Details" },
    { title: "Reports", value: 9, buttonText: "View Reports" },
  ];

  const tableData = Array(7).fill({
    id: "1234",
    address: "Quy Nhon",
    name: "Nguyen Van A",
    violations: 1,
  });

  const chartData = [
    { year: 2015, AreaA: 1.3, car: 0.7 },
    { year: 2016, AreaA: 1.4, car: 0.9 },
    { year: 2017, AreaA: 1.8, car: 1.2 },
    { year: 2018, AreaA: 2.0, car: 1.5 },
    { year: 2019, AreaA: 2.5, car: 1.8 },
    { year: 2020, AreaA: 3.0, car: 2.0 },
    { year: 2021, AreaA: 3.5, car: 2.3 },
    { year: 2022, AreaA: 4.0, car: 2.7 },
    { year: 2023, AreaA: 4.5, car: 3.1 },
    { year: 2024, AreaA: 5.0, car: 3.5 },
    { year: 2025, AreaA: 5.5, car: 4.0 },
  ];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
  {/* Tiêu đề & Thanh tìm kiếm */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4">Dashboard Overview</Typography>
        <TextField
          placeholder="Search Violations"
          variant="outlined"
          size="small"
          style={{ width: "300px" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </div>

 {/* Card thống kê */}
      <Grid container spacing={2} style={{ marginTop: "20px" }}>
        {summaryData.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              variant="outlined"
              style={{
                background: "#F3EDF7",
                textAlign: "center",
                padding: "10px",
                borderRadius: "12px",
                position: "relative",
              }}
            >
              <CardContent>
                {/* Icon Placeholder */}
                <div style={{ position: "absolute", top: "10px", left: "10px" }}>
                  <div
                    style={{
                      width: "20px",
                      height: "20px", 
                      border: "2px solid #333",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>

                <Typography variant="h6" fontWeight="bold">
                  {item.title}
                </Typography>

                {/* Nếu có chấm đỏ */}
                {item.showDot && (
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      backgroundColor: "red",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                    }}
                  ></div>
                )}

                <Typography variant="h4" color="primary" fontWeight="bold">
                  {String(item.value).padStart(3, "0")}
                </Typography>

                <Typography variant="body2">Detections</Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  style={{
                    marginTop: "10px",
                    borderRadius: "20px",
                    textTransform: "none",
                    fontWeight: "bold",
                  }}
                >
                  {item.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} style={{ marginTop: "20px" }}>
        {/* Bảng dữ liệu */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Provider Data
              </Typography>

              <TextField
                placeholder="Search License Plate"
                fullWidth
                variant="outlined"
                style={{ marginBottom: "10px" }}
              />

              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Select fullWidth defaultValue="Time">
                    <MenuItem value="Time">Time</MenuItem>
                    <MenuItem value="Day">Day</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={4}>
                  <Select fullWidth defaultValue="Location">
                    <MenuItem value="Location">Location</MenuItem>
                    <MenuItem value="Area A">Area A</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={4}>
                  <Select fullWidth defaultValue="Vehicle Type">
                    <MenuItem value="Vehicle Type">Vehicle Type</MenuItem>
                    <MenuItem value="Car">Car</MenuItem>
                  </Select>
                </Grid>
              </Grid>

              <TableContainer component={Paper} style={{ marginTop: "10px" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Violations</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.id}</TableCell>
                        <TableCell>{row.address}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.violations}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Biểu đồ */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chart View
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="AreaA" fill="#6EC6FF" name="Area A" />
                  <Bar dataKey="car" fill="#4A235A" name="By Car" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;
