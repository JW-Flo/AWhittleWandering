-- A Whittle Wandering Journey Data Import
-- Generated on 2025-08-04T06:41:18.864Z

-- Clear existing data
DELETE FROM charges WHERE journey_id = 'continental-usa-2025';
DELETE FROM drives WHERE journey_id = 'continental-usa-2025';
DELETE FROM journeys WHERE id = 'continental-usa-2025';

-- Insert journey data

      INSERT INTO journeys (id, vehicle_id, name, description, start_date, status, created_at, updated_at)
      VALUES (
        'continental-usa-2025',
        '5YJYGDEE5LF027324',
        'A Whittle Wandering - Continental USA',
        'Epic Tesla road trip across the continental United States',
        '2025-06-01',
        'completed',
        datetime('now'),
        datetime('now')
      );
    

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-01T08:00:00Z', '2025-06-02T08:00:00Z',
          523, 196, 'Start: Corpus Christi, Texas', 'Carlsbad Caverns, New Mexico',
          27.8006, -97.3964, 32.1776, -104.5281,
          86, 55, 130.72,
          160, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-02T08:00:00Z', '2025-06-04T08:00:00Z',
          523, 263, 'Carlsbad Caverns, New Mexico', 'Fort Stockton overnight, Texas',
          32.1776, -104.5281, 27.8006, -97.3964,
          85, 77, 130.72,
          119, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-04T08:00:00Z', '2025-06-05T08:00:00Z',
          0, 169, 'Fort Stockton overnight, Texas', 'El Paso Tesla service, Texas',
          27.8006, -97.3964, 27.8006, -97.3964,
          87, 70, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-05T08:00:00Z', '2025-06-06T08:00:00Z',
          977, 304, 'El Paso Tesla service, Texas', 'Sedona, Grand Canyon (Desert View Watchtower), Arizona',
          27.8006, -97.3964, 34.8697, -111.761,
          91, 50, 244.23,
          193, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-06T08:00:00Z', '2025-06-08T08:00:00Z',
          182, 279, 'Sedona, Grand Canyon (Desert View Watchtower), Arizona', 'Zion National Park (first Utah stop), Utah',
          34.8697, -111.761, 37.2982, -113.0263,
          90, 57, 45.52,
          39, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-08T08:00:00Z', '2025-06-09T08:00:00Z',
          799, 151, 'Zion National Park (first Utah stop), Utah', 'Drove through Las Vegas → Los Angeles, Nevada → California',
          37.2982, -113.0263, 39.8283, -98.5795,
          80, 54, 199.73,
          317, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-09T08:00:00Z', '2025-06-09T08:00:00Z',
          1154, 208, 'Drove through Las Vegas → Los Angeles, Nevada → California', '4 days in Los Angeles, then PCH north, California',
          39.8283, -98.5795, 34.0522, -118.2437,
          82, 69, 288.51,
          333, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-09T08:00:00Z', '2025-06-14T08:00:00Z',
          0, 347, '4 days in Los Angeles, then PCH north, California', 'Redwoods National Park, California',
          34.0522, -118.2437, 34.0522, -118.2437,
          76, 69, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-14T08:00:00Z', '2025-06-15T08:00:00Z',
          685, 201, 'Redwoods National Park, California', 'Cannon Beach, Oregon',
          34.0522, -118.2437, 43.8041, -120.5542,
          74, 72, 171.28,
          205, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-15T08:00:00Z', '2025-06-16T08:00:00Z',
          273, 298, 'Cannon Beach, Oregon', 'Verlot, Mount Baker-Snoqualmie, Washington',
          43.8041, -120.5542, 47.7511, -120.7401,
          87, 63, 68.22,
          55, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-16T08:00:00Z', '2025-06-17T08:00:00Z',
          0, 125, 'Verlot, Mount Baker-Snoqualmie, Washington', 'Sequim, Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          93, 66, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-17T08:00:00Z', '2025-06-18T08:00:00Z',
          0, 241, 'Sequim, Washington', 'Seattle (Brian), Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          81, 54, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-18T08:00:00Z', '2025-06-19T08:00:00Z',
          0, 199, 'Seattle (Brian), Washington', 'Quincy hike, Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          80, 73, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-19T08:00:00Z', '2025-06-20T08:00:00Z',
          384, 213, 'Quincy hike, Washington', 'Coeur d’Alene (camped overnight), Idaho',
          47.7511, -120.7401, 44.0682, -114.742,
          78, 56, 96.1,
          108, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-20T08:00:00Z', '2025-06-21T08:00:00Z',
          322, 164, 'Coeur d’Alene (camped overnight), Idaho', 'Bozeman, Montana',
          44.0682, -114.742, 47.0527, -109.6333,
          70, 65, 80.44,
          117, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-21T08:00:00Z', '2025-06-22T08:00:00Z',
          0, 237, 'Bozeman, Montana', 'Big Sky (summited Lone Mountain), Montana',
          47.0527, -109.6333, 47.0527, -109.6333,
          79, 66, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-22T08:00:00Z', '2025-06-23T08:00:00Z',
          298, 324, 'Big Sky (summited Lone Mountain), Montana', 'Yellowstone National Park, Wyoming',
          47.0527, -109.6333, 43.0759, -107.2903,
          80, 57, 74.4,
          55, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-23T08:00:00Z', '2025-06-25T08:00:00Z',
          501, 271, 'Yellowstone National Park, Wyoming', 'Salt Lake City → 2-day Provo visit (after Wyoming), Utah',
          43.0759, -107.2903, 37.2982, -113.0263,
          75, 59, 125.2,
          111, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-25T08:00:00Z', '2025-06-27T08:00:00Z',
          799, 185, 'Salt Lake City → 2-day Provo visit (after Wyoming), Utah', 'Denver (Josh), Fort Collins (Caleb), Colorado',
          37.2982, -113.0263, 39.8283, -98.5795,
          88, 70, 199.73,
          260, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-27T08:00:00Z', '2025-07-03T08:00:00Z',
          134, 210, 'Denver (Josh), Fort Collins (Caleb), Colorado', 'Arrived Lincoln for 4-day stay, Nebraska',
          39.8283, -98.5795, 41.4925, -99.9018,
          96, 46, 33.57,
          38, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-03T08:00:00Z', '2025-07-04T08:00:00Z',
          134, 209, 'Arrived Lincoln for 4-day stay, Nebraska', 'Council Bluffs → Badlands, Iowa → South Dakota',
          41.4925, -99.9018, 39.8283, -98.5795,
          92, 50, 33.57,
          39, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-04T08:00:00Z', '2025-07-05T08:00:00Z',
          547, 332, 'Council Bluffs → Badlands, Iowa → South Dakota', 'Fargo (dinner + overnight), North Dakota',
          39.8283, -98.5795, 47.6201, -100.5407,
          74, 46, 136.79,
          99, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-05T08:00:00Z', '2025-07-06T08:00:00Z',
          289, 260, 'Fargo (dinner + overnight), North Dakota', 'Minneapolis, Minnesota',
          47.6201, -100.5407, 46.3544, -94.6859,
          86, 66, 72.35,
          67, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-06T08:00:00Z', '2025-07-07T08:00:00Z',
          338, 265, 'Minneapolis, Minnesota', 'Mars Cheese Castle (Kenosha), Wisconsin',
          46.3544, -94.6859, 43.7844, -88.7879,
          90, 48, 84.52,
          76, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-07T08:00:00Z', '2025-07-08T08:00:00Z',
          573, 335, 'Mars Cheese Castle (Kenosha), Wisconsin', 'Chicago (Wrigleyville, met Connor McBride), Illinois',
          43.7844, -88.7879, 39.8283, -98.5795,
          82, 71, 143.28,
          103, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-08T08:00:00Z', '2025-07-09T08:00:00Z',
          0, 206, 'Chicago (Wrigleyville, met Connor McBride), Illinois', 'Terre Haute (Jack Lavey), Turkey Run State Park, Indiana',
          39.8283, -98.5795, 39.8283, -98.5795,
          91, 59, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-09T08:00:00Z', '2025-07-10T08:00:00Z',
          834, 275, 'Terre Haute (Jack Lavey), Turkey Run State Park, Indiana', 'John Bryan SP, Clifton Gorge, Ohio',
          39.8283, -98.5795, 40.2732, -82.7937,
          79, 62, 208.6,
          182, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-10T08:00:00Z', '2025-07-11T08:00:00Z',
          0, 253, 'John Bryan SP, Clifton Gorge, Ohio', '2 nights in Cincinnati (Cameron Hynes), Ohio',
          40.2732, -82.7937, 40.2732, -82.7937,
          91, 64, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-11T08:00:00Z', '2025-07-13T08:00:00Z',
          300, 240, '2 nights in Cincinnati (Cameron Hynes), Ohio', 'Erie + Lake Erie, Pennsylvania',
          40.2732, -82.7937, 41.2033, -77.1945,
          88, 79, 75.01,
          75, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-13T08:00:00Z', '2025-07-14T08:00:00Z',
          134, 168, 'Erie + Lake Erie, Pennsylvania', 'Albany (Phil Dalton), New York',
          41.2033, -77.1945, 42.1657, -74.9481,
          89, 52, 33.41,
          48, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-14T08:00:00Z', '2025-07-15T08:00:00Z',
          172, 285, 'Albany (Phil Dalton), New York', 'Green Mountain National Forest, Vermont',
          42.1657, -74.9481, 44.0459, -72.7107,
          94, 61, 43.02,
          36, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-15T08:00:00Z', '2025-07-16T08:00:00Z',
          70, 206, 'Green Mountain National Forest, Vermont', 'White Mountain Visitor Center, New Hampshire',
          44.0459, -72.7107, 43.4525, -71.5639,
          71, 79, 17.6,
          21, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-16T08:00:00Z', '2025-07-17T08:00:00Z',
          1411, 221, 'White Mountain Visitor Center, New Hampshire', 'Bar Harbor, Cadillac Mountain (sunrise hike), Maine',
          43.4525, -71.5639, 39.8283, -98.5795,
          98, 56, 352.72,
          383, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-17T08:00:00Z', '2025-07-19T08:00:00Z',
          1439, 211, 'Bar Harbor, Cadillac Mountain (sunrise hike), Maine', 'Drove through → Connecticut, Massachusetts',
          39.8283, -98.5795, 42.2352, -71.0275,
          80, 71, 359.84,
          410, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-19T08:00:00Z', '2025-07-20T08:00:00Z',
          99, 325, 'Drove through → Connecticut, Massachusetts', 'Stratford stay with Deanna, Connecticut',
          42.2352, -71.0275, 41.5978, -72.7554,
          91, 74, 24.79,
          18, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-20T08:00:00Z', '2025-07-25T08:00:00Z',
          64, 198, 'Stratford stay with Deanna, Connecticut', 'Watch Hill Point (coastal visit), Rhode Island',
          41.5978, -72.7554, 41.6809, -71.5118,
          77, 47, 16.12,
          20, datetime('now')
        );
      

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-02T09:00:00.000Z', '2025-06-02T09:36:00.000Z',
            'Supercharger - New Mexico', 33.75, 15.75,
            55, 100, 32.1776,
            -104.5281, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-04T09:00:00.000Z', '2025-06-04T09:18:00.000Z',
            'Supercharger - Texas', 17.25, 8.05,
            77, 100, 27.8006,
            -97.3964, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-06T09:00:00.000Z', '2025-06-06T09:40:00.000Z',
            'Supercharger - Grand Canyon (Desert View Watchtower)', 37.5, 17.5,
            50, 100, 34.8697,
            -111.761, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-09T09:00:00.000Z', '2025-06-09T09:37:00.000Z',
            'Supercharger - Nevada → California', 34.5, 16.1,
            54, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-09T09:00:00.000Z', '2025-06-09T09:25:00.000Z',
            'Supercharger - then PCH north', 23.25, 10.85,
            69, 100, 34.0522,
            -118.2437, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-15T09:00:00.000Z', '2025-06-15T09:22:00.000Z',
            'Supercharger - Oregon', 21, 9.8,
            72, 100, 43.8041,
            -120.5542, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-16T09:00:00.000Z', '2025-06-16T09:30:00.000Z',
            'Supercharger - Mount Baker-Snoqualmie', 27.75, 12.95,
            63, 100, 47.7511,
            -120.7401, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-20T09:00:00.000Z', '2025-06-20T09:35:00.000Z',
            'Supercharger - Idaho', 33, 15.4,
            56, 100, 44.0682,
            -114.742, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-21T09:00:00.000Z', '2025-06-21T09:28:00.000Z',
            'Supercharger - Montana', 26.25, 12.25,
            65, 100, 47.0527,
            -109.6333, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-23T09:00:00.000Z', '2025-06-23T09:34:00.000Z',
            'Supercharger - Wyoming', 32.25, 15.05,
            57, 100, 43.0759,
            -107.2903, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-25T09:00:00.000Z', '2025-06-25T09:33:00.000Z',
            'Supercharger - Utah', 30.75, 14.35,
            59, 100, 37.2982,
            -113.0263, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-27T09:00:00.000Z', '2025-06-27T09:24:00.000Z',
            'Supercharger - Fort Collins (Caleb)', 22.5, 10.5,
            70, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-03T09:00:00.000Z', '2025-07-03T09:43:00.000Z',
            'Supercharger - Nebraska', 40.5, 18.9,
            46, 100, 41.4925,
            -99.9018, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-05T09:00:00.000Z', '2025-07-05T09:43:00.000Z',
            'Supercharger - North Dakota', 40.5, 18.9,
            46, 100, 47.6201,
            -100.5407, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-06T09:00:00.000Z', '2025-07-06T09:27:00.000Z',
            'Supercharger - Minnesota', 25.5, 11.9,
            66, 100, 46.3544,
            -94.6859, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-07T09:00:00.000Z', '2025-07-07T09:42:00.000Z',
            'Supercharger - Wisconsin', 39, 18.2,
            48, 100, 43.7844,
            -88.7879, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-08T09:00:00.000Z', '2025-07-08T09:23:00.000Z',
            'Supercharger - met Connor McBride)', 21.75, 10.15,
            71, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-10T09:00:00.000Z', '2025-07-10T09:30:00.000Z',
            'Supercharger - Clifton Gorge', 28.5, 13.3,
            62, 100, 40.2732,
            -82.7937, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-13T09:00:00.000Z', '2025-07-13T09:17:00.000Z',
            'Supercharger - Pennsylvania', 15.75, 7.35,
            79, 100, 41.2033,
            -77.1945, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-17T09:00:00.000Z', '2025-07-17T09:35:00.000Z',
            'Supercharger - Cadillac Mountain (sunrise hike)', 33, 15.4,
            56, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-19T09:00:00.000Z', '2025-07-19T09:23:00.000Z',
            'Supercharger - Massachusetts', 21.75, 10.15,
            71, 100, 42.2352,
            -71.0275, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-25T09:00:00.000Z', '2025-07-25T09:42:00.000Z',
            'Supercharger - Rhode Island', 39.75, 18.55,
            47, 100, 41.6809,
            -71.5118, datetime('now')
          );
        