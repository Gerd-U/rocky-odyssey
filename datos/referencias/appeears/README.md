# AppEEARS Point Sample Extraction Readme  

## Table of Contents  

1. Request Parameters  
2. Request File Listing  
3. Point Sample Extraction Process  
4. Data Quality  
    4.1. Moderate Resolution Imaging Spectroradiometer (MODIS)  
    4.2. NASA MEaSUREs Shuttle Radar Topography Mission (SRTM) Version 3 (v3)  
    4.3. NASA Visible Infrared Imaging Radiometer Suite (VIIRS)  
    4.4. Soil Moisture Active Passive (SMAP)  
    4.5. Daymet (v4R1)
    4.6. Ecosystem Spaceborne Thermal Radiometer Experiment on Space Station (ECOSTRESS)  
    4.6.1. Ecosystem Spaceborne Thermal Radiometer Experiment on Space Station (ECOSTRESS) Swath V2  
    4.6.2. Ecosystem Spaceborne Thermal Radiometer Experiment on Space Station (ECOSTRESS) Tiled V2
    4.7. Advanced Spaceborne Thermal Emission and Reflection Radiometer (ASTER) Global Digital Elevation Model (GDEM) Version 3 (v3) and Global Water Bodies Database (WBD) Version 1 (v1)  
    4.8. NASA MEaSUREs NASA Digital Elevation Model (DEM) Version 1 (v1)  
    4.9. Harmonized Landsat Sentinel-2 (HLS) Version 2.0
    4.10. Landsat Collection 2 (C2) U.S. Analysis Ready Data (ARD)  
    4.11. US National Park Service (NPS) Historical Water Balance for the Continental United States (CONUS)
    4.12. Earth surface Mineral dust source InvesTigation (EMIT) L1B Radiance and L2A Reflectance Collections
    4.13. Earth surface Mineral dust source InvesTigation (EMIT) L2B Estimated Mineral Identification, Band Depth and Uncertainty Collection
    4.14. Plankton, Aerosol, Cloud, ocean Ecosystem (PACE) Ocean Color (OCI) Level-3 Global Mapped Data
    4.15. National Land Cover Database (NLCD)
5. Data Caveats  
6. Documentation  
7. Sample Request Retention  
8. Data Product Citations  
9. Software Citation  
10. Feedback  

