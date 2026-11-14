
from pydantic import BaseModel, Field
from typing import Optional


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class Geology(BaseModel):
    composition: Optional[str] = None
    rock_types: list[str] = Field(default_factory=list)
    minerals: list[str] = Field(default_factory=list)


class Topography(BaseModel):
    elevation_m: Optional[float] = None
    slope_degrees: Optional[float] = Field(default=None, ge=0, le=90)
    roughness: Optional[float] = None


class Temperature(BaseModel):
    minimum_c: Optional[float] = None
    maximum_c: Optional[float] = None
    average_c: Optional[float] = None


class IceWater(BaseModel):
    water_presence: Optional[bool] = None
    ice_presence: Optional[bool] = None
    evidence: Optional[str] = None


class DustAtmosphere(BaseModel):
    dust_level: Optional[str] = None
    atmospheric_conditions: Optional[str] = None
    humidity_percent: Optional[float] = Field(
        default=None, ge=0, le=100
    )


class Habitability(BaseModel):
    description: Optional[str] = None
    radiation_level: Optional[str] = None
    environmental_conditions: Optional[str] = None


class Subsurface(BaseModel):
    caves_present: Optional[bool] = None
    underground_structures: Optional[str] = None
    evidence: Optional[str] = None


class Location(BaseModel):
    id: str
    name: str
    country: str
    coordinates: Coordinates

    geology: Geology = Field(default_factory=Geology)
    topography: Topography = Field(default_factory=Topography)
    temperature: Temperature = Field(default_factory=Temperature)
    ice_water: IceWater = Field(default_factory=IceWater)
    dust_atmosphere: DustAtmosphere = Field(
        default_factory=DustAtmosphere
    )
    habitability: Habitability = Field(
        default_factory=Habitability
    )
    subsurface: Subsurface = Field(default_factory=Subsurface)

    research_level: Optional[str] = None
    data_sources: list[str] = Field(default_factory=list)

    class Config:
        extra = "forbid"
