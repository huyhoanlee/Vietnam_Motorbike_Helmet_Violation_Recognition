import { Card, CardContent, Typography, Grid, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AnalyticsPage = () => {
  const tableData = Array(7).fill({
    id: "1234",
    address: "Quy Nhon",
    name: "Nguyen Van A",
    violations: 1,
  });

  const chartData = [
    { year: 2015, AreaA: 1.3, car: 0.7 },
    { year: 2020, AreaA: 3.0, car: 2.0 },
    { year: 2025, AreaA: 5.5, car: 4.0 },
  ];

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4">Analytics Overview</Typography>

      <Grid container spacing={2} style={{ marginTop: "20px" }}>
        {/* Bảng dữ liệu */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Provider Data</Typography>

              <TextField placeholder="Search License Plate" fullWidth variant="outlined" style={{ marginBottom: "10px" }} />

              <Grid container spacing={1}>
                <Grid item xs={4}><Select fullWidth defaultValue="Time"><MenuItem value="Time">Time</MenuItem></Select></Grid>
                <Grid item xs={4}><Select fullWidth defaultValue="Location"><MenuItem value="Location">Location</MenuItem></Select></Grid>
                <Grid item xs={4}><Select fullWidth defaultValue="Vehicle Type"><MenuItem value="Vehicle Type">Vehicle Type</MenuItem></Select></Grid>
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
              <Typography variant="h6" gutterBottom>Chart View</Typography>
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

export default AnalyticsPage;
