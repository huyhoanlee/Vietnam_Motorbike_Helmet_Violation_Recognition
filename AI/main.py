import os
import cv2
import time
from src.modules.ai_service import AI_Service

# Initialize AI service
AI_service = AI_Service()

# # Define input and output folders
# input_folder = "test_in"  # Change to your image folder
# output_folder = "test_out"  # Change to your output folder

# # Create output folder if it doesn't exist
# os.makedirs(output_folder, exist_ok=True)

# # Get list of image files
# image_files = [f for f in os.listdir(input_folder) if f.lower().endswith(('.png', '.jpg', '.jpeg'))]


total_start_time = time.time()
# # Process each image
# for i, image_name in enumerate(image_files):
#     image_path = os.path.join(input_folder, image_name)
#     output_path = os.path.join(output_folder, image_name)

# Read image
image_path = "CAM013_20250214_1108_Mua_14.jpg"
frame = cv2.imread(image_path)
i = 0
# Measure processing time
start_time = time.time()
result_json = AI_service.process_frame(frame, i)
end_time = time.time()

# Save processed image
# cv2.imwrite(output_path, result_frame)

# Print processing time
# print(f"Processed {image_name} in {end_time - start_time:.4f} seconds")

# End total processing timer
total_end_time = time.time()
total_time = total_end_time - total_start_time

print(f"\nTotal processing time: {total_time:.4f} seconds")
# print(f"Processed {len(image_files)} images. Results saved in: {output_folder}")
