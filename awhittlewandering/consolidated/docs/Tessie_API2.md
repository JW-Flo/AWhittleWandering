{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 Access the Tessie API\
\
The Tessie API is powered by our [Tesla Fleet API layer](https://developer.tessie.com/reference/access-tesla-fleet-api).\
\
On top of the benefits provided by our Tesla Fleet API layer, the Tessie API includes many additions:\
\
* Get the last known state of a vehicle, even if the vehicle is asleep or offline\
* Get the state of many vehicles at once\
* Historical state data\
* Driving data\
* Charging data\
* Idling data\
* Battery health data\
* Map generation\
* Energy consumption data\
* Weather data\
* Automatic firmware error handling when issuing commands\
* Automatic wake handling when issuing commands\
\
## Get Started\
\
Simply point any API request at: `https://api.tessie.com`\
\
Provide your access token in an Authorization header or as the access\\_token query parameter. [Learn more.](https://developer.tessie.com/reference/intro/authentication)\
\
You can see all endpoints by browsing the menu on this page.\
\
Get Drivers\
\
# OpenAPI definition\
```json\
\{\
  "_id": "/branches/2.0/apis/openapi.yaml",\
  "openapi": "3.0.0",\
  "info": \{\
    "title": "Tessie API",\
    "version": "1.0.0",\
    "license": \{\
      "name": "Apache 2.0",\
      "url": "https://www.apache.org/licenses/LICENSE-2.0.html"\
    \},\
    "description": "The Tesla management platform.",\
    "contact": \{\
      "name": "Tessie",\
      "url": "https://tessie.com",\
      "email": "support@tessie.com"\
    \},\
    "x-logo": \{\
      "url": ""\
    \},\
    "termsOfService": "https://tessie.com/terms"\
  \},\
  "servers": [\
    \{\
      "url": "https://api.tessie.com"\
    \}\
  ],\
  "paths": \{\
    "/\{vin\}/drivers": \{\
      "get": \{\
        "parameters": [],\
        "responses": \{\
          "200": \{\
            "description": "OK",\
            "content": \{\
              "application/json": \{\
                "schema": \{\
                  "type": "object",\
                  "properties": \{\
                    "results": \{\
                      "type": "array",\
                      "items": \{\
                        "type": "object",\
                        "properties": \{\
                          "my_tesla_unique_id": \{\
                            "type": "integer"\
                          \},\
                          "user_id": \{\
                            "type": "integer"\
                          \},\
                          "user_id_s": \{\
                            "type": "string"\
                          \},\
                          "driver_first_name": \{\
                            "type": "string"\
                          \},\
                          "driver_last_name": \{\
                            "type": "string"\
                          \},\
                          "granular_access": \{\
                            "type": "object",\
                            "properties": \{\
                              "hide_private": \{\
                                "type": "boolean"\
                              \}\
                            \}\
                          \},\
                          "active_pubkeys": \{\
                            "type": "array",\
                            "items": \{\
                              "type": "string"\
                            \}\
                          \},\
                          "public_key": \{\
                            "type": "string"\
                          \}\
                        \}\
                      \}\
                    \}\
                  \},\
                  "x-examples": \{\
                    "Example 1": \{\
                      "results": [\
                        \{\
                          "my_tesla_unique_id": 123456789,\
                          "user_id": 222222,\
                          "user_id_s": "222222",\
                          "driver_first_name": "Jane",\
                          "driver_last_name": "Doe",\
                          "granular_access": \{\
                            "hide_private": false\
                          \},\
                          "active_pubkeys": [\
                            "043da2708632f7d7c01f6cacdd82400746asdfd475c37a6adfaa19aed565f3e254790c1baaac94ee2c68349642d21e16bf89c70a13019516ed475104c945cb3d53"\
                          ],\
                          "public_key": ""\
                        \},\
                        \{\
                          "my_tesla_unique_id": 12345678,\
                          "user_id": 111111,\
                          "user_id_s": "222222",\
                          "driver_first_name": "John",\
                          "driver_last_name": "Doe",\
                          "granular_access": \{\
                            "hide_private": false\
                          \},\
                          "active_pubkeys": [\
                            "04b7f61ba31002e4646f647953e2a2813e72e7315asdfe2bfa0badad9d42c0e3762e581c5ae58010146ccd9288333ceff26b84e57ae624fc4f7428ee20e719f00d"\
                          ],\
                          "public_key": "04b7f61ba31002e4646f647953e2a2813e72e7315asdfe2bfa0badad9d42c0e3762e581c5ae58010146ccd9288333ceff26b84e57ae624fc4f7428ee20e719f00d"\
                        \}\
                      ]\
                    \}\
                  \}\
                \},\
                "examples": \{\
                  "Example 1": \{\
                    "value": \{\
                      "results": [\
                        \{\
                          "my_tesla_unique_id": 88888888,\
                          "user_id": 1234567,\
                          "user_id_s": "1234567",\
                          "driver_first_name": "Jane",\
                          "driver_last_name": "Doe",\
                          "granular_access": \{\
                            "hide_private": false\
                          \},\
                          "active_pubkeys": [\
                            "043da2708632f7d7c01f6casdf824007465408d475c37a6adfaa19aed565f3e254790c1baaac94ee2c68349642d21e16bf89c70a13019516ed475104c945cb3d53"\
                          ],\
                          "public_key": ""\
                        \},\
                        \{\
                          "my_tesla_unique_id": 99999999,\
                          "user_id": 123456,\
                          "user_id_s": "123456",\
                          "driver_first_name": "John",\
                          "driver_last_name": "Doe",\
                          "granular_access": \{\
                            "hide_private": false\
                          \},\
                          "active_pubkeys": [\
                            "04b7f61ba31002e4646f64795asdf2813e72e73159947e2bfa0badad9d42c0e3762e581c5ae58010146ccd9288333ceff26b84e57ae624fc4f7428ee20e719f00d"\
                          ],\
                          "public_key": "04b7f61ba31002e4646f64795asdf2813e72e73159947e2bfa0badad9d42c0e3762e581c5ae58010146ccd9288333ceff26b84e57ae624fc4f7428ee20e719f00d"\
                        \}\
                      ]\
                    \}\
                  \}\
                \}\
              \}\
            \}\
          \}\
        \},\
        "operationId": "get-drivers",\
        "summary": "Get Drivers",\
        "description": "Returns a list of additional drivers.",\
        "x-stoplight": \{\
          "id": "asydyeacarbox"\
        \},\
        "tags": [\
          "Driver Management"\
        ]\
      \},\
      "parameters": [\
        \{\
          "name": "vin",\
          "description": "The associated VIN.",\
          "schema": \{\
            "type": "string"\
          \},\
          "in": "path",\
          "required": true,\
          "deprecated": false,\
          "x-last-modified": 1643747623235,\
          "example": "5YJXCAE43LF123456"\
        \}\
      ]\
    \}\
  \},\
  "components": \{\
    "securitySchemes": \{\
      "bearerAuth": \{\
        "scheme": "bearer",\
        "type": "http"\
      \}\
    \}\
  \},\
  "security": [\
    \{\
      "bearerAuth": []\
    \}\
  ],\
  "tags": [\
    \{\
      "name": "Driver Management",\
      "description": "Driver management endpoints"\
    \}\
  ]\
\}\
```\
\
Get Vehicle\
\
# OpenAPI definition\
```json\
\{\
  "_id": "/branches/2.0/apis/openapi.yaml",\
  "openapi": "3.0.0",\
  "info": \{\
    "title": "Tessie API",\
    "version": "1.0.0",\
    "license": \{\
      "name": "Apache 2.0",\
      "url": "https://www.apache.org/licenses/LICENSE-2.0.html"\
    \},\
    "description": "The Tesla management platform.",\
    "contact": \{\
      "name": "Tessie",\
      "url": "https://tessie.com",\
      "email": "support@tessie.com"\
    \},\
    "x-logo": \{\
      "url": ""\
    \},\
    "termsOfService": "https://tessie.com/terms"\
  \},\
  "servers": [\
    \{\
      "url": "https://api.tessie.com"\
    \}\
  ],\
  "paths": \{\
    "/\{vin\}/state": \{\
      "get": \{\
        "tags": [\
          "Vehicle Data"\
        ],\
        "parameters": [\
          \{\
            "name": "vin",\
            "description": "The associated VIN.",\
            "schema": \{\
              "type": "string"\
            \},\
            "in": "path",\
            "required": true,\
            "deprecated": false,\
            "x-last-modified": 1643747623235,\
            "example": "5YJXCAE43LF123456"\
          \},\
          \{\
            "name": "use_cache",\
            "description": "Whether to return the most recently seen data. Set to false to retrieve the vehicle state in real-time. If true, doesn't impact vehicle sleep and always returns a complete set of data.",\
            "schema": \{\
              "default": true,\
              "type": "boolean"\
            \},\
            "in": "query"\
          \}\
        ],\
        "responses": \{\
          "200": \{\
            "content": \{\
              "application/json": \{\
                "schema": \{\
                  "type": "object",\
                  "properties": \{\
                    "id": \{\
                      "type": "integer"\
                    \},\
                    "vin": \{\
                      "type": "string"\
                    \},\
                    "id_s": \{\
                      "type": "string"\
                    \},\
                    "color": \{\
                      "type": "string"\
                    \},\
                    "state": \{\
                      "type": "string"\
                    \},\
                    "user_id": \{\
                      "type": "integer"\
                    \},\
                    "in_service": \{\
                      "type": "boolean"\
                    \},\
                    "vehicle_id": \{\
                      "type": "integer"\
                    \},\
                    "access_type": \{\
                      "type": "string"\
                    \},\
                    "api_version": \{\
                      "type": "integer"\
                    \},\
                    "drive_state": \{\
                      "type": "object",\
                      "properties": \{\
                        "power": \{\
                          "type": "integer"\
                        \},\
                        "speed": \{\
                          "type": "string"\
                        \},\
                        "heading": \{\
                          "type": "integer"\
                        \},\
                        "latitude": \{\
                          "type": "number"\
                        \},\
                        "gps_as_of": \{\
                          "type": "integer"\
                        \},\
                        "longitude": \{\
                          "type": "number"\
                        \},\
                        "timestamp": \{\
                          "type": "integer"\
                        \},\
                        "native_type": \{\
                          "type": "string"\
                        \},\
                        "shift_state": \{\
                          "type": "string"\
                        \},\
                        "native_latitude": \{\
                          "type": "number"\
                        \},\
                        "native_longitude": \{\
                          "type": "number"\
                        \},\
                        "native_location_supported": \{\
                          "type": "integer"\
                        \},\
                        "active_route_destination": \{\
                          "type": "string"\
                        \},\
                        "active_route_energy_at_arrival": \{\
                          "type": "integer"\
                        \},\
                        "active_route_latitude": \{\
                          "type": "number"\
                        \},\
                        "active_route_longitude": \{\
                          "type": "number"\
                        \},\
                        "active_route_miles_to_arrival": \{\
                          "type": "number"\
                        \},\
                        "active_route_minutes_to_arrival": \{\
                          "type": "number"\
                        \},\
                        "active_route_traffic_minutes_delay": \{\
                          "type": "integer"\
                        \}\
                      \}\
                    \},\
                    "charge_state": \{\
                      "type": "object",\
                      "properties": \{\
                        "timestamp": \{\
                          "type": "integer"\
                        \},\
                        "charge_amps": \{\
                          "type": "integer"\
                        \},\
                        "charge_rate": \{\
                          "type": "integer"\
                        \},\
                        "battery_level": \{\
                          "type": "integer"\
                        \},\
                        "battery_range": \{\
                          "type": "number"\
                        \},\
                        "charger_power": \{\
                          "type": "integer"\
                        \},\
                        "trip_charging": \{\
                          "type": "boolean"\
                        \},\
                        "charger_phases": \{\
                          "type": "string"\
                        \},\
                        "charging_state": \{\
                          "type": "string"\
                        \},\
                        "charger_voltage": \{\
                          "type": "integer"\
                        \},\
                        "charge_limit_soc": \{\
                          "type": "integer"\
                        \},\
                        "battery_heater_on": \{\
                          "type": "boolean"\
                        \},\
                        "charge_port_color": \{\
                          "type": "string"\
                        \},\
                        "charge_port_latch": \{\
                          "type": "string"\
                        \},\
                        "conn_charge_cable": \{\
                          "type": "string"\
                        \},\
                        "est_battery_range": \{\
                          "type": "number"\
                        \},\
                        "fast_charger_type": \{\
                          "type": "string"\
                        \},\
                        "fast_charger_brand": \{\
                          "type": "string"\
                        \},\
                        "charge_energy_added": \{\
                          "type": "number"\
                        \},\
                        "charge_to_max_range": \{\
                          "type": "boolean"\
                        \},\
                        "ideal_battery_range": \{\
                          "type": "integer"\
                        \},\
                        "time_to_full_charge": \{\
                          "type": "integer"\
                        \},\
                        "charge_limit_soc_max": \{\
                          "type": "integer"\
                        \},\
                        "charge_limit_soc_min": \{\
                          "type": "integer"\
                        \},\
                        "charge_limit_soc_std": \{\
                          "type": "integer"\
                        \},\
                        "fast_charger_present": \{\
                          "type": "boolean"\
                        \},\
                        "usable_battery_level": \{\
                          "type": "integer"\
                        \},\
                        "charge_enable_request": \{\
                          "type": "boolean"\
                        \},\
                        "charge_port_door_open": \{\
                          "type": "boolean"\
                        \},\
                        "charger_pilot_current": \{\
                          "type": "integer"\
                        \},\
                        "preconditioning_times": \{\
                          "type": "string"\
                        \},\
                        "charge_current_request": \{\
                          "type": "integer"\
                        \},\
                        "charger_actual_current": \{\
                          "type": "integer"\
                        \},\
                        "minutes_to_full_charge": \{\
                          "type": "integer"\
                        \},\
                        "managed_charging_active": \{\
                          "type": "boolean"\
                        \},\
                        "off_peak_charging_times": \{\
                          "type": "string"\
                        \},\
                        "off_peak_hours_end_time": \{\
                          "type": "integer"\
                        \},\
                        "preconditioning_enabled": \{\
                          "type": "boolean"\
                        \},\
                        "scheduled_charging_mode": \{\
                          "type": "string"\
                        \},\
                        "charge_miles_added_ideal": \{\
                          "type": "integer"\
                        \},\
                        "charge_miles_added_rated": \{\
                          "type": "number"\
                        \},\
                        "max_range_charge_counter": \{\
                          "type": "integer"\
                        \},\
                        "not_enough_power_to_heat": \{\
                          "type": "boolean"\
                        \},\
                        "scheduled_departure_time": \{\
                          "type": "integer"\
                        \},\
                        "off_peak_charging_enabled": \{\
                          "type": "boolean"\
                        \},\
                        "charge_current_request_max": \{\
                          "type": "integer"\
                        \},\
                        "scheduled_charging_pending": \{\
                          "type": "boolean"\
                        \},\
                        "user_charge_enable_request": \{\
                          "type": "string"\
                        \},\
                        "managed_charging_start_time": \{\
                          "type": "string"\
                        \},\
                        "charge_port_cold_weather_mode": \{\
                          "type": "string"\
                        \},\
                        "scheduled_charging_start_time": \{\
                          "type": "string"\
                        \},\
                        "managed_charging_user_canceled": \{\
                          "type": "boolean"\
                        \},\
                        "scheduled_departure_time_minutes": \{\
                          "type": "integer"\
                        \},\
                        "scheduled_charging_start_time_app": \{\
                          "type": "integer"\
                        \},\
                        "supercharger_session_trip_planner": \{\
                          "type": "boolean"\
                        \},\
                        "pack_current": \{\
                          "type": "number"\
                        \},\
                        "pack_voltage": \{\
                          "type": "number"\
                        \},\
                        "module_temp_min": \{\
                          "type": "number"\
                        \},\
                        "module_temp_max": \{\
                          "type": "integer"\
                        \},\
                        "energy_remaining": \{\
                          "type": "number"\
                        \},\
                        "lifetime_energy_used": \{\
                          "type": "number"\
                        \}\
                      \}\
                    \},\
                    "display_name": \{\
                      "type": "string"\
                    \},\
                    "gui_settings": \{\
                      "type": "object",\
                      "properties": \{\
                        "timestamp": \{\
                          "type": "integer"\
                        \},\
                        "gui_24_hour_time": \{\
                          "type": "boolean"\
                        \},\
                        "show_range_units": \{\
                          "type": "boolean"\
                        \},\
                        "gui_range_display": \{\
                          "type": "string"\
                        \},\
                        "gui_distance_units": \{\
                          "type": "string"\
                        \},\
                        "gui_charge_rate_units": \{\
                          "type": "string"\
                        \},\
                        "gui_temperature_units": \{\
                          "type": "string"\
                        \}\
                      \}\
                    \},\
                    "option_codes": \{\
                      "type": "string"\
                    \},\
                    "climate_state": \{\
                      "type": "object",\
                      "properties": \{\
                        "timestamp": \{\
                          "type": "integer"\
                        \},\
                        "fan_status": \{\
                          "type": "integer"\
                        \},\
                        "inside_temp": \{\
                          "type": "number"\
                        \},\
                        "defrost_mode": \{\
                          "type": "integer"\
                        \},\
                        "outside_temp": \{\
                          "type": "number"\
                        \},\
                        "is_climate_on": \{\
                          "type": "boolean"\
                        \},\
                        "battery_heater": \{\
                          "type": "boolean"\
                        \},\
                        "bioweapon_mode": \{\
                          "type": "boolean"\
                        \},\
                        "max_avail_temp": \{\
                          "type": "integer"\
                        \},\
                        "min_avail_temp": \{\
                          "type": "integer"\
                        \},\
                        "seat_heater_left": \{\
                          "type": "integer"\
                        \},\
                        "hvac_auto_request": \{\
                          "type": "string"\
                        \},\
                        "seat_heater_right": \{\
                          "type": "integer"\
                        \},\
                        "is_preconditioning": \{\
                          "type": "boolean"\
                        \},\
                        "wiper_blade_heater": \{\
                          "type": "boolean"\
                        \},\
                        "climate_keeper_mode": \{\
                          "type": "string"\
                        \},\
                        "driver_temp_setting": \{\
                          "type": "number"\
                        \},\
                        "left_temp_direction": \{\
                          "type": "integer"\
                        \},\
                        "side_mirror_heaters": \{\
                          "type": "boolean"\
                        \},\
                        "is_rear_defroster_on": \{\
                          "type": "boolean"\
                        \},\
                        "right_temp_direction": \{\
                          "type": "integer"\
                        \},\
                        "is_front_defroster_on": \{\
                          "type": "boolean"\
                        \},\
                        "seat_heater_rear_left": \{\
                          "type": "integer"\
                        \},\
                        "steering_wheel_heater": \{\
                          "type": "boolean"\
                        \},\
                        "passenger_temp_setting": \{\
                          "type": "number"\
                        \},\
                        "seat_heater_rear_right": \{\
                          "type": "integer"\
                        \},\
                        "battery_heater_no_power": \{\
                          "type": "boolean"\
                        \},\
                        "is_auto_conditioning_on": \{\
                          "type": "boolean"\
                        \},\
                        "seat_heater_rear_center": \{\
                          "type": "integer"\
                        \},\
                        "cabin_overheat_protection": \{\
                          "type": "string"\
                        \},\
                        "seat_heater_third_row_left": \{\
                          "type": "integer"\
                        \},\
                        "seat_heater_third_row_right": \{\
                          "type": "integer"\
                        \},\
                        "remote_heater_control_enabled": \{\
                          "type": "boolean"\
                        \},\
                        "allow_cabin_overheat_protection": \{\
                          "type": "boolean"\
                        \},\
                        "supports_fan_only_cabin_overheat_protection": \{\
                          "type": "boolean"\
                        \}\
                      \}\
                    \},\
                    "vehicle_state": \{\
                      "type": "object",\
                      "properties": \{\
                        "df": \{\
                          "type": "integer"\
                        \},\
                        "dr": \{\
                          "type": "integer"\
                        \},\
                        "ft": \{\
                          "type": "integer"\
                        \},\
                        "pf": \{\
                          "type": "integer"\
                        \},\
                        "pr": \{\
                          "type": "integer"\
                        \},\
                        "rt": \{\
                          "type": "integer"\
                        \},\
                        "locked": \{\
                          "type": "boolean"\
                        \},\
                        "odometer": \{\
                          "type": "number"\
                        \},\
                        "fd_window": \{\
                          "type": "integer"\
                        \},\
                        "fp_window": \{\
                          "type": "integer"\
                        \},\
                        "rd_window": \{\
                          "type": "integer"\
                        \},\
                        "rp_window": \{\
                          "type": "integer"\
                        \},\
                        "timestamp": \{\
                          "type": "integer"\
                        \},\
                        "santa_mode": \{\
                          "type": "integer"\
                        \},\
                        "valet_mode": \{\
                          "type": "boolean"\
                        \},\
                        "api_version": \{\
                          "type": "integer"\
                        \},\
                        "car_version": \{\
                          "type": "string"\
                        \},\
                        "media_state": \{\
                          "type": "object",\
                          "properties": \{\
                            "remote_control_enabled": \{\
                              "type": "boolean"\
                            \}\
                          \}\
                        \},\
                        "sentry_mode": \{\
                          "type": "boolean"\
                        \},\
                        "remote_start": \{\
                          "type": "boolean"\
                        \},\
                        "vehicle_name": \{\
                          "type": "string"\
                        \},\
                        "dashcam_state": \{\
                          "type": "string"\
                        \},\
                        "autopark_style": \{\
                          "type": "string"\
                        \},\
                        "homelink_nearby": \{\
                          "type": "boolean"\
                        \},\
                        "is_user_present": \{\
                          "type": "boolean"\
                        \},\
                        "software_update": \{\
                          "type": "object",\
                          "properties": \{\
                            "status": \{\
                              "type": "string"\
                            \},\
                            "version": \{\
                              "type": "string"\
                            \},\
                            "install_perc": \{\
                              "type": "integer"\
                            \},\
                            "download_perc": \{\
                              "type": "integer"\
                            \},\
                            "expected_duration_sec": \{\
                              "type": "integer"\
                            \}\
                          \}\
                        \},\
                        "speed_limit_mode": \{\
                          "type": "object",\
                          "properties": \{\
                            "active": \{\
                              "type": "boolean"\
                            \},\
                            "pin_code_set": \{\
                              "type": "boolean"\
                            \},\
                            "max_limit_mph": \{\
                              "type": "integer"\
                            \},\
                            "min_limit_mph": \{\
                              "type": "integer"\
                            \},\
                            "current_limit_mph": \{\
                              "type": "integer"\
                            \}\
                          \}\
                        \},\
                        "tpms_pressure_fl": \{\
                          "type": "string"\
                        \},\
                        "tpms_pressure_fr": \{\
                          "type": "string"\
                        \},\
                        "tpms_pressure_rl": \{\
                          "type": "string"\
                        \},\
                        "tpms_pressure_rr": \{\
                          "type": "string"\
                        \},\
                        "autopark_state_v2": \{\
                          "type": "string"\
                        \},\
                        "calendar_supported": \{\
                          "type": "boolean"\
                        \},\
                        "last_autopark_error": \{\
                          "type": "string"\
                        \},\
                        "center_display_state": \{\
                          "type": "integer"\
                        \},\
                        "remote_start_enabled": \{\
                          "type": "boolean"\
                        \},\
                        "homelink_device_count": \{\
                          "type": "integer"\
                        \},\
                        "sentry_mode_available": \{\
                          "type": "boolean"\
                        \},\
                        "remote_start_supported": \{\
                          "type": "boolean"\
                        \},\
                        "smart_summon_available": \{\
                          "type": "boolean"\
                        \},\
                        "notifications_supported": \{\
                          "type": "boolean"\
                        \},\
                        "parsed_calendar_supported": \{\
                          "type": "boolean"\
                        \},\
                        "dashcam_clip_save_available": \{\
                          "type": "boolean"\
                        \},\
                        "summon_standby_mode_enabled": \{\
                          "type": "boolean"\
                        \}\
                      \}\
                    \},\
                    "backseat_token": \{\
                      "type": "string"\
                    \},\
                    "vehicle_config": \{\
                      "type": "object",\
                      "properties": \{\
                        "plg": \{\
                          "type": "boolean"\
                        \},\
                        "pws": \{\
                          "type": "boolean"\
                        \},\
                        "rhd": \{\
                          "type": "boolean"\
                        \},\
                        "car_type": \{\
                          "type": "string"\
                        \},\
                        "seat_type": \{\
                          "type": "integer"\
                        \},\
                        "timestamp": \{\
                          "type": "integer"\
                        \},\
                        "eu_vehicle": \{\
                          "type": "boolean"\
                        \},\
                        "roof_color": \{\
                          "type": "string"\
                        \},\
                        "utc_offset": \{\
                          "type": "integer"\
                        \},\
                        "wheel_type": \{\
                          "type": "string"\
                        \},\
                        "spoiler_type": \{\
                          "type": "string"\
                        \},\
                        "trim_badging": \{\
                          "type": "string"\
                        \},\
                        "driver_assist": \{\
                          "type": "string"\
                        \},\
                        "headlamp_type": \{\
                          "type": "string"\
                        \},\
                        "exterior_color": \{\
                          "type": "string"\
                        \},\
                        "rear_seat_type": \{\
                          "type": "integer"\
                        \},\
                        "rear_drive_unit": \{\
                          "type": "string"\
                        \},\
                        "third_row_seats": \{\
                          "type": "string"\
                        \},\
                        "car_special_type": \{\
                          "type": "string"\
                        \},\
                        "charge_port_type": \{\
                          "type": "string"\
                        \},\
                        "ece_restrictions": \{\
                          "type": "boolean"\
                        \},\
                        "front_drive_unit": \{\
                          "type": "string"\
                        \},\
                        "has_seat_cooling": \{\
                          "type": "boolean"\
                        \},\
                        "rear_seat_heaters": \{\
                          "type": "integer"\
                        \},\
                        "use_range_badging": \{\
                          "type": "boolean"\
                        \},\
                        "can_actuate_trunks": \{\
                          "type": "boolean"\
                        \},\
                        "efficiency_package": \{\
                          "type": "string"\
                        \},\
                        "has_air_suspension": \{\
                          "type": "boolean"\
                        \},\
                        "has_ludicrous_mode": \{\
                          "type": "boolean"\
                        \},\
                        "interior_trim_type": \{\
                          "type": "string"\
                        \},\
                        "sun_roof_installed": \{\
                          "type": "integer"\
                        \},\
                        "default_charge_to_max": \{\
                          "type": "boolean"\
                        \},\
                        "motorized_charge_port": \{\
                          "type": "boolean"\
                        \},\
                        "dashcam_clip_save_supported": \{\
                          "type": "boolean"\
                        \},\
                        "can_accept_navigation_requests": \{\
                          "type": "boolean"\
                        \}\
                      \}\
                    \},\
                    "calendar_enabled": \{\
                      "type": "boolean"\
                    \},\
                    "backseat_token_updated_at": \{\
                      "type": "string"\
                    \}\
                  \},\
                  "x-examples": \{\
                    "Example 1": \{\
                      "id": 1492931520123456,\
                      "vin": "5YJXCAE43LF123456",\
                      "id_s": "1492931520123456",\
                      "color": "string",\
                      "state": "online",\
                      "user_id": 1311857,\
                      "in_service": true,\
                      "vehicle_id": 1349238573,\
                      "access_type": "OWNER",\
                      "api_version": 34,\
                      "drive_state": \{\
                        "power": 0,\
                        "speed": "string",\
                        "heading": 194,\
                        "latitude": 40.7484,\
                        "gps_as_of": 1643590638,\
                        "longitude": 73.9857,\
                        "timestamp": 1643590652755,\
                        "native_type": "wgs",\
                        "shift_state": "P",\
                        "native_latitude": 40.7484,\
                        "native_longitude": 73.9857,\
                        "native_location_supported": 1,\
                        "active_route_destination": "Empire State Building",\
                        "active_route_energy_at_arrival": 81,\
                        "active_route_latitude": -1.123456,\
                        "active_route_longitude": 1.123456,\
                        "active_route_miles_to_arrival": 4.12,\
                        "active_route_minutes_to_arrival": 5.43,\
                        "active_route_traffic_minutes_delay": 0\
                      \},\
                      "charge_state": \{\
                        "timestamp": 1643590652755,\
                        "charge_amps": 12,\
                        "charge_rate": 0,\
                        "battery_level": 89,\
                        "battery_range": 269.01,\
                        "charger_power": 0,\
                        "trip_charging": true,\
                        "charger_phases": "string",\
                        "charging_state": "Complete",\
                        "charger_voltage": 0,\
                        "charge_limit_soc": 90,\
                        "battery_heater_on": true,\
                        "charge_port_color": "Off",\
                        "charge_port_latch": "Engaged",\
                        "conn_charge_cable": "SAE",\
                        "est_battery_range": 223.25,\
                        "fast_charger_type": "MCSingleWireCAN",\
                        "fast_charger_brand": "<invalid>",\
                        "charge_energy_added": 4.64,\
                        "charge_to_max_range": true,\
                        "ideal_battery_range": 999,\
                        "time_to_full_charge": 0,\
                        "charge_limit_soc_max": 100,\
                        "charge_limit_soc_min": 50,\
                        "charge_limit_soc_std": 90,\
                        "fast_charger_present": true,\
                        "usable_battery_level": 89,\
                        "charge_enable_request": true,\
                        "charge_port_door_open": true,\
                        "charger_pilot_current": 12,\
                        "preconditioning_times": "weekdays",\
                        "charge_current_request": 12,\
                        "charger_actual_current": 0,\
                        "minutes_to_full_charge": 0,\
                        "managed_charging_active": true,\
                        "off_peak_charging_times": "all_week",\
                        "off_peak_hours_end_time": 375,\
                        "preconditioning_enabled": true,\
                        "scheduled_charging_mode": "Off",\
                        "charge_miles_added_ideal": 4641,\
                        "charge_miles_added_rated": 14.5,\
                        "max_range_charge_counter": 0,\
                        "not_enough_power_to_heat": true,\
                        "scheduled_departure_time": 1643578200,\
                        "off_peak_charging_enabled": true,\
                        "charge_current_request_max": 12,\
                        "scheduled_charging_pending": true,\
                        "user_charge_enable_request": "string",\
                        "managed_charging_start_time": "string",\
                        "charge_port_cold_weather_mode": "string",\
                        "scheduled_charging_start_time": "string",\
                        "managed_charging_user_canceled": true,\
                        "scheduled_departure_time_minutes": 810,\
                        "scheduled_charging_start_time_app": 817,\
                        "supercharger_session_trip_planner": true,\
                        "pack_current": -0.7,\
                        "pack_voltage": 419.79,\
                        "module_temp_min": 25.5,\
                        "module_temp_max": 26,\
                        "energy_remaining": 51.26,\
                        "lifetime_energy_used": 5224.713\
                      \},\
                      "display_name": "Seneca",\
                      "gui_settings": \{\
                        "timestamp": 1643590652755,\
                        "gui_24_hour_time": true,\
                        "show_range_units": true,\
                        "gui_range_display": "Rated",\
                        "gui_distance_units": "mi/hr",\
                        "gui_charge_rate_units": "kW",\
                        "gui_temperature_units": "F"\
                      \},\
                      "option_codes": "AD15MDL3PBSBRENABT37ID3WRF3GS3PBDRLHDV2WW39BAPF0COUSBC3BCH07PC30FC3PFG31GLFRHL31HM31IL31LTPBMR31FM3BRS3HSA3PSTCPSC04SU3CT3CATW00TM00UT3PWR00AU3PAPH3AF00ZCSTMI00CDM0",\
                      "climate_state": \{\
                        "timestamp": 1643590652755,\
                        "fan_status": 0,\
                        "inside_temp": 24.3,\
                        "defrost_mode": 0,\
                        "outside_temp": 17.5,\
                        "is_climate_on": true,\
                        "battery_heater": true,\
                        "bioweapon_mode": true,\
                        "max_avail_temp": 28,\
                        "min_avail_temp": 15,\
                        "seat_heater_left": 0,\
                        "hvac_auto_request": "On",\
                        "seat_heater_right": 0,\
                        "is_preconditioning": true,\
                        "wiper_blade_heater": true,\
                        "climate_keeper_mode": "off",\
                        "driver_temp_setting": 22.8,\
                        "left_temp_direction": 0,\
                        "side_mirror_heaters": true,\
                        "is_rear_defroster_on": true,\
                        "right_temp_direction": 0,\
                        "is_front_defroster_on": true,\
                        "seat_heater_rear_left": 0,\
                        "steering_wheel_heater": true,\
                        "passenger_temp_setting": 22.8,\
                        "seat_heater_rear_right": 0,\
                        "battery_heater_no_power": true,\
                        "is_auto_conditioning_on": true,\
                        "seat_heater_rear_center": 0,\
                        "cabin_overheat_protection": "On",\
                        "seat_heater_third_row_left": 0,\
                        "seat_heater_third_row_right": 0,\
                        "remote_heater_control_enabled": true,\
                        "allow_cabin_overheat_protection": true,\
                        "supports_fan_only_cabin_overheat_protection": true\
                      \},\
                      "vehicle_state": \{\
                        "df": 0,\
                        "dr": 0,\
                        "ft": 0,\
                        "pf": 0,\
                        "pr": 0,\
                        "rt": 0,\
                        "locked": true,\
                        "odometer": 14096.485641,\
                        "fd_window": 0,\
                        "fp_window": 0,\
                        "rd_window": 0,\
                        "rp_window": 0,\
                        "timestamp": 1643590652755,\
                        "santa_mode": 0,\
                        "valet_mode": true,\
                        "api_version": 34,\
                        "car_version": "2022.4 fae2af490933",\
                        "media_state": \{\
                          "remote_control_enabled": true\
                        \},\
                        "sentry_mode": true,\
                        "remote_start": true,\
                        "vehicle_name": "Seneca",\
                        "dashcam_state": "Unavailable",\
                        "autopark_style": "standard",\
                        "homelink_nearby": true,\
                        "is_user_present": true,\
                        "software_update": \{\
                          "status": "available",\
                          "version": "2022.4",\
                          "install_perc": 1,\
                          "download_perc": 0,\
                          "expected_duration_sec": 2700\
                        \},\
                        "speed_limit_mode": \{\
                          "active": true,\
                          "pin_code_set": true,\
                          "max_limit_mph": 90,\
                          "min_limit_mph": 50,\
                          "current_limit_mph": 84\
                        \},\
                        "tpms_pressure_fl": "string",\
                        "tpms_pressure_fr": "string",\
                        "tpms_pressure_rl": "string",\
                        "tpms_pressure_rr": "string",\
                        "autopark_state_v2": "standby",\
                        "calendar_supported": true,\
                        "last_autopark_error": "no_error",\
                        "center_display_state": 0,\
                        "remote_start_enabled": true,\
                        "homelink_device_count": 0,\
                        "sentry_mode_available": true,\
                        "remote_start_supported": true,\
                        "smart_summon_available": true,\
                        "notifications_supported": true,\
                        "parsed_calendar_supported": true,\
                        "dashcam_clip_save_available": true,\
                        "summon_standby_mode_enabled": true\
                      \},\
                      "backseat_token": "string",\
                      "vehicle_config": \{\
                        "plg": true,\
                        "pws": true,\
                        "rhd": true,\
                        "car_type": "modelx",\
                        "seat_type": 0,\
                        "timestamp": 1643590652755,\
                        "eu_vehicle": true,\
                        "roof_color": "None",\
                        "utc_offset": -28800,\
                        "wheel_type": "Turbine22Dark",\
                        "spoiler_type": "Passive",\
                        "trim_badging": "p100d",\
                        "driver_assist": "TeslaAP3",\
                        "headlamp_type": "Led",\
                        "exterior_color": "Pearl",\
                        "rear_seat_type": 7,\
                        "rear_drive_unit": "Large",\
                        "third_row_seats": "FuturisFoldFlat",\
                        "car_special_type": "base",\
                        "charge_port_type": "US",\
                        "ece_restrictions": true,\
                        "front_drive_unit": "PermanentMagnet",\
                        "has_seat_cooling": true,\
                        "rear_seat_heaters": 3,\
                        "use_range_badging": true,\
                        "can_actuate_trunks": true,\
                        "efficiency_package": "Default",\
                        "has_air_suspension": true,\
                        "has_ludicrous_mode": true,\
                        "interior_trim_type": "AllBlack",\
                        "sun_roof_installed": 0,\
                        "default_charge_to_max": true,\
                        "motorized_charge_port": true,\
                        "dashcam_clip_save_supported": true,\
                        "can_accept_navigation_requests": true\
                      \},\
                      "calendar_enabled": true,\
                      "backseat_token_updated_at": "string"\
                    \}\
                  \},\
                  "x-readme-ref-name": "CurrentState"\
                \},\
                "examples": \{\
                  "Example 1": \{\
                    "value": \{\
                      "id": 1492931520123456,\
                      "vin": "5YJXCAE43LF123456",\
                      "id_s": "1492931520123456",\
                      "color": "string",\
                      "state": "online",\
                      "user_id": 1311857,\
                      "in_service": true,\
                      "vehicle_id": 1349238573,\
                      "access_type": "OWNER",\
                      "api_version": 34,\
                      "drive_state": \{\
                        "power": 0,\
                        "speed": "string",\
                        "heading": 194,\
                        "latitude": 40.7484,\
                        "gps_as_of": 1643590638,\
                        "longitude": 73.9857,\
                        "timestamp": 1643590652755,\
                        "native_type": "wgs",\
                        "shift_state": "P",\
                        "native_latitude": 40.7484,\
                        "native_longitude": 73.9857,\
                        "native_location_supported": 1,\
                        "active_route_destination": "Empire State Building",\
                        "active_route_energy_at_arrival": 81,\
                        "active_route_latitude": -1.123456,\
                        "active_route_longitude": 1.123456,\
                        "active_route_miles_to_arrival": 4.12,\
                        "active_route_minutes_to_arrival": 5.43,\
                        "active_route_traffic_minutes_delay": 0\
                      \},\
                      "charge_state": \{\
                        "timestamp": 1643590652755,\
                        "charge_amps": 12,\
                        "charge_rate": 0,\
                        "battery_level": 89,\
                        "battery_range": 269.01,\
                        "charger_power": 0,\
                        "trip_charging": true,\
                        "charger_phases": "string",\
                        "charging_state": "Complete",\
                        "charger_voltage": 0,\
                        "charge_limit_soc": 90,\
                        "battery_heater_on": true,\
                        "charge_port_color": "Off",\
                        "charge_port_latch": "Engaged",\
                        "conn_charge_cable": "SAE",\
                        "est_battery_range": 223.25,\
                        "fast_charger_type": "MCSingleWireCAN",\
                        "fast_charger_brand": "<invalid>",\
                        "charge_energy_added": 4.64,\
                        "charge_to_max_range": true,\
                        "ideal_battery_range": 999,\
                        "time_to_full_charge": 0,\
                        "charge_limit_soc_max": 100,\
                        "charge_limit_soc_min": 50,\
                        "charge_limit_soc_std": 90,\
                        "fast_charger_present": true,\
                        "usable_battery_level": 89,\
                        "charge_enable_request": true,\
                        "charge_port_door_open": true,\
                        "charger_pilot_current": 12,\
                        "preconditioning_times": "weekdays",\
                        "charge_current_request": 12,\
                        "charger_actual_current": 0,\
                        "minutes_to_full_charge": 0,\
                        "managed_charging_active": true,\
                        "off_peak_charging_times": "all_week",\
                        "off_peak_hours_end_time": 375,\
                        "preconditioning_enabled": true,\
                        "scheduled_charging_mode": "Off",\
                        "charge_miles_added_ideal": 4641,\
                        "charge_miles_added_rated": 14.5,\
                        "max_range_charge_counter": 0,\
                        "not_enough_power_to_heat": true,\
                        "scheduled_departure_time": 1643578200,\
                        "off_peak_charging_enabled": true,\
                        "charge_current_request_max": 12,\
                        "scheduled_charging_pending": true,\
                        "user_charge_enable_request": "string",\
                        "managed_charging_start_time": "string",\
                        "charge_port_cold_weather_mode": "string",\
                        "scheduled_charging_start_time": "string",\
                        "managed_charging_user_canceled": true,\
                        "scheduled_departure_time_minutes": 810,\
                        "scheduled_charging_start_time_app": 817,\
                        "supercharger_session_trip_planner": true,\
                        "pack_current": -0.7,\
                        "pack_voltage": 419.79,\
                        "module_temp_min": 25.5,\
                        "module_temp_max": 26,\
                        "energy_remaining": 51.26,\
                        "lifetime_energy_used": 5224.713\
                      \},\
                      "display_name": "Seneca",\
                      "gui_settings": \{\
                        "timestamp": 1643590652755,\
                        "gui_24_hour_time": true,\
                        "show_range_units": true,\
                        "gui_range_display": "Rated",\
                        "gui_distance_units": "mi/hr",\
                        "gui_charge_rate_units": "kW",\
                        "gui_temperature_units": "F"\
                      \},\
                      "option_codes": "AD15MDL3PBSBRENABT37ID3WRF3GS3PBDRLHDV2WW39BAPF0COUSBC3BCH07PC30FC3PFG31GLFRHL31HM31IL31LTPBMR31FM3BRS3HSA3PSTCPSC04SU3CT3CATW00TM00UT3PWR00AU3PAPH3AF00ZCSTMI00CDM0",\
                      "climate_state": \{\
                        "timestamp": 1643590652755,\
                        "fan_status": 0,\
                        "inside_temp": 24.3,\
                        "defrost_mode": 0,\
                        "outside_temp": 17.5,\
                        "is_climate_on": true,\
                        "battery_heater": true,\
                        "bioweapon_mode": true,\
                        "max_avail_temp": 28,\
                        "min_avail_temp": 15,\
                        "seat_heater_left": 0,\
                        "hvac_auto_request": "On",\
                        "seat_heater_right": 0,\
                        "is_preconditioning": true,\
                        "wiper_blade_heater": true,\
                        "climate_keeper_mode": "off",\
                        "driver_temp_setting": 22.8,\
                        "left_temp_direction": 0,\
                        "side_mirror_heaters": true,\
                        "is_rear_defroster_on": true,\
                        "right_temp_direction": 0,\
                        "is_front_defroster_on": true,\
                        "seat_heater_rear_left": 0,\
                        "steering_wheel_heater": true,\
                        "passenger_temp_setting": 22.8,\
                        "seat_heater_rear_right": 0,\
                        "battery_heater_no_power": true,\
                        "is_auto_conditioning_on": true,\
                        "seat_heater_rear_center": 0,\
                        "cabin_overheat_protection": "On",\
                        "seat_heater_third_row_left": 0,\
                        "seat_heater_third_row_right": 0,\
                        "remote_heater_control_enabled": true,\
                        "allow_cabin_overheat_protection": true,\
                        "supports_fan_only_cabin_overheat_protection": true\
                      \},\
                      "vehicle_state": \{\
                        "df": 0,\
                        "dr": 0,\
                        "ft": 0,\
                        "pf": 0,\
                        "pr": 0,\
                        "rt": 0,\
                        "locked": true,\
                        "odometer": 14096.485641,\
                        "fd_window": 0,\
                        "fp_window": 0,\
                        "rd_window": 0,\
                        "rp_window": 0,\
                        "timestamp": 1643590652755,\
                        "santa_mode": 0,\
                        "valet_mode": true,\
                        "api_version": 34,\
                        "car_version": "2022.4 fae2af490933",\
                        "media_state": \{\
                          "remote_control_enabled": true\
                        \},\
                        "sentry_mode": true,\
                        "remote_start": true,\
                        "vehicle_name": "Seneca",\
                        "dashcam_state": "Unavailable",\
                        "autopark_style": "standard",\
                        "homelink_nearby": true,\
                        "is_user_present": true,\
                        "software_update": \{\
                          "status": "available",\
                          "version": "2022.4",\
                          "install_perc": 1,\
                          "download_perc": 0,\
                          "expected_duration_sec": 2700\
                        \},\
                        "speed_limit_mode": \{\
                          "active": true,\
                          "pin_code_set": true,\
                          "max_limit_mph": 90,\
                          "min_limit_mph": 50,\
                          "current_limit_mph": 84\
                        \},\
                        "tpms_pressure_fl": "string",\
                        "tpms_pressure_fr": "string",\
                        "tpms_pressure_rl": "string",\
                        "tpms_pressure_rr": "string",\
                        "autopark_state_v2": "standby",\
                        "calendar_supported": true,\
                        "last_autopark_error": "no_error",\
                        "center_display_state": 0,\
                        "remote_start_enabled": true,\
                        "homelink_device_count": 0,\
                        "sentry_mode_available": true,\
                        "remote_start_supported": true,\
                        "smart_summon_available": true,\
                        "notifications_supported": true,\
                        "parsed_calendar_supported": true,\
                        "dashcam_clip_save_available": true,\
                        "summon_standby_mode_enabled": true\
                      \},\
                      "backseat_token": "string",\
                      "vehicle_config": \{\
                        "plg": true,\
                        "pws": true,\
                        "rhd": true,\
                        "car_type": "modelx",\
                        "seat_type": 0,\
                        "timestamp": 1643590652755,\
                        "eu_vehicle": true,\
                        "roof_color": "None",\
                        "utc_offset": -28800,\
                        "wheel_type": "Turbine22Dark",\
                        "spoiler_type": "Passive",\
                        "trim_badging": "p100d",\
                        "driver_assist": "TeslaAP3",\
                        "headlamp_type": "Led",\
                        "exterior_color": "Pearl",\
                        "rear_seat_type": 7,\
                        "rear_drive_unit": "Large",\
                        "third_row_seats": "FuturisFoldFlat",\
                        "car_special_type": "base",\
                        "charge_port_type": "US",\
                        "ece_restrictions": true,\
                        "front_drive_unit": "PermanentMagnet",\
                        "has_seat_cooling": true,\
                        "rear_seat_heaters": 3,\
                        "use_range_badging": true,\
                        "can_actuate_trunks": true,\
                        "efficiency_package": "Default",\
                        "has_air_suspension": true,\
                        "has_ludicrous_mode": true,\
                        "interior_trim_type": "AllBlack",\
                        "sun_roof_installed": 0,\
                        "default_charge_to_max": true,\
                        "motorized_charge_port": true,\
                        "dashcam_clip_save_supported": true,\
                        "can_accept_navigation_requests": true\
                      \},\
                      "calendar_enabled": true,\
                      "backseat_token_updated_at": "string"\
                    \}\
                  \},\
                  "Example (Asleep)": \{\
                    "value": \{\
                      "state": "asleep"\
                    \}\
                  \}\
                \}\
              \}\
            \},\
            "description": "Success"\
          \}\
        \},\
        "operationId": "get-state",\
        "summary": "Get Vehicle",\
        "description": "Returns the latest state of a vehicle.\\n\\nIf **use_cache** is **true** (default), this call always returns a complete set of data and doesn't impact vehicle sleep. If the vehicle is awake, the data is usually less than 15 seconds old. If the vehicle is asleep, the data is from the time the vehicle went to sleep.\\n\\nIf **use_cache** is **false**, this call retrieves data using a live connection, which may return `\{\\"state\\": \\"asleep\\"\}` or network errors depending on vehicle connectivity."\
      \},\
      "parameters": [\
        \{\
          "name": "vin",\
          "description": "The associated VIN.",\
          "schema": \{\
            "type": "string"\
          \},\
          "in": "path",\
          "required": true,\
          "deprecated": false,\
          "x-last-modified": 1643747623235,\
          "example": "5YJXCAE43LF123456"\
        \}\
      ]\
    \}\
  \},\
  "components": \{\
    "securitySchemes": \{\
      "bearerAuth": \{\
        "scheme": "bearer",\
        "type": "http"\
      \}\
    \}\
  \},\
  "security": [\
    \{\
      "bearerAuth": []\
    \}\
  ],\
  "tags": [\
    \{\
      "name": "Vehicle Data",\
      "description": "Vehicle data endpoints"\
    \}\
  ]\
\}\
```\
\
Access Tesla Fleet Telemetry\
\
Tesla Fleet Telemetry is an end-to-end encrypted telemetry data stream generated by your vehicle.\
\
Tessie provides full access to Tesla Fleet Telemetry.\
\
We've also built in significant improvements:\
\
* Get instant access to Tesla Fleet Telemetry without an extremely complex and lengthy setup process\
* Just connect to your dedicated streaming endpoint and you're done \'97 no servers or hosting required\
\
## Requirements\
\
* Vehicle firmware version 2023.20.6 or later\
* [Virtual Key](https://help.tessie.com/article/117-virtual-key) must be installed on the vehicle\
\
## Get Started\
\
Using any WebSocket client, connect to: `streaming.tessie.com/YOUR_VIN`\
\
Provide your access token in an Authorization header or as the access\\_token query parameter. [Learn more.](https://developer.tessie.com/reference/intro/authentication)\
\
Visit [streaming.tessie.com/explorer](https://streaming.tessie.com/explorer) for an example implementation. Check the page source code.\
\
## Data Structure\
\
All messages are formatted in JSON.\
\
There are 4 types of messages (data, alerts, connectivity and errors), detailed below.\
\
### Example Data Message\
\
Visit [this data file](https://github.com/teslamotors/fleet-telemetry/blob/main/protos/vehicle_data.proto) to see all possible data points.\
\
```\
\{\
  "data": [\
    \{\
      "key": "IdealBatteryRange",\
      "value": \{\
        "stringValue": "171.833"\
      \}\
    \},\
    \{\
      "key": "ModuleTempMax",\
      "value": \{\
        "stringValue": "41.500"\
      \}\
    \},\
    \{\
      "key": "EnergyRemaining",\
      "value": \{\
        "stringValue": "42.880"\
      \}\
    \},\
    \{\
      "key": "Location",\
      "value": \{\
        "locationValue": \{,\
          "latitude": 37.4925352,\
          "longitude": -121.9447469\
        \}\
      \}\
    \},\
    \{\
      "key": "PackVoltage",\
      "value": \{\
        "stringValue": "367.950"\
      \}\
    \},\
    \{\
      "key": "ACChargingPower",\
      "value": \{\
        "stringValue": "0.000"\
      \}\
    \},\
    \{\
      "key": "Odometer",\
      "value": \{\
        "stringValue": "11270.940"\
      \}\
    \},\
    \{\
      "key": "PackCurrent",\
      "value": \{\
        "stringValue": "-0.600"\
      \}\
    \},\
    \{\
      "key": "GpsHeading",\
      "value": \{\
        "stringValue": "81.639"\
      \}\
    \},\
    \{\
      "key": "ACChargingEnergyIn",\
      "value": \{\
        "stringValue": "17.260"\
      \}\
    \},\
    \{\
      "key": "RatedRange",\
      "value": \{\
        "stringValue": "171.833"\
      \}\
    \},\
    \{\
      "key": "ChargeAmps",\
      "value": \{\
        "stringValue": "48"\
      \}\
    \},\
    \{\
      "key": "EstBatteryRange",\
      "value": \{\
        "stringValue": "131.519"\
      \}\
    \},\
    \{\
      "key": "ModuleTempMin",\
      "value": \{\
        "stringValue": "41.000"\
      \}\
    \},\
    \{\
      "key": "LifetimeEnergyUsed",\
      "value": \{\
        "stringValue": "5567.591"\
      \}\
    \},\
    \{\
      "key": "Soc",\
      "value": \{\
        "stringValue": "54.987"\
      \}\
    \}\
  ],\
  "createdAt": "2024-08-01T00:44:39.138713677Z",\
  "vin": "LRW3F7FR9NC123456"\
\}\
```\
\
### Example Alerts Message\
\
```\
\{  \
  "alerts": [\
    \{\
      "name": "VCFRONT_a361_washerFluidLowMomentary",\
      "audiences": [\
        "Service",\
        "Customer"\
      ],\
      "startedAt": "2024-08-01T00:21:41.545Z",\
      "endedAt": "2024-08-01T00:21:49.543Z"\
    \},\
    \{\
      "name": "APP_w269_autopilotLimited",\
      "audiences": [\
        "Customer",\
        "Service"\
      ],\
      "startedAt": "2024-08-01T00:15:08.542Z",\
      "endedAt": "2024-08-01T00:15:14.544Z"\
    \}\
  ],\
  "createdAt": "2024-08-01T00:44:32.558510331Z",\
  "vin": "LRW3F7FR9NC123456"\
\}\
```\
\
### Example Connectivity Message\
\
```\
\{\
  "vin": "LRW3F7FR9NC123456",\
  "connectionId": "913a422e-7169-48fa-a4a4-2eab9f12ab34",\
  "status": "DISCONNECTED",\
  "createdAt": "2024-10-29T21:56:14.764032001Z"\
\}\
```\
\
### Example Errors Message\
\
```\
\{\
  "errors": [\
    \{\
      "createdAt": "2024-08-01T00:44:06.780721459Z",\
      "name": "unsupported_field",\
      "tags": \{\
        "field_name": "LifetimeEnergyGainedRegen",\
        "name": "1bfd3e4b3966-496c-b87a-59999f71234"\
      \},\
      "body": ""\
    \}\
  ],\
  "createdAt": "2024-08-01T00:44:06.780721459Z",\
  "vin": "LRW3F7FR9NC123456"\
\}\
```}