## 1. Request Parameters  

    Name: rocky_odyssey_tierra  

    Date Completed: 2026-11-14T18:54:45.480810  

    ID: a8dda36c-aebe-49ce-b73f-b08e5c651897  

    Details:  

        Start Date: 01-01-2023  

        End Date: 12-31-2023
    
        Layers:  

            LST_Day_1km (MOD11A2.061)  
            LST_Night_1km (MOD11A2.061)  
            NDSI_Snow_Cover (MOD10A1.061)  
            ASTER_GDEM_DEM (ASTGTM_NC.003)  
    
        Coordinates:  

            Desierto de Gobi-0.05-0.05, Desierto de Gobi, 43.45, 103.95  
            Desierto de Gobi-0.050.00, Desierto de Gobi, 43.45, 104  
            Desierto de Gobi-0.050.05, Desierto de Gobi, 43.45, 104.05  
            Desierto de Gobi0.00-0.05, Desierto de Gobi, 43.5, 103.95  
            Desierto de Gobi0.000.00, Desierto de Gobi, 43.5, 104  
            Desierto de Gobi0.000.05, Desierto de Gobi, 43.5, 104.05  
            Desierto de Gobi0.05-0.05, Desierto de Gobi, 43.55, 103.95  
            Desierto de Gobi0.050.00, Desierto de Gobi, 43.55, 104  
            Desierto de Gobi0.050.05, Desierto de Gobi, 43.55, 104.05  
            Dasht-e Lut-0.05-0.05, Dasht-e Lut, 30.45, 58.95  
            Dasht-e Lut-0.050.00, Dasht-e Lut, 30.45, 59  
            Dasht-e Lut-0.050.05, Dasht-e Lut, 30.45, 59.05  
            Dasht-e Lut0.00-0.05, Dasht-e Lut, 30.5, 58.95  
            Dasht-e Lut0.000.00, Dasht-e Lut, 30.5, 59  
            Dasht-e Lut0.000.05, Dasht-e Lut, 30.5, 59.05  
            Dasht-e Lut0.05-0.05, Dasht-e Lut, 30.55, 58.95  
            Dasht-e Lut0.050.00, Dasht-e Lut, 30.55, 59  
            Dasht-e Lut0.050.05, Dasht-e Lut, 30.55, 59.05  
            Depresion de Danakil-0.05-0.05, Depresion de Danakil, 14.15, 40.25  
            Depresion de Danakil-0.050.00, Depresion de Danakil, 14.15, 40.3  
            Depresion de Danakil-0.050.05, Depresion de Danakil, 14.15, 40.35  
            Depresion de Danakil0.00-0.05, Depresion de Danakil, 14.2, 40.25  
            Depresion de Danakil0.000.00, Depresion de Danakil, 14.2, 40.3  
            Depresion de Danakil0.000.05, Depresion de Danakil, 14.2, 40.35  
            Depresion de Danakil0.05-0.05, Depresion de Danakil, 14.25, 40.25  
            Depresion de Danakil0.050.00, Depresion de Danakil, 14.25, 40.3  
            Depresion de Danakil0.050.05, Depresion de Danakil, 14.25, 40.35  
            Salar de Uyuni-0.05-0.05, Salar de Uyuni, -20.25, -67.55  
            Salar de Uyuni-0.050.00, Salar de Uyuni, -20.25, -67.5  
            Salar de Uyuni-0.050.05, Salar de Uyuni, -20.25, -67.45  
            Salar de Uyuni0.00-0.05, Salar de Uyuni, -20.2, -67.55  
            Salar de Uyuni0.000.00, Salar de Uyuni, -20.2, -67.5  
            Salar de Uyuni0.000.05, Salar de Uyuni, -20.2, -67.45  
            Salar de Uyuni0.05-0.05, Salar de Uyuni, -20.15, -67.55  
            Salar de Uyuni0.050.00, Salar de Uyuni, -20.15, -67.5  
            Salar de Uyuni0.050.05, Salar de Uyuni, -20.15, -67.45  
            Tibesti-0.05-0.05, Tibesti, 19.95, 17.95  
            Tibesti-0.050.00, Tibesti, 19.95, 18  
            Tibesti-0.050.05, Tibesti, 19.95, 18.05  
            Tibesti0.00-0.05, Tibesti, 20, 17.95  
            Tibesti0.000.00, Tibesti, 20, 18  
            Tibesti0.000.05, Tibesti, 20, 18.05  
            Tibesti0.05-0.05, Tibesti, 20.05, 17.95  
            Tibesti0.050.00, Tibesti, 20.05, 18  
            Tibesti0.050.05, Tibesti, 20.05, 18.05  
            Taklamakan-0.05-0.05, Taklamakan, 38.85, 82.95  
            Taklamakan-0.050.00, Taklamakan, 38.85, 83  
            Taklamakan-0.050.05, Taklamakan, 38.85, 83.05  
            Taklamakan0.00-0.05, Taklamakan, 38.9, 82.95  
            Taklamakan0.000.00, Taklamakan, 38.9, 83  
            Taklamakan0.000.05, Taklamakan, 38.9, 83.05  
            Taklamakan0.05-0.05, Taklamakan, 38.95, 82.95  
            Taklamakan0.050.00, Taklamakan, 38.95, 83  
            Taklamakan0.050.05, Taklamakan, 38.95, 83.05  
            Tolbachik Kamchatka-0.05-0.05, Tolbachik Kamchatka, 55.75, 160.25  
            Tolbachik Kamchatka-0.050.00, Tolbachik Kamchatka, 55.75, 160.3  
            Tolbachik Kamchatka-0.050.05, Tolbachik Kamchatka, 55.75, 160.35  
            Tolbachik Kamchatka0.00-0.05, Tolbachik Kamchatka, 55.8, 160.25  
            Tolbachik Kamchatka0.000.00, Tolbachik Kamchatka, 55.8, 160.3  
            Tolbachik Kamchatka0.000.05, Tolbachik Kamchatka, 55.8, 160.35  
            Tolbachik Kamchatka0.05-0.05, Tolbachik Kamchatka, 55.85, 160.25  
            Tolbachik Kamchatka0.050.00, Tolbachik Kamchatka, 55.85, 160.3  
            Tolbachik Kamchatka0.050.05, Tolbachik Kamchatka, 55.85, 160.35  
            Altiplano del Tibet-0.05-0.05, Altiplano del Tibet, 33.95, 84.95  
            Altiplano del Tibet-0.050.00, Altiplano del Tibet, 33.95, 85  
            Altiplano del Tibet-0.050.05, Altiplano del Tibet, 33.95, 85.05  
            Altiplano del Tibet0.00-0.05, Altiplano del Tibet, 34, 84.95  
            Altiplano del Tibet0.000.00, Altiplano del Tibet, 34, 85  
            Altiplano del Tibet0.000.05, Altiplano del Tibet, 34, 85.05  
            Altiplano del Tibet0.05-0.05, Altiplano del Tibet, 34.05, 84.95  
            Altiplano del Tibet0.050.00, Altiplano del Tibet, 34.05, 85  
            Altiplano del Tibet0.050.05, Altiplano del Tibet, 34.05, 85.05  
            Atacama-0.05-0.05, Atacama, -24.55, -69.25  
            Atacama-0.050.00, Atacama, -24.55, -69.2  
            Atacama-0.050.05, Atacama, -24.55, -69.15  
            Atacama0.00-0.05, Atacama, -24.5, -69.25  
            Atacama0.000.00, Atacama, -24.5, -69.2  
            Atacama0.000.05, Atacama, -24.5, -69.15  
            Atacama0.05-0.05, Atacama, -24.45, -69.25  
            Atacama0.050.00, Atacama, -24.45, -69.2  
            Atacama0.050.05, Atacama, -24.45, -69.15  
            Valles secos McMurdo-0.05-0.05, Valles secos McMurdo, -77.55, 161.95  
            Valles secos McMurdo-0.050.00, Valles secos McMurdo, -77.55, 162  
            Valles secos McMurdo-0.050.05, Valles secos McMurdo, -77.55, 162.05  
            Valles secos McMurdo0.00-0.05, Valles secos McMurdo, -77.5, 161.95  
            Valles secos McMurdo0.000.00, Valles secos McMurdo, -77.5, 162  
            Valles secos McMurdo0.000.05, Valles secos McMurdo, -77.5, 162.05  
            Valles secos McMurdo0.05-0.05, Valles secos McMurdo, -77.45, 161.95  
            Valles secos McMurdo0.050.00, Valles secos McMurdo, -77.45, 162  
            Valles secos McMurdo0.050.05, Valles secos McMurdo, -77.45, 162.05  
            Askja-0.05-0.05, Askja, 64.95, -16.75  
            Askja-0.050.00, Askja, 64.95, -16.7  
            Askja-0.050.05, Askja, 64.95, -16.65  
            Askja0.00-0.05, Askja, 65, -16.75  
            Askja0.000.00, Askja, 65, -16.7  
            Askja0.000.05, Askja, 65, -16.65  
            Askja0.05-0.05, Askja, 65.05, -16.75  
            Askja0.050.00, Askja, 65.05, -16.7  
            Askja0.050.05, Askja, 65.05, -16.65  
            Mojave-0.05-0.05, Mojave, 34.95, -116.55  
            Mojave-0.050.00, Mojave, 34.95, -116.5  
            Mojave-0.050.05, Mojave, 34.95, -116.45  
            Mojave0.00-0.05, Mojave, 35, -116.55  
            Mojave0.000.00, Mojave, 35, -116.5  
            Mojave0.000.05, Mojave, 35, -116.45  
            Mojave0.05-0.05, Mojave, 35.05, -116.55  
            Mojave0.050.00, Mojave, 35.05, -116.5  
            Mojave0.050.05, Mojave, 35.05, -116.45  
            Isla Devon-0.05-0.05, Isla Devon, 75.35, -89.05  
            Isla Devon-0.050.00, Isla Devon, 75.35, -89  
            Isla Devon-0.050.05, Isla Devon, 75.35, -88.95  
            Isla Devon0.00-0.05, Isla Devon, 75.4, -89.05  
            Isla Devon0.000.00, Isla Devon, 75.4, -89  
            Isla Devon0.000.05, Isla Devon, 75.4, -88.95  
            Isla Devon0.05-0.05, Isla Devon, 75.45, -89.05  
            Isla Devon0.050.00, Isla Devon, 75.45, -89  
            Isla Devon0.050.05, Isla Devon, 75.45, -88.95  
    
    Version: This request was processed by AppEEARS version 3.137  

