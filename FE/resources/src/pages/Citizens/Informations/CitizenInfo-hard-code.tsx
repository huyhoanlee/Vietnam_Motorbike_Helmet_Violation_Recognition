// import { useState } from "react";
// import {
//   Box, Typography, Grid, TextField, Button,
//   MenuItem, Snackbar, Alert, Paper, FormControlLabel,
//   RadioGroup, Radio, InputLabel, Select, FormControl,
//   Avatar
// } from "@mui/material";
// import { useFormik } from "formik";
// import * as Yup from "yup";

// const CitizenInfoFormHardCode = () => {
//   const [status, setStatus] = useState<"Draft" | "Submitted" | "Verified">("Draft");
//   const [cccdFile, setCccdFile] = useState<File | null>(null);
//   // const [vehicleFile, setVehicleFile] = useState<File | null>(null);
//   const [cccdPreview, setCccdPreview] = useState<string | null>(null);
//   // const [vehiclePreview, setVehiclePreview] = useState<string | null>(null);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState(false);

//   const isVerified = status === "Verified";
//   const today = new Date().toISOString().split("T")[0];

//   const handleFileChange = (
//     event: React.ChangeEvent<HTMLInputElement>,
//     setFile: (file: File | null) => void,
//     setPreview: (url: string | null) => void
//   ) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setFile(file);
//       setPreview(URL.createObjectURL(file));
//     }
//   };

//   const formik = useFormik({
//     initialValues: {
//       fullName: "",
//       email: "",
//       phone: "",
//       dob: "",
//       birthPlace: "",
//       gender: "Male",
//       address:"",
//       cccd: "",
//       issueDate: "",
//       issuePlace: "",
//       nationality: "Vietnam",
//       // plateNumber: "",
//     },
//     validationSchema: Yup.object({
//       fullName: Yup.string().required("Required"),
//       email: Yup.string().email("Invalid email").required("Required"),
//       phone: Yup.string()
//         .matches(/^[0-9]{10}$/, "Invalid phone number")
//         .required("Required"),
//       dob: Yup.date().max(new Date(), "Invalid date").required("Required"),
//       birthPlace: Yup.string().required("Required"),
//       cccd: Yup.string().required("Required"),
//       issueDate: Yup.date().max(new Date(), "Invalid date").required("Required"),
//       issuePlace: Yup.string().required("Required"),
//       // plateNumber: Yup.string().required("Required"),
//     }),
//     onSubmit: (values) => {
//       if (!isVerified) {
//         if (cccdFile) {
//           setSuccess(true);
//           setStatus("Submitted");
//           console.log("Submitted data:", values);
//         } else {
//           setError(true);
//         }
//       }
//     },
//   });

//   return (
//     <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
//       <Typography variant="h4" fontWeight={600} gutterBottom>
//         Citizen Information Form
//       </Typography>

//       <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 3 }}>
//         <form onSubmit={formik.handleSubmit}>
//           <Grid container spacing={3}>
//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Full Name"
//                 fullWidth
//                 disabled={isVerified}
//                 {...formik.getFieldProps("fullName")}
//                 error={formik.touched.fullName && Boolean(formik.errors.fullName)}
//                 helperText={formik.touched.fullName && formik.errors.fullName}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Email"
//                 fullWidth
//                 {...formik.getFieldProps("email")}
//                 error={formik.touched.email && Boolean(formik.errors.email)}
//                 helperText={formik.touched.email && formik.errors.email}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Phone Number"
//                 fullWidth
//                 disabled={isVerified}
//                 {...formik.getFieldProps("phone")}
//                 error={formik.touched.phone && Boolean(formik.errors.phone)}
//                 helperText={formik.touched.phone && formik.errors.phone}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Date of Birth"
//                 type="date"
//                 fullWidth
//                 InputLabelProps={{ shrink: true }}
//                 inputProps={{ max: today }}
//                 disabled={isVerified}
//                 {...formik.getFieldProps("dob")}
//                 error={formik.touched.dob && Boolean(formik.errors.dob)}
//                 helperText={formik.touched.dob && formik.errors.dob}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Place of Birth"
//                 fullWidth
//                 disabled={isVerified}
//                 {...formik.getFieldProps("birthPlace")}
//                 error={formik.touched.birthPlace && Boolean(formik.errors.birthPlace)}
//                 helperText={formik.touched.birthPlace && formik.errors.birthPlace}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <FormControl fullWidth disabled={isVerified}>
//                 <Typography sx={{ mb: 1 }}>Gender</Typography>
//                 <RadioGroup row {...formik.getFieldProps("gender")}>
//                   <FormControlLabel value="Male" control={<Radio />} label="Male" />
//                   <FormControlLabel value="Female" control={<Radio />} label="Female" />
//                 </RadioGroup>
//               </FormControl>
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="ID Number"
//                 fullWidth
//                 disabled={isVerified}
//                 {...formik.getFieldProps("cccd")}
//                 error={formik.touched.cccd && Boolean(formik.errors.cccd)}
//                 helperText={formik.touched.cccd && formik.errors.cccd}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Issue Date"
//                 type="date"
//                 fullWidth
//                 InputLabelProps={{ shrink: true }}
//                 inputProps={{ max: today }}
//                 disabled={isVerified}
//                 {...formik.getFieldProps("issueDate")}
//                 error={formik.touched.issueDate && Boolean(formik.errors.issueDate)}
//                 helperText={formik.touched.issueDate && formik.errors.issueDate}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <TextField
//                 label="Place of Issue"
//                 fullWidth
//                 disabled={isVerified}
//                 {...formik.getFieldProps("issuePlace")}
//                 error={formik.touched.issuePlace && Boolean(formik.errors.issuePlace)}
//                 helperText={formik.touched.issuePlace && formik.errors.issuePlace}
//               />
//             </Grid>

