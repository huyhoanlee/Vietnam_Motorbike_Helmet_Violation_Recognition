import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const summaryData = [
    { title: "Accounts", value: 10, buttonText: "View Detections" },
    { title: "Violation Detection", value: 9, buttonText: "View", showDot: true },
    { title: "List of Devices", value: 5, buttonText: "View Details" },
    { title: "Reports", value: 9, buttonText: "View Reports" },
  ];

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <Typography variant="h4">Dashboard Overview</Typography>
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
      <Button variant="contained" color="primary" onClick={() => navigate("/analytics")} style={{ marginTop: "20px" }}>
        View Analytics
      </Button>  
    </div>
  );
};

export default Dashboard;