## 2. Request File Listing  

- Comma-separated values file with data extracted for a specific product
  - rocky-odyssey-tierra-ASTGTM-NC-003-results.csv
- Comma-separated values file with data extracted for a specific product
  - rocky-odyssey-tierra-MOD10A1-061-results.csv
- Comma-separated values file with data extracted for a specific product
  - rocky-odyssey-tierra-MOD11A2-061-results.csv
- Text file with data pool URLs for all source granules used in the extraction
  - rocky-odyssey-tierra-granule-list.txt
- JSON request file which can be used in AppEEARS to create a new request
  - rocky-odyssey-tierra-request.json
- xml file
  - rocky-odyssey-tierra-ASTGTM-NC-003-metadata.xml
- xml file
  - rocky-odyssey-tierra-MOD10A1-061-metadata.xml
- xml file
  - rocky-odyssey-tierra-MOD11A2-061-metadata.xml  

## 3. Point Sample Extraction Process  

Datasets available in AppEEARS are served via OPeNDAP (Open-source Project for a Network Data Access Protocol) services. OPeNDAP services allow users to concisely pull pixel values from datasets via HTTPS requests. A middleware layer has been developed to interact with the OPeNDAP services. The middleware makes it possible to extract scaled data values, with associated information, for pixels corresponding to a given coordinate and date range.

**NOTE:**  

- Requested date ranges may not match the reference date for multi-day products. AppEEARS takes an inclusive approach when extracting data for sample requests, often returning data that extends beyond the requested date range. This approach ensures that the returned data includes records for the entire requested date range.  
- For multi-day (8-day, 16-day, Monthly, Yearly) MODIS and Suomi NPP, NOAA-20, and NOAA-21 VIIRS datasets, the date field in the data tables reflects the first day of the composite period.  
- If selected, the SRTM v3, ASTER GDEM v3 and Global Water Bodies Database v1, and NASADEM v1 product will be extracted regardless of the time period specified in AppEEARS because it is a static dataset. The date field in the data tables reflects the nominal SRTM date of February 11, 2000.  
- If the visualizations indicate that there are no data to display, proceed to downloading the .csv output file. Data products that have both categorical and continuous data values (e.g. MOD15A2H) are not able to be displayed within the visualizations within AppEEARS.  

## 4. Data Quality  

When available, AppEEARS extracts and returns quality assurance (QA) data for each data file returned regardless of whether the user requests it. This is done to ensure that the user possesses the information needed to determine the usability and usefulness of the data they get from AppEEARS. Most data products available through AppEEARS have an associated QA data layer. Some products have more than one QA data layer to consult. See below for more information regarding data collections/products and their associated QA data layers.  

### 4.1. MODIS (Terra, Aqua, & Combined)

All MODIS land products, as well as the MODIS Snow Cover Daily product, include quality assurance (QA) information designed to help users understand and make best use of the data that comprise each product. Results downloaded from AppEEARS and/or data directly requested via middleware services contain not only the requested pixel/data values but also the decoded QA information associated with each pixel/data value extracted.  

