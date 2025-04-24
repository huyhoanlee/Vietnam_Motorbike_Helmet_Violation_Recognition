import os
import cv2
import json
import pandas as pd
from paddleocr import PaddleOCR
from plate_recognition import PlateRecognizer
from preprocess_license_plate import *
from pathlib import Path
if __name__ == "__main__":
    ocr_model = PaddleOCR(det_model_dir='det_15_3',
                          rec_model_dir='rec_inference',
                          rec_char_dict_path='en_dict.txt',
                          show_log=False,
                          use_angle_cls=True,
                          use_gpu=True)
    from paddleocr import PaddleOCR

    # ocr_model = PaddleOCR(
    #     det_model_dir=r"C:\Users\HP\Downloads\CHI\det_model_simplified.onnx",
    #     rec_model_dir=r"C:\Users\HP\Downloads\CHI\rec_model_simplified.onnx",
    #     rec_char_dict_path=r"C:\Users\HP\Downloads\CHI\en_dict.txt",  # thêm đường dẫn nếu file ở cùng thư mục
    #     cls_model_dir=r"C:\Users\HP\Downloads\CHI\cls_model.onnx",
    #     use_angle_cls=True,
    #     use_onnx=True,
    #     use_gpu=True,
    #     show_log=False
    # )

    print("ocr_model", ocr_model)
    plate_recognizer = PlateRecognizer(ocr_model=ocr_model)

    csv_file = "predicted_plate_numbers_new_detrec.csv"
    label_file_path = "OCR_PLATES_0503/det_gt_val.txt"

        # Step 1: Create an empty DataFrame with column names (only runs once)
    df = pd.DataFrame(columns=["image", "ground_truth", "predicted", "gt_line1", "gt_line2", "pred_line1", "pred_line2"])
    df.to_csv(csv_file, index=False, encoding="utf-8")  # Save file with headers


    with open(label_file_path, "r", encoding='utf-8') as file:
        for line in file:
            img_path, label_info = line.split("\t")
            img_path = f"OCR_PLATES_0503/{img_path}"
            label_info = json.loads(label_info)
        
            # print(label_info)  # Example: [{'transcription': '77-L1', 'points': [[27, 20], [31, 68], [139, 58], [134, 11]], 'difficult': False}, {'transcription': '270.62', 'points': [[18, 70], [19, 124], [156, 111], [152, 57]], 'difficult': False}]
            gt_line1, gt_line2 = "", ""
            for rec in label_info:
                text = rec['transcription']
                if any(char.isalpha() or char == "-" for char in text):
                    gt_line1 = text
                else:   
                    gt_line2 = text
            gt_license_plate_number = gt_line1 + gt_line2
            image = cv2.imread(img_path)
            # PREPROCESS THE IMAGE
            # resized_image = hist_equalization(image)
            # resized_image = apply_clahe(image)
            resized_image = resize_image(image)
            resized_image = scale_image(image)
            resized_image = sharpen_image(image)


            predicted_plate_number = plate_recognizer.recognize(resized_image)

            print("OCR: ", gt_license_plate_number, predicted_plate_number[0])

            if len(predicted_plate_number[2]) > 1:
                # Save to CSV file
                new_data = pd.DataFrame({
                    "image": [img_path],
                    "ground_truth": [gt_license_plate_number],
                    "predicted": [predicted_plate_number[0]],
                    "gt_line1": gt_line1, 
                    "gt_line2": gt_line2,
                    "pred_line1": predicted_plate_number[2][0], 
                    "pred_line2": str(predicted_plate_number[2][1]),
                })
            else:
                new_data = pd.DataFrame({
                    "image": [img_path],
                    "ground_truth": [gt_license_plate_number],
                    "predicted": [predicted_plate_number[0]],
                    "gt_line1": gt_line1, 
                    "pred_line1": predicted_plate_number[2][0], 
                })

            
            # Append to CSV without writing headers again
            new_data.to_csv(csv_file, mode="a", index=False, header=False, encoding="utf-8")