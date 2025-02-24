from controllers.ai_service import AI_Service
import cv2
AI_service = AI_Service()

i = 0
frame = cv2.imread('CAM021_20250212_1550_Nang_9d3.jpg')
res = AI_service.process_frame(frame, i)
cv2.imshow('asdf', res)
cv2.waitKey(0)
cv2.destroyAllWindows()