- See the MODIS Land Products QA Tutorials: <https://lpdaac.usgs.gov/resources/e-learning/> for more QA information regarding each MODIS land product suite.  
- See the MODIS Snow Cover Daily product user guide for information regarding QA utilization and interpretation.  

### 4.2. NASA MEaSUREs SRTM v3 (30m & 90m)  

SRTM v3 products are accompanied by an ancillary "NUM" file in place of the QA/QC files. The "NUM" files indicate the source of each SRTM pixel, as well as the number of input data scenes used to generate the SRTM v3 data for that pixel.  

- See the user guide: <https://lpdaac.usgs.gov/documents/179/SRTM_User_Guide_V3.pdf> for additional information regarding the SRTM "NUM" file.  

### 4.3. NASA VIIRS (Suomi National Polar-orbiting Partnership (Suomi NPP) & NOAA-20)  

All NASA VIIRS land products include quality information designed to help users understand and make best use of the data that comprise each product. For product-specific information, see the link to the NASA VIIRS products table provided in section 5.  

**NOTE:**  

- The version 2 Suomi NPP NASA VIIRS Surface Reflectance data products VNP09A1 and VNP09H1 contain two quality layers: `SurfReflect_State` and `SurfReflect_QC`. 

### 4.4. SMAP  

SMAP products provide multiple means to assess quality. Each data product contains bit flags, uncertainty measures, and file-level metadata that provide quality information. Results downloaded from AppEEARS and/or data directly requested via middleware services contain not only the requested pixel/data values, but also the decoded bit flag information associated with each pixel/data value extracted. For additional information regarding the specific bit flags, uncertainty measures, and file-level metadata contained in this product, refer to the Quality Assessment section of the user guide for the specific SMAP data product in your request: <https://nsidc.org/data/smap/smap-data.html>  

### 4.5. Daymet v4R1

Daymet station-level daily weather observation data and the corresponding Daymet model predicted data for three Daymet model parameters: minimum temperature (tmin), maximum temperature (tmax), and daily total precipitation (prcp) are available. These data provide information into the regional accuracy of the Daymet model for the three station-level input parameters. Corresponding comma separated value (.csv) files that contain metadata for every surface weather station for the variable-year combinations are also available. <https://doi.org/10.3334/ORNLDAAC/2129>

### 4.6. ECOSTRESS

#### 4.6.1. ECOSTRESS Swath V2  

Quality information varies by product for the ECOSTRESS product suite. Quality Assurance (QA) information for ECO_L2_LSTE.002, including the bit definition index for the quality layer, is provided in section 2.4 of the User Guide: <https://lpdaac.usgs.gov/documents/1574/ECOL2_User_Guide_V2.pdf>. For Land Surface Temperature and Emissivity (LSTE) product, the quality flags of the source data are available in the ECO_L2_LSTE.002 data product. Please note that unlike V1, the V2 LSTE product does not incorporate cloud cover into the Pixel Produced QA bit flag. This flag now relates to other variables only (See Table 6 in User Guide). Users should apply the cloud mask separately to account for pixels with cloud when using ECO_L2_LSTE.002 data product. Cloud mask derived from ECO_L2_CLOUD.002 and Water mask derived from the Shuttle Radar Topography Mission (SRTM) Digital Elevation Model are available as separate science dataset (SDS) layers in the ECO_L2_LSTE.002 data product. Additionally, cloud and cloud confidence layers are available in the ECO_L2_CLOUD.002 product. Results downloaded from AppEEARS contain requested pixel/data values, decoded Quality Assurance (QA), and cloud information associated with each pixel/data value extracted.

#### 4.6.2. ECOSTRESS Tiled V2  

Quality information varies by product for the ECOSTRESS product suite. Quality information for ECO_L2T_LSTE.002, including the bit definition index for the quality layer, is provided in section 2.4 of the User Guide: <https://lpdaac.usgs.gov/documents/1574/ECOL2_User_Guide_V2.pdf>. Results downloaded from AppEEARS contain requested pixel/data values and decoded QA information associated with each pixel/data value extracted. For Land Surface Temperature and Emissivity (LSTE) product, the quality flags of the source data are available as a separate SDS layer in the ECO_L2T_LSTE.002 collection, however this Pixel Produced QA bit flags do not account for cloud cover. Users should apply the cloud mask separately to account for pixels with cloud when using ECO_L2T_LSTE.002 collection. In addition to decoded quality information, AppEEARS returns the cloud mask information for requests including layers from ECO_L2T_LSTE.002. For high-level products, Cloud mask derived from ECO_L2_CLOUD.002 and Water mask derived from the Shuttle Radar Topography Mission (SRTM) Digital Elevation Model are available as separate science dataset (SDS) layers in the ECO_L2T_LSTE.002 data product.

The ECOSTRESS Tiled Evapotranspiration disALEXI 24-Hour L3 CONUS 70 m V002 (ECO_L3T_ET_ALEXI) and ECOSTRESS Tiled Evaporative Stress Index disALEXI 24-Hour L4 CONUS 70 m V002 (ECO_L4T_ESI_ALEXI) products provide Evapotranspiration Daily Uncertainty and Evaporative Stress Index Daily Uncertainty bands.

