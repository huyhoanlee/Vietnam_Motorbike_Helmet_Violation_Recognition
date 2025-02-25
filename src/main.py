from modules.ai_service import AI_Service
import cv2

AI_service = AI_Service()

i = 0
frame = cv2.imread('tr1 (382).png')
res = AI_service.process_frame(frame, i)
cv2.imshow('Result frame', res)
cv2.waitKey(0)
cv2.destroyAllWindows()
