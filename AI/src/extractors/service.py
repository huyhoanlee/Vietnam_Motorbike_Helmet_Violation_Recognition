# from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate
from .prompt import CITIZEN_HUMAN_PROMPT, CITIZEN_SYSTEM_PROMPT, VEHICLE_HUMAN_PROMPT, VEHICLE_SYSTEM_PROMPT
from .model import VehicleInfo, CitizenInfo
import torch
from paddleocr import PaddleOCR
import os
from loguru import logger
# Set up environment variable for Google API Key
from langchain_openai.chat_models import AzureChatOpenAI
from langchain_deepseek import ChatDeepSeek
from dotenv import load_dotenv
import base64
import time
import numpy as np
import cv2


load_dotenv()


# Define the class for processing OCR and extracting vehicle information
class VehicleInfoExtractor:
    def __init__(self):
        # Initialize the LLM (Google Generative AI model)
        # self.llm = ChatGoogleGenerativeAI(
        #     model="gemini-2.0-flash",
        #     temperature=0,
        # )
        self.llm = ChatDeepSeek(
                    model=os.getenv("DEEPSEEK_MODEL_NAME"),
                    temperature=0,
                    max_tokens=None,
                    timeout=None,
                    max_retries=2,
                    api_key=os.getenv("DEEPSEEK_API_KEY"),
                )
        self.llm_struct_vihicle = self.llm.with_structured_output(VehicleInfo)
        self.llm_struct_citizen = self.llm.with_structured_output(CitizenInfo)
        
        # Initialize PaddleOCR model with angle classification for Vietnamese language
        self.ocr = PaddleOCR(use_angle_cls=True, lang='vi')  # Can switch lang if text is not in Vietnamese
        
    def get_prompt_vihicle(self, text_result: str) -> ChatPromptTemplate:
        # Format the prompts with the provided OCR text
        prompts = ChatPromptTemplate(
            [SystemMessage(content=VEHICLE_SYSTEM_PROMPT),
                HumanMessagePromptTemplate.from_template(
                    VEHICLE_HUMAN_PROMPT,
                    template_format="jinja2",
                ),
                ]
        ).format(text_result=text_result)
        return prompts

    def get_prompt_citizen(self, text_result: str) -> ChatPromptTemplate:
        # Format the prompts with the provided OCR text
        prompts = ChatPromptTemplate(
            [SystemMessage(content=CITIZEN_SYSTEM_PROMPT),
                HumanMessagePromptTemplate.from_template(
                    CITIZEN_HUMAN_PROMPT,
                    template_format="jinja2",
                ),
                ]
        ).format(text_result=text_result)
        return prompts

    async def ainvoke_vihicle(self, image_base64: str) -> VehicleInfo:
        start_time = time.time()
        logger.info("Processing base64 image input...")

        # Decode base64 thành ảnh
        image = decode_base64_to_cv2_image(image_base64)

        # OCR xử lý ảnh
        text_result = self.extract_text_from_image(image)
        logger.info(f"time taken for OCR: {time.time() - start_time:.2f} seconds")
        
        start_time = time.time()
        prompt = self.get_prompt_vihicle(text_result)
        # Gửi prompt cho LLM
        response = await self.llm_struct_vihicle.ainvoke(prompt)
        logger.info(f"time taken for LLM: {time.time() - start_time:.2f} seconds")

        return response

    async def ainvoke_citizen(self, image_base64: str) -> CitizenInfo:
        start_time = time.time()
        logger.info("Processing base64 image input...")

        # Decode base64 thành ảnh
        image = decode_base64_to_cv2_image(image_base64)

        # OCR xử lý ảnh
        text_result = self.extract_text_from_image(image)
        logger.info(f"time taken for OCR: {time.time() - start_time:.2f} seconds")
        logger.debug(f"Extracted text: {text_result}")
        start_time = time.time()
        prompt = self.get_prompt_citizen(text_result)
        # Gửi prompt cho LLM
        response = await self.llm_struct_citizen.ainvoke(prompt)
        logger.info(f"time taken for LLM: {time.time() - start_time:.2f} seconds")

        return response


    def extract_text_from_image(self, img_path: str) -> str:
        # Perform OCR on the image using PaddleOCR
        result = self.ocr.ocr(img_path, cls=True)
        
        text_result = ""
        for line in result[0]:
            text = line[1][0]
            text_result += f"{text}\n"
        
        return text_result


def encode_image_to_base64(img_path: str) -> str:
    ext = os.path.splitext(img_path)[-1].replace('.', '')
    with open(img_path, "rb") as img_file:
        b64 = base64.b64encode(img_file.read()).decode("utf-8")
        return f"data:image/{ext};base64,{b64}"

def decode_base64_to_cv2_image(base64_string: str) -> np.ndarray:
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    np_arr = np.frombuffer(image_data, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)