### 4.7. ASTER GDEM v3 and Global Water Bodies Database v1  

ASTER GDEM v3 data are accompanied by an ancillary "NUM" file in place of the QA/QC files. The "NUM" files refer to the count of ASTER Level-1A scenes that were processed for each pixel or the source of reference data used to replace anomalies. The ASTER Global Water Bodies Database v1 products do not contain QA/QC files.  

- See Section 7 of the ASTER GDEM user guide: <https://lpdaac.usgs.gov/documents/434/ASTGTM_User_Guide_V3.pdf> for additional information regarding the GDEM "NUM" file.  
- See Section 7 of the ASTER Global Water Bodies Database user guide: <https://lpdaac.usgs.gov/documents/436/ASTWBD_User_Guide_V1.pdf> for a comparison with the SRTM Water Body Dataset.  

### 4.8. NASA MEaSUREs NASADEM v1 (30m)  

NASADEM v1 products are accompanied by an ancillary "NUM" file in place of the QA/QC files. The "NUM" files indicate the source of each NASADEM pixel, as well as the number of input data scenes used to generate the NASADEM v1 data for that pixel.  

- See the NASADEM user guide: <https://lpdaac.usgs.gov/documents/592/NASADEM_User_Guide_V1.pdf> for additional information regarding the NASADEM "NUM" file.  

### 4.9. HLS v2.0  

HLS v2.0 Operational Land Imager (OLI) Surface Reflectance and TOA Brightness Daily Global 30m (HLSL30 v002) and Sentinel-2 Multi-spectral Instrument (MSI) Surface Reflectance Daily Global 30m (HLSS30 v002) products have a quality assessment layer enabling per-pixel masking of cloud, cloud shadow, snow, water, and aerosol optical thickness levels. Quality information for HLSL30 v002 and HLSS30 v002 products, including bit definitions for the quality layer can be found in section 6.4 of the User Guide: <https://lpdaac.usgs.gov/documents/1326/HLS_User_Guide_V2.pdf>.  

### 4.10. Landsat Collection 2 ARD

Landsat C2 U.S. Analysis Ready Data (ARD) products are available for conterminous United States (CONUS)(1982-Present), Alaska (1984-present), and Hawaii (1989-1993, 1999-present). These data are products of Landsat 8/9 Operational Land Imager 2 (OLI-2) / Thermal Infrared Sensor 2 (TIRS-2), Landsat 7 Enhanced Thematic Mapper Plus (ETM+) and Landsat 4-5 Thematic Mapper (TM). The ARD significantly reduces the magnitude of data processing for application scientists. These data contain a quality assessment derived from Fmask version 3.3.1, Aerosol and Cloud QA derived from atmospheric compensation algorithms, and radiometric saturation QA derived from detector's input signal level. More details can be found in the Landsat Collection 2 U.S. ARD DFCB: <https://d9-wret.s3.us-west-2.amazonaws.com/assets/palladium/production/s3fs-public/media/files/LSDS-1435%20Landsat%20C2%20US%20ARD%20Data%20Format%20Control%20Book-v3.pdf>

### 4.11. US NPS Water Balance

The US NPS Historical Water Balance products do not have associated QA files or layers.

### 4.12. EMIT L1B Radiance and L2A Reflectance

The functionality of AppEEARS surrounding EMIT data is somewhat unique. There are currently no visualizations included within the AppEEARS UI, these will be added at a later date. Point requests return a comma-separated values (.csv) file organized in long format, rather than wide format to improve readability, resulting in some duplicate data for non-wavelength associated dimensions.  EMIT L1B At-Sensor Calibrated Radiance and Geolocation Data 60m (EMITL1BRAD) collection does not include quality information. EMIT L2A Estimated Surface Reflectance and Uncertainty and Masks 60m (EMITL2ARFL) collection does not have a direct quality assessment, but has a `good_wavelengths` flag associated with atmospheric water absorption features indicating where reflectance was not calculated. Additionally, the Reflectance Uncertainty product (EMIT_L2A_RFLUNCERT) contains uncertainty estimates about the reflectance captured as per-pixel, per-band posterior standard deviations, and the EMIT L2A Mask (EMIT_L2A_Mask) contains atmospheric state estimates and binary flags that can be used for quality filtering. By default the `good_wavelengths` layer is included with all requests that include the L2A Reflectance Product. More details about the EMIT_L2A_Mask can be found in the EMITL2ARFL User Guide: <https://lpdaac.usgs.gov/documents/1569/EMITL2ARFL_User_Guide_v1.pdf>

### 4.13. EMIT L2B Estimated Mineral Identification, Band Depth and Uncertainty

