import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ImageList,
  ImageListItem,
  Grid,
  Chip,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  Fade,
  Badge,
  Skeleton,
  Container,
  Zoom,
} from "@mui/material";
import {
  Edit,
  Delete,
  ExpandMore,
  Warning,
  CheckCircle,
  DirectionsCar,
  CameraAlt,
  LocationOn,
  AccessTime,
  Description,
  Close,
} from "@mui/icons-material";
import { useForm } from "react-hook-form";
import axiosInstance from "../../../services/axiosInstance";
import config from "../../../config";

const API_BASE_URL = `${config.API_URL}`;

interface Status {
  id: string;
  name: string;
  description: string;
}

interface Violation {
  id: string;
  plate_number: string;
  location?: string;
  detected_at?: string;
  images: string[];
  statusId: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

interface StatusForm {
  name: string;
  description: string;
}

const StatusManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [currentStatus, setCurrentStatus] = useState<Status | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });
  const [tabIndex, setTabIndex] = useState<number>(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);
  const [deletingStatus, setDeletingStatus] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StatusForm>();

  useEffect(() => {
    fetchStatuses();
    fetchViolations();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}violation_status/get-all/`
      );
      const mapped = response.data.data.map((item: any) => ({
        id: String(item.id),
        name: item.status_name,
        description: item.description,
      }));
      setStatuses(mapped);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
      setSnackbar({
        open: true,
        message: "Failed to load status data. Please try again.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchViolations = async () => {
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}violations/get-all/`
      );
      const mappedViolations = response.data.data.map((v: any) => ({
        id: String(v.violation_id),
        plate_number: v.plate_number,
        location: v.location || "Unknown location",
        detected_at: v.detected_at || "Unknown time",
        images: v.violation_images || [], 
        statusId: v.status_name, 
      }));
      setViolations(mappedViolations);
    } catch (error) {
      console.error("Failed to fetch violations", error);
      setSnackbar({
        open: true,
        message: "Failed to load violation data. Please try again.",
        severity: "error",
      });
    }
  };

  const handleOpenDialog = (mode: "create" | "edit", status: Status | null = null) => {
    setDialogMode(mode);
    setCurrentStatus(status);
    if (status) {
      setValue("name", status.name);
      setValue("description", status.description);
    } else {
      reset();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    reset();
  };

  const onSubmit = async (data: StatusForm) => {
    const { name, description } = data;
    
    // Check if status name already exists (for create mode)
    const existingStatus = statuses.find(
      (status) => status.name.toLowerCase() === name.toLowerCase() && 
      (dialogMode === "create" || status.id !== currentStatus?.id)
    );

    if (existingStatus && dialogMode === "create") {
      setSnackbar({
        open: true,
        message: "This status already exists.",
        severity: "error",
      });
      return;
    }

    // Validate status name format
    if (/[^a-zA-Z0-9\s]/.test(name)) {
      setSnackbar({
        open: true,
        message: "Status name cannot contain special characters.",
        severity: "error",
      });
      return;
    }

    try {
      if (dialogMode === "create") {
        await axiosInstance.post(
          `${API_BASE_URL}violation_status/create/`,
          { status_name: name, description }
        );
        setSnackbar({
          open: true,
          message: "Create new status successfully!",
          severity: "success",
        });
      } else if (dialogMode === "edit" && currentStatus) {
        await axiosInstance.patch(
          `${API_BASE_URL}violation_status/change-status/${currentStatus.id}/`,
          { status_name: name, description }
        );
        setSnackbar({
          open: true,
          message: "Status updated successfully!",
          severity: "success",
        });
      }
      fetchStatuses();
      handleCloseDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "An error occurred. Please try again.",
        severity: "error",
      });
    }
  };

  const handleDelete = async (statusId: string) => {
    setDeletingStatus(statusId);
    
    const statusName = statuses.find(s => s.id === statusId)?.name;
    const isLinked = violations.some((v) => v.statusId === statusName);

    if (isLinked) {
      setSnackbar({
        open: true,
        message: "This status cannot be deleted because it is linked to existing violations.",
        severity: "warning",
      });
      setDeletingStatus(null);
      return;
    }

    try {
      await axiosInstance.delete(
        `${API_BASE_URL}violation_status/delete/${statusId}/`
      );
      setSnackbar({
        open: true,
        message: "Status deleted successfully!",
        severity: "success",
      });
      fetchStatuses();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Unable to delete status. Please try again.",
        severity: "error",
      });
    } finally {
      setDeletingStatus(null);
    }
  };

  const showDeleteConfirmation = (statusId: string) => {
    const statusName = statuses.find(s => s.id === statusId)?.name;
    const isLinked = violations.some((v) => v.statusId === statusName);

    if (isLinked) {
      setSnackbar({
        open: true,
        message: "This status cannot be deleted because it is linked to existing violations.",
        severity: "warning",
      });
      return;
    }

    if (window.confirm("Are you sure you want to delete this status? This action cannot be undone.")) {
      handleDelete(statusId);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleImageClick = (imageSrc: string) => {
    setExpandedImage(imageSrc);
  };

  const closeExpandedImage = () => {
    setExpandedImage(null);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("pending") || statusLower === "ai detected") return "warning";
    if (statusLower.includes("processed") || statusLower === "verified") return "success";
    if (statusLower.includes("error") || statusLower.includes("reject")) return "error";
    return "default";
  };

  const getViolationCountByStatus = (statusName: string) => {
    return violations.filter(v => v.statusId === statusName).length;
  };

  // Render table loading skeletons
  const renderTableSkeletons = () => (
    <TableBody>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton animation="wave" height={30} />
          </TableCell>
          <TableCell>
            <Skeleton animation="wave" height={30} />
          </TableCell>
          <TableCell>
            <Skeleton animation="wave" height={30} width={100} />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ 
        padding: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "white",
        borderRadius: 2,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        mt: 3
      }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            fontWeight: 600, 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
            borderBottom: '2px solid #f0f0f0',
            pb: 2,
            mb: 3
          }}
        >
          Status Management
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabIndex} 
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 500,
                textTransform: 'none',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            <Tab label="Status List" />
            {/* <Tab label="Violations by Status" /> */}
          </Tabs>
        </Box>

        {/* Tab 1: Status Management */}
        {tabIndex === 0 && (
          <Fade in={tabIndex === 0} timeout={500}>
            <Box>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircle />}
                sx={{ 
                  mb: 3,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)',
                  transition: 'all 0.3s',
                  '&:hover': {
                    boxShadow: '0 6px 12px rgba(25, 118, 210, 0.3)'
                  }
                }}
                onClick={() => handleOpenDialog("create")}
              >
                Create New Status
              </Button>

              {loading ? (
                <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3, borderRadius: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    {renderTableSkeletons()}
                  </Table>
                </TableContainer>
              ) : (
                <TableContainer component={Paper} sx={{ 
                  boxShadow: 3, 
                  borderRadius: 2,
                  overflow: 'hidden'
                }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status Name</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Description</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statuses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                            <Typography variant="body1" color="text.secondary">
                              No status records found. Create a new one to get started.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        statuses.map((status) => {
                          const violationCount = getViolationCountByStatus(status.name);
                          const isLinked = violationCount > 0;
                          
                          return (
                            <TableRow 
                              key={status.id}
                              sx={{ 
                                '&:hover': { backgroundColor: '#f9f9f9' },
                                transition: 'background-color 0.2s'
                              }}
                            >
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Chip 
                                    label={status.name} 
                                    color={getStatusColor(status.name) as any}
                                    variant="outlined"
                                    sx={{ fontWeight: 500 }}
                                  />
                                  {isLinked && (
                                    <Chip
                                      size="small"
                                      label={`${violationCount} violations`}
                                      sx={{ ml: 1, fontSize: '0.75rem' }}
                                    />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {status.description || "No description"}
                              </TableCell>
                              <TableCell>
                                <Tooltip title="Edit Status">
                                  <IconButton
                                    color="primary"
                                    onClick={() => handleOpenDialog("edit", status)}
                                    sx={{ 
                                      mr: 1,
                                      transition: 'transform 0.2s',
                                      '&:hover': { transform: 'scale(1.1)' }
                                    }}
                                  >
                                    <Edit />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title={isLinked ? "Cannot delete (in use)" : "Delete Status"}>
                                  <span>
                                    <IconButton
                                      color="error"
                                      onClick={() => showDeleteConfirmation(status.id)}
                                      disabled={isLinked || deletingStatus === status.id}
                                      sx={{ 
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.1)' }
                                      }}
                                    >
                                      {deletingStatus === status.id ? (
                                        <CircularProgress size={20} color="error" />
                                      ) : (
                                        <Delete />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Fade>
        )}

        {/* Tab 2: Violations by Status */}
        {tabIndex === 1 && (
          <Fade in={tabIndex === 1} timeout={500}>
            <Box>
              {loading ? (
                <Box sx={{ mt: 3 }}>
                  {[...Array(3)].map((_, index) => (
                    <Skeleton key={index} height={100} sx={{ mb: 2, borderRadius: 2 }} animation="wave" />
                  ))}
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {statuses.map((status) => {
                    const relatedViolations = violations.filter(
                      (v) => v.statusId === status.name
                    );

                    return (
                      <Grid item xs={12} key={status.id}>
                        <Accordion 
                          sx={{ 
                            boxShadow: 3,
                            borderRadius: '8px !important',
                            mb: 2,
                            overflow: 'hidden',
                            '&:before': { display: 'none' }
                          }}
                        >
                          <AccordionSummary 
                            expandIcon={<ExpandMore />}
                            sx={{ 
                              backgroundColor: theme.palette.grey[50],
                              borderBottom: '1px solid rgba(0,0,0,0.08)'
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                              <Chip 
                                label={status.name} 
                                color={getStatusColor(status.name) as any}
                                sx={{ fontWeight: 600, mr: 2 }}
                              />
                              <Badge 
                                badgeContent={relatedViolations.length} 
                                color="primary"
                                max={999}
                                sx={{ mr: 2 }}
                              >
                                <Typography fontWeight="500">Violations</Typography>
                              </Badge>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ p: 0 }}>
                            {relatedViolations.length === 0 ? (
                              <Box 
                                sx={{ 
                                  p: 3, 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  alignItems: 'center' 
                                }}
                              >
                                <Warning sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 1 }} />
                                <Typography variant="body1" color="text.secondary" align="center">
                                  No violations found with this status.
                                </Typography>
                              </Box>
                            ) : (
                              <Grid container spacing={2} sx={{ p: 2 }}>
                                {relatedViolations.map((violation) => (
                                  <Grid item xs={12} sm={6} md={4} key={violation.id}>
                                    <Card 
                                      sx={{ 
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        '&:hover': {
                                          transform: 'translateY(-4px)',
                                          boxShadow: 4
                                        }
                                      }}
                                    >
                                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                          <Typography 
                                            variant="h6" 
                                            fontWeight="600"
                                            sx={{ fontSize: '1rem' }}
                                          >
                                            ID: {violation.id}
                                          </Typography>
                                          <Chip 
                                            label={status.name} 
                                            size="small" 
                                            color={getStatusColor(status.name) as any}
                                            sx={{ height: 20 }}
                                          />
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                          <DirectionsCar fontSize="small" color="action" sx={{ mr: 1 }} />
                                          <Typography variant="body2">
                                            {violation.plate_number || "No plate number"}
                                          </Typography>
                                        </Box>
                                        
                                        {violation.location && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <LocationOn fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2" noWrap sx={{ maxWidth: '90%' }}>
                                              {violation.location}
                                            </Typography>
                                          </Box>
                                        )}
                                        
                                        {violation.detected_at && (
                                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <AccessTime fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2">
                                              {new Date(violation.detected_at).toLocaleString()}
                                            </Typography>
                                          </Box>
                                        )}
                                        
                                        <Divider sx={{ my: 1 }} />
                                        
                                        {violation.images && violation.images.length > 0 ? (
                                          <ImageList 
                                            cols={isTablet ? 2 : 3} 
                                            gap={4} 
                                            sx={{ 
                                              mb: 0,
                                              overflow: 'visible',
                                              '& .MuiImageListItem-root': {
                                                overflow: 'hidden',
                                                borderRadius: 1
                                              }
                                            }}
                                          >
                                            {violation.images.slice(0, 3).map((img, index) => (
                                              <ImageListItem 
                                                key={index} 
                                                sx={{ 
                                                  cursor: 'pointer',
                                                  '&:hover': { opacity: 0.8 },
                                                  transition: 'opacity 0.2s',
                                                  height: '80px !important'
                                                }}
                                                onClick={() => handleImageClick(img)}
                                              >
                                                <img
                                                  src={img}
                                                  alt={`violation-${violation.id}-${index}`}
                                                  loading="lazy"
                                                  style={{ 
                                                    objectFit: 'cover',
                                                    height: '100%',
                                                    width: '100%'
                                                  }}
                                                  onLoad={() => setIsImageLoading(false)}
                                                />
                                                {isImageLoading && (
                                                  <Skeleton 
                                                    variant="rectangular" 
                                                    width="100%" 
                                                    height="100%" 
                                                    animation="wave"
                                                  />
                                                )}
                                              </ImageListItem>
                                            ))}
                                            {violation.images.length > 3 && (
                                              <ImageListItem 
                                                sx={{ 
                                                  cursor: 'pointer',
                                                  position: 'relative',
                                                  height: '80px !important'
                                                }}
                                                onClick={() => handleImageClick(violation.images[3])}
                                              >
                                                <img
                                                  src={violation.images[3]}
                                                  alt={`violation-${violation.id}-more`}
                                                  loading="lazy"
                                                  style={{ 
                                                    objectFit: 'cover',
                                                    height: '100%',
                                                    width: '100%',
                                                    filter: 'brightness(0.5)'
                                                  }}
                                                />
                                                <Box 
                                                  sx={{ 
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                  }}
                                                >
                                                  <Typography 
                                                    sx={{ 
                                                      color: 'white', 
                                                      fontWeight: 'bold' 
                                                    }}
                                                  >
                                                    +{violation.images.length - 3}
                                                  </Typography>
                                                </Box>
                                              </ImageListItem>
                                            )}
                                          </ImageList>
                                        ) : (
                                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <CameraAlt fontSize="small" color="action" sx={{ mr: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                              No images available
                                            </Typography>
                                          </Box>
                                        )}
                                      </CardContent>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Fade>
        )}

        {/* Dialog for Create/Edit Status */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          TransitionComponent={Zoom}
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: theme.palette.primary.main, 
            color: 'white',
            py: 2
          }}>
            {dialogMode === "create" ? "Create New Status" : "Edit Status"}
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Description color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {dialogMode === "create" 
                    ? "Create a new status for categorizing violations" 
                    : "Update the existing status details"}
                </Typography>
              </Box>
              
              <TextField
                label="Status Name"
                fullWidth
                margin="normal"
                variant="outlined"
                autoFocus
                {...register("name", { 
                  required: "Status name cannot be blank",
                  pattern: {
                    value: /^[a-zA-Z0-9\s]+$/,
                    message: "Status name cannot contain special characters"
                  }
                })}
                error={!!errors.name}
                helperText={errors.name?.message}
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
              
              <TextField
                label="Description"
                fullWidth
                margin="normal"
                multiline
                rows={3}
                variant="outlined"
                {...register("description", { 
                  required: "Description cannot be empty" 
                })}
                error={!!errors.description}
                helperText={errors.description?.message}
                InputProps={{
                  sx: { borderRadius: 1 }
                }}
              />
            </DialogContent>
            
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{ borderRadius: 1 }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                type="submit"
                sx={{ 
                  borderRadius: 1,
                  px: 3
                }}
              >
                {dialogMode === "create" ? "Create" : "Update"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

              {/* Image Preview Dialog */}
      <Dialog
        open={!!expandedImage}
        onClose={closeExpandedImage}
        maxWidth="md"
        fullWidth
        TransitionComponent={Zoom}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: theme.palette.primary.main,
            color: "white",
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Image Preview
          <IconButton
            onClick={closeExpandedImage}
            sx={{ color: "white" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: "flex", justifyContent: "center" }}>
          {expandedImage && (
            <img
              src={expandedImage}
              alt="Expanded violation"
              style={{
                width: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
                borderRadius: 2,
              }}
              onLoad={() => setIsImageLoading(false)}
            />
          )}
          {isImageLoading && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height={400}
              animation="wave"
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={closeExpandedImage}
            variant="contained"
            sx={{ borderRadius: 1 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() =>
          setSnackbar({ ...snackbar, open: false })
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() =>
            setSnackbar({ ...snackbar, open: false })
          }
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 1 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  </Container>
);
};

export default StatusManagement;