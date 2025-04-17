from pydantic import BaseModel, Field
from typing import Optional

class VehicleInfo(BaseModel):
    owner: Optional[str] = Field(
        default=None, description="The name of the vehicle owner as written on the document"
    )
    address: Optional[str] = Field(
        default=None, description="The residential address of the vehicle owner"
    )
    model_code: Optional[str] = Field(
        default=None, description="The model code or vehicle type as printed on the document"
    )
    color: Optional[str] = Field(
        default=None, description="The color of the vehicle"
    )
    license_plate: Optional[str] = Field(
        default=None, description="The official license plate number of the vehicle"
    )


class CitizenInfo(BaseModel):
    full_name: Optional[str] = Field(
        default=None, description="Full name of citizen identity card holder"
    )
    date_of_birth: Optional[str] = Field(
        default=None, description="date of birth of citizen identity card holder"
    )
    place_of_origin: Optional[str] = Field(
        default=None, description="place of origin of citizen identity card holder"
    )
    place_of_residence: Optional[str] = Field(
        default=None, description="place of residence of citizen identity card holder"
    )
    card_number: Optional[str] = Field(
        default=None, description="citizen identity card number"
    )
    

class ImageBase64Request(BaseModel):
    image_base64: str