//             <Grid item xs={12} sm={6}>
//               <FormControl fullWidth disabled={isVerified}>
//                 <InputLabel>Nationality</InputLabel>
//                 <Select
//                   value={formik.values.nationality}
//                   onChange={(e) =>
//                     formik.setFieldValue("nationality", e.target.value)
//                   }
//                   label="Nationality"
//                 >
//                   <MenuItem value="Vietnam">Vietnam</MenuItem>
//                   <MenuItem value="Other">Other</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>

//              <Grid item xs={12}>
//               <TextField
//                 label="Address"
//                 fullWidth
//                 disabled={isVerified}
//                 {...formik.getFieldProps("Address")}
//                 error={formik.touched.address && Boolean(formik.errors.address)}
//                 helperText={formik.touched.address && formik.errors.address}
//               />
//             </Grid>
//             {/* Upload ID Image */}
//             <Grid item xs={12} sm={6}>
//               <Typography gutterBottom>ID Image</Typography>
//               <input
//                 type="file"
//                 accept="image/*"
//                 disabled={isVerified}
//                 onChange={(e) => handleFileChange(e, setCccdFile, setCccdPreview)}
//               />
//               {cccdPreview && (
//                 <Box mt={2}>
//                   <Avatar
//                     variant="rounded"
//                     src={cccdPreview}
//                     sx={{ width: 150, height: 100 }}
//                   />
//                 </Box>
//               )}
//             </Grid>

//             {/* Upload Vehicle Registration */}
//             {/* <Grid item xs={12} sm={6}>
//               <Typography gutterBottom>Card Parrot Image</Typography>
//               <input
//                 type="file"
//                 accept="image/*"
//                 disabled={isVerified}
//                 onChange={(e) => handleFileChange(e, setVehicleFile, setVehiclePreview)}
//               />
//               {vehiclePreview && (
//                 <Box mt={2}>
//                   <Avatar
//                     variant="rounded"
//                     src={vehiclePreview}
//                     sx={{ width: 150, height: 100 }}
//                   />
//                 </Box>
//               )}
//             </Grid> */}

//             {/* <Grid item xs={12}>
//               <TextField
//                 label="License Plate Number"
//                 fullWidth
//                 disabled={isVerified}
//                 {...formik.getFieldProps("plateNumber")}
//                 error={formik.touched.plateNumber && Boolean(formik.errors.plateNumber)}
//                 helperText={formik.touched.plateNumber && formik.errors.plateNumber}
//               />
//             </Grid> */}

//             <Grid item xs={12}>
//               <Typography color="primary" fontWeight={500}>
//                 Verification Status:{" "}
//                 <strong style={{ color: status === "Verified" ? "green" : "orange" }}>
//                   {status}
//                 </strong>
//               </Typography>
//             </Grid>

//             {!isVerified && (
//               <Grid item xs={12}>
//                 <Button type="submit" variant="contained" size="large" fullWidth>
//                   Submit Information
//                 </Button>
//               </Grid>
//             )}
//           </Grid>
//         </form>
//       </Paper>

//       {/* Snackbar Notifications */}
//       <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
//         <Alert severity="success">Information submitted successfully!</Alert>
//       </Snackbar>

//       <Snackbar open={error} autoHideDuration={3000} onClose={() => setError(false)}>
//         <Alert severity="error">Please upload all required images!</Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default CitizenInfoFormHardCode;