Similarly to the EMIT L1B Radiance and L2A Reflectance products, AppEEARS functionality for the EMIT L2B Mineralogy is also unique. The EMIT L2B Estimated Mineral Identification, Band Depth and Uncertainty 60m ([EMITL2BMIN](https://doi.org/10.5067/EMIT/EMITL2BMIN.001)) collection is generated using the [Tetracorder system](https://www.usgs.gov/publications/tetracorder-user-guide-version-44?_gl=1*1eoj33d*_ga*MTU3MTA3ODgxNS4xNjQ5MTg1MDgx*_ga_0YWDZEJ295*MTY4NjkyNTg0Mi40NC4xLjE2ODY5MjU4NzMuMC4wLjA.) ([code](https://github.com/PSI-edu/spectroscopy-tetracorder)). Point requests return a comma-separated values (.csv) file organized in long format, rather than wide format to improve readability, resulting in some duplicate data for non-group associated dimensions. These outputs also include quality data from the EMITL2BMINUNCERT product by default. This quality data includes the band depth uncertainty estimates and a fit score for the mineral identification. Band depth uncertainties are presented as standard deviations and the fit score is provided as the coefficient of determination (r^2) of the match between the continuum normalized library reference and the continuum normalized observed spectrum. There are currently no visualizations included within the AppEEARS UI, these will be added at a later date. More info can be found on the [EMITL2BMIN collection page](https://doi.org/10.5067/EMIT/EMITL2BMIN.001).

### 4.14. Plankton, Aerosol, Cloud, ocean Ecosystem (PACE) Ocean Color (OCI) Level-3 Global Mapped Data

PACE OCI Level-3 Global Mapped Surface Reflectance data do not have associated QA files or layers. Users should review the [documentation](https://www.earthdata.nasa.gov/data/catalog/ob-cloud-pace-oci-l3m-sfrefl-3.1#documents-and-resources) for more information on atmospheric correction and quality flags.

### 4.15 National Land Cover Database (NLCD)

NLCD data do not have associated QA files or layers. However, NLCD does provide a Land Cover Confidence layer as part of the product. For more information on how land cover confidence is measured, see the documentation (https://doi.org/10.5066/P1KWQF2G).

### 4.16. ECOSTRESS/OCO-3 Co-Located Data (ECOCO3)

ECOCO3 data do not have an associated QA layer. Please refer to the Data Disclaimer and Data Quality Issues sections in the product [README document](https://docserver.gesdisc.eosdis.nasa.gov/public/project/OCO/ECOSTRESS/ECOCO3_Readme_v002_20260903.pdf) for more details. 

## 5. Data Caveats  

### 5.1. ECOSTRESS

#### 5.1.1. ECOSTRESS Swath V2

- ECOSTRESS Swath data products are natively stored in swath format. To fulfill AppEEARS requests for ECOSTRESS Swath products, the data are first resampled from the native swath format to a georeferenced output. This requires the use of the requested ECOSTRESS product files and the corresponding ECO1BGEO: <https://doi.org/10.5067/ECOSTRESS/ECO1BGEO.001> files for all ECOSTRESS Swath products. To do this conversion, an index array and distance array are created, then the nearest area pixel is located. Next, the Euclidean distance to that area pixel plus all surrounding pixels is measured within a 210 meter search radius (+/- a 3 pixels). This results in 49 pixels measured for every swath pixel. If the distance measured is less than what's currently present in any distance array, then the new distance as well as the swath index value are recorded into the index array used to convert to an area output.

#### 5.1.2. ECOSTRESS Tiled V2

- It is not uncommon for many .csv cells returned to contain NaN values. If any layer requested or the QC layer contains valid data, the remaining requested layers will be returned even if only NaN values are present.

### 5.2. NASA VIIRS SNPP, NOAA-20, and NOAA-21

- Several products from these instruments have multiple fill values that describe categorical information (i.e. water/ocean) about why the pixel was not processed in the source data. If one of these additional fill-values is returned as part of a point request it is returned without the scale factor applied to enable users to easily identify and decode the value. The fill values will be outside the indicated valid range. Products where this is the case include:
    - VNP13, VJ113, and VJ213 Vegetation Indices Products
    - VNP15, VJ115, and VJ215 Leaf Area Index/FPAR Products
    - VNP17, VJ117, and VJ217 Gross Primary Productivity and Photosynthesis Products
    - VNP22, VJ122, and VJ222 Land Surface Phenology Products

#### 5.2.1. Suomi NPP VIIRS Land Surface Phenology Product (VNP22Q2)

- A subset of the science datasets/variables for VNP22Q2 are returned in their raw, unscaled form. That is, these variables are returned without having their scale factor and offset applied. AppEEARS visualizations and output summary files are derived using the raw data value, and consequently do not characterize the intended information ("day of year") for the impacted variables. The variables returned in this state include:  

    1. Date_Mid_Greenup_Phase (Cycle 1 and Cycle 2)  
    2. Date_Mid_Senescence_Phase (Cycle 1 and Cycle 2)  
    3. Onset_Greenness_Increase (Cycle 1 and Cycle 2)  
    4. Onset_Greenness_Decrease (Cycle 1 and Cycle 2)  
    5. Onset_Greenness_Maximum (Cycle 1 and Cycle 2)  
    6. Onset_Greenness_Minimum (Cycle 1 and Cycle 2)  

- To convert the raw data to "day of year" (doy) for the above variables, use the following equation:  

      doy = Raw_Data_Value * 1 – (Given_Year - 2000) * 366

### 5.3. SMAP

#### 5.3.1. SMAP Enhanced L3 Radiometer Global and Polar Grid Daily 9 km EASE-Grid Soil Moisture (SPL3SMP_E)

- The SPL3SMP_E includes additional layers for AM and PM north-polar grid soil moisture retrievals. These additional layers are not supported in AppEEARS.

#### 5.3.2. SMAP L4 Global 3-hourly 9 km EASE-Grid Surface and Root Zone Soil Moisture Geophysical Data (SPL4SMGP)

- The SPL4SMGP provides 3-hourly data within a single day. AppEEARS specifies the observation date and time in the output CSV file.

### 5.4. HLS v2.0

- When requesting HLS timeseries, note that Sentinel-2 launched after Landsat was already active. Landsat OLI (HLSL30 v002) products are available from 2013-04-11 to present, while Sentinel-2 MSI products (HLSS30 v002) are available from  2015-11-30 to present.
- Point requests are returned in geographic coordinates.  
- Extra granules may appear in the granule list output file if the target point is close to an area where MGRS tiles overlap.
- Historical processing of the HLS Vegetation Indices (VI) products (HLSS30_VI v002 and HLSL30_VI v002) has not started as of May 9, 2025. Data currently available in AppEEARS is from February 6, 2025 to present. 

### 5.5. MOD44B V6.1

- Value zero in the Cloud and Quality layers from MOD44B Version 6.1 Vegetation Continuous Fields (VCF) yearly product is assigned to Fill Value in the source file while value zero is meaningful for those layers. If comparing Cloud and Quality layers outputs with source files, users may notice that within the source files zero is assigned to fill value, however zero is within the valid range. Thus, AppEEARS outputs use -999 as a fill value for those layers.

### 5.6. EMIT L1B Radiance and L2A Reflectance

- Elevation data is always included in requests. For API users there is an additional 'elev' layer listed, but that layer cannot be requested. This has to be present due to some constraints of AppEEARS' backend.
- For L1B Radiance and L2A reflectance products, the default included quality layer is 'good bands' which denotes where radiance/reflectance data were not estimated due to atmospheric water absorption features. This is included with all requests.
- The EMIT mission is focused on collecting data from land arid dust source regions, meaning that coverage is limited to those regions based upon a mask. You can explore coverage and forecasted coverage using Jet Propulsion Laboratory's [Visions: EMIT Open Data Portal](https://earth.jpl.nasa.gov/emit/data/data-portal/coverage-and-forecasts/)

### 5.7. EMIT L2B Estimated Mineral Identification, Band Depth and Uncertainty

- The EMIT_L2B_MIN product is generated to support the EMIT mission objectives of constraining the sign of dust-related radiative forcing. Ten mineral types are the core focus of this work: Calcite, Chlorite, Dolomite, Goethite, Gypsum, Hematite, Illite+Muscovite, Kaolinite, Montmorillonite, and Vermiculite. Additional minerals are included in this product for transparency but were not the focus of this product. Further validation is required to use these additional mineral maps, particularly in the case of resource exploration. Similarly, the separation of minerals with similar spectral features, such as a fine-grained goethite and hematite, is an active research area. The results presented here are an initial offering, but the precise categorization is likely to evolve, and the limits of what can and cannot be separated on a global scale are still being explored. The user is encouraged to read the Algorithm Theoretical Basis Document ([ATBD](https://lpdaac.usgs.gov/documents/1659/EMITL2B_ATBD_v1.pdf)) for more details.  
- "no_match" was added to the mineral library constituents for cases where no match was found via the tetracorder system (this has a value of 0 in the original data, but there is not an entry with an index of 0 in the "mineral_metadata" group).
- Elevation data is always included in requests. For API users there is an additional 'elev' layer listed, but that layer cannot be requested. This has to be present due to some constraints of AppEEARS' backend.

### 5.8. PACE OCI  Level-3 Global Mapped Data

- PACE OCI  Level-3 Global Mapped Data provide global coverage at three spatial resolutions — 0.1 degree, 2 km, and 4 km — and two temporal compositing intervals: daily and 8-day. To streamline data access and eliminate the need to filter by resolution or temporal period within a single collection, each collection has been integrated into AppEEARS as six separate products, one per resolution and temporal combination. Users are advised to select the collection that corresponds to their required spatial resolution and temporal compositing interval prior to submitting a request.

Collection names follow the convention PACE_OCI_L3M_SFREFL_[RESOLUTION]_[TEMPORAL], where resolution is denoted as 0p1deg, 2KM, or 4KM, and temporal interval as DAY or 8D.

### 5.9. ECOSTRESS/OCO-3 Co-Located Data (ECOCO3)

- ECOCO3 source data includes multiple groups. AppEEARS outputs include all the variables under the `Science` group and exclude the `GridCoverage`, `Geolocation`, and `GridDenominators` groups. 
- For Land Cover Type and Fraction from MODIS and VIIRS, the layers are selectable in AppEEARS, but the results include four separate files for each layer selection. For Land Cover Type Classes for both VIIRS and MODIS, the classes follow the same approach as MCD12Q1 (Table 3 in the [MCD12 User Guide](https://lpdaac.usgs.gov/documents/1409/MCD12_User_Guide_V61.pdf)). When a pixel contains only one Land Cover Type, or fewer than four within a single pixel, AppEEARS returns a fill value of -127 for the remaining Land Cover Type and Fraction layers. 
- There is no visualization available for Land Cover Fraction variable. 

## 6. Documentation  

Documentation for data products available through AppEEARS are listed below.  

### 6.1. MODIS Land Products (Terra, Aqua, & Combined)  

- <https://lpdaac.usgs.gov/product_search/?collections=Combined+MODIS&collections=Terra+MODIS&collections=Aqua+MODIS&view=list>  

### 6.2. MODIS Snow Products (Terra and Aqua)  

- <https://nsidc.org/data/modis/data_summaries>  

### 6.3. NASA MEaSUREs SRTM v3  

- <https://doi.org/10.5067/MEASURES/SRTM/SRTMGL1.003>  
- <https://doi.org/10.5067/MEASURES/SRTM/SRTMGL1N.003>  
- <https://doi.org/10.5067/MEaSUREs/SRTM/SRTMGL3.003>  
- <https://doi.org/10.5067/MEASURES/SRTM/SRTMGL3N.003>  

### 6.4. NASA VIIRS Land Products (Includes Suomi NPP, NOAA-20, and NOAA-21)  

- <https://www.earthdata.nasa.gov/data/catalog?keyword=VIIRS%20LP%20DAAC>  

### 6.5. SMAP Products  

- <http://nsidc.org/data/smap/smap-data.html>  

### 6.6. Daymet v4R1

- <https://doi.org/10.3334/ORNLDAAC/2129>
- <https://daymet.ornl.gov/>

### 6.7. ECOSTRESS  

- <https://www.earthdata.nasa.gov/data/catalog?keyword=ECOSTRESS&page_num=4>  

### 6.8. ASTER GDEM v3 and Global Water Bodies Database v1  

- <https://doi.org/10.5067/ASTER/ASTGTM.003>  
- <https://doi.org/10.5067/ASTER/ASTWBD.001>  

### 6.9. NASADEM  

- <https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_NC.001>  
- <https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_NUMNC.001> 

### 6.10. HLS v2.0  
 
- <https://doi.org/10.5067/HLS/HLSL30.002>  
- <https://doi.org/10.5067/HLS/HLSS30.002>  

### 6.11. Landsat ARD

- <https://doi.org/10.5066/P960F8OC>

### 6.12. EMIT L1B Radiance and L2A Reflectance

- <https://doi.org/10.5067/EMIT/EMITL1BRAD.001>
- <https://doi.org/10.5067/EMIT/EMITL2ARFL.001>

### 6.13. EMIT L2B Estimated Mineral Identification, Band Depth and Uncertainty

- <https://doi.org/10.5067/EMIT/EMITL2BMIN.001>

### 6.14.  NASA VIIRS Snow Products (Includes Suomi NPP, NOAA-20, and NOAA-21)

- <https://doi.org/10.5067/45VDCKJBXWEE>

### 6.15. PACE OCI Level-3 Global Mapped Surface Reflectance Data

- <https://doi.org/10.5067/PACE/OCI/L3M/SFREFL/3.1>

### 6.16. National Land Cover Database (NLCD)

- <https://www.mrlc.gov/sites/default/files/docs/LSDS-2103%20Annual%20National%20Land%20Cover%20Database%20(NLCD)%20Collection%201%20Science%20Product%20User%20Guide%20-v1.2%202026_04_21.pdf>

### 6.17. ECOSTRESS/OCO-3 Co-Located Data (ECOCO3)

- <https://docserver.gesdisc.eosdis.nasa.gov/public/project/OCO/ECOSTRESS/ECOCO3_Readme_v002_20260903.pdf>
- <https://docserver.gesdisc.eosdis.nasa.gov/public/project/OCO/ECOSTRESS/ECOCO3_Sequence_Locations_v002_20260903.pdf>

## 7. Sample Request Retention  

AppEEARS sample request outputs are available to download for a limited amount of time after completion. Please visit <https://appeears.earthdatacloud.nasa.gov/help?section=sample-retention> for details.  

## 8. Data Product Citations  

- Hall, D., Riggs, G. (2016). MODIS/Terra Snow Cover Daily L3 Global 500m Grid, Version 6. Boulder, Colorado USA. NASA National Snow and Ice Data Center Distributed Active Archive Center. doi: 10.5067/MODIS/MOD10A1.061. Accessed November 14, 2026.
- NASA/METI/AIST/Japan Spacesystems and U.S./Japan ASTER Science Team. (2019). ASTER Global Digital Elevation Model NetCDF V003. NASA Land Processes Distributed Active Archive Center. https://doi.org/10.5067/ASTER/ASTGTM_NC.003. Accessed November 14, 2026.
- Wan, Z., Hook, S., & Hulley, G. (2021). MODIS/Terra Land Surface Temperature/Emissivity 8-Day L3 Global 1km SIN Grid V061. NASA Land Processes Distributed Active Archive Center. https://doi.org/10.5067/MODIS/MOD11A2.061. Accessed November 14, 2026.

## 9. Software Citation  

AppEEARS Team. (2026). Application for Extracting and Exploring Analysis Ready Samples (AppEEARS). Ver. 3.137. NASA EOSDIS Land Processes Distributed Active Archive Center (LP DAAC), USGS/Earth Resources Observation and Science (EROS) Center, Sioux Falls, South Dakota, USA. Accessed November 14, 2026. https://appeears.earthdatacloud.nasa.gov

## 10. Feedback  

We value your opinion. Please help us identify what works, what doesn't, and anything we can do to make AppEEARS better by submitting your feedback at <https://appeears.earthdatacloud.nasa.gov/feedback> or to LP DAAC User Services at <https://lpdaac.usgs.gov/lpdaac-contact-us/>.
