-- A Whittle Wandering Journey Data Import
-- Generated on 2025-08-04T05:21:44.358Z

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
          523, 218, 'Start: Corpus Christi, Texas', 'Carlsbad Caverns, New Mexico',
          27.8006, -97.3964, 32.1776, -104.5281,
          88, 70, 130.72,
          144, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-02T08:00:00Z', '2025-06-04T08:00:00Z',
          523, 241, 'Carlsbad Caverns, New Mexico', 'Fort Stockton overnight, Texas',
          32.1776, -104.5281, 27.8006, -97.3964,
          71, 65, 130.72,
          130, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-04T08:00:00Z', '2025-06-05T08:00:00Z',
          0, 158, 'Fort Stockton overnight, Texas', 'El Paso Tesla service, Texas',
          27.8006, -97.3964, 27.8006, -97.3964,
          81, 59, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-05T08:00:00Z', '2025-06-06T08:00:00Z',
          977, 135, 'El Paso Tesla service, Texas', 'Sedona, Grand Canyon (Desert View Watchtower), Arizona',
          27.8006, -97.3964, 34.8697, -111.761,
          89, 60, 244.23,
          433, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-06T08:00:00Z', '2025-06-08T08:00:00Z',
          182, 286, 'Sedona, Grand Canyon (Desert View Watchtower), Arizona', 'Zion National Park (first Utah stop), Utah',
          34.8697, -111.761, 37.2982, -113.0263,
          75, 57, 45.52,
          38, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-08T08:00:00Z', '2025-06-09T08:00:00Z',
          799, 156, 'Zion National Park (first Utah stop), Utah', 'Drove through Las Vegas → Los Angeles, Nevada → California',
          37.2982, -113.0263, 39.8283, -98.5795,
          92, 49, 199.73,
          308, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-09T08:00:00Z', '2025-06-09T08:00:00Z',
          1154, 308, 'Drove through Las Vegas → Los Angeles, Nevada → California', '4 days in Los Angeles, then PCH north, California',
          39.8283, -98.5795, 34.0522, -118.2437,
          88, 61, 288.51,
          225, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-09T08:00:00Z', '2025-06-14T08:00:00Z',
          0, 192, '4 days in Los Angeles, then PCH north, California', 'Redwoods National Park, California',
          34.0522, -118.2437, 34.0522, -118.2437,
          99, 58, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-14T08:00:00Z', '2025-06-15T08:00:00Z',
          685, 274, 'Redwoods National Park, California', 'Cannon Beach, Oregon',
          34.0522, -118.2437, 43.8041, -120.5542,
          76, 48, 171.28,
          150, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-15T08:00:00Z', '2025-06-16T08:00:00Z',
          273, 264, 'Cannon Beach, Oregon', 'Verlot, Mount Baker-Snoqualmie, Washington',
          43.8041, -120.5542, 47.7511, -120.7401,
          76, 49, 68.22,
          62, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-16T08:00:00Z', '2025-06-17T08:00:00Z',
          0, 184, 'Verlot, Mount Baker-Snoqualmie, Washington', 'Sequim, Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          72, 74, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-17T08:00:00Z', '2025-06-18T08:00:00Z',
          0, 352, 'Sequim, Washington', 'Seattle (Brian), Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          84, 64, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-18T08:00:00Z', '2025-06-19T08:00:00Z',
          0, 300, 'Seattle (Brian), Washington', 'Quincy hike, Washington',
          47.7511, -120.7401, 47.7511, -120.7401,
          98, 67, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-19T08:00:00Z', '2025-06-20T08:00:00Z',
          384, 144, 'Quincy hike, Washington', 'Coeur d’Alene (camped overnight), Idaho',
          47.7511, -120.7401, 44.0682, -114.742,
          85, 51, 96.1,
          160, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-20T08:00:00Z', '2025-06-21T08:00:00Z',
          322, 265, 'Coeur d’Alene (camped overnight), Idaho', 'Bozeman, Montana',
          44.0682, -114.742, 47.0527, -109.6333,
          86, 59, 80.44,
          73, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-21T08:00:00Z', '2025-06-22T08:00:00Z',
          0, 129, 'Bozeman, Montana', 'Big Sky (summited Lone Mountain), Montana',
          47.0527, -109.6333, 47.0527, -109.6333,
          78, 69, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-22T08:00:00Z', '2025-06-23T08:00:00Z',
          298, 263, 'Big Sky (summited Lone Mountain), Montana', 'Yellowstone National Park, Wyoming',
          47.0527, -109.6333, 43.0759, -107.2903,
          95, 47, 74.4,
          68, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-23T08:00:00Z', '2025-06-25T08:00:00Z',
          501, 150, 'Yellowstone National Park, Wyoming', 'Salt Lake City → 2-day Provo visit (after Wyoming), Utah',
          43.0759, -107.2903, 37.2982, -113.0263,
          91, 61, 125.2,
          201, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-25T08:00:00Z', '2025-06-27T08:00:00Z',
          799, 173, 'Salt Lake City → 2-day Provo visit (after Wyoming), Utah', 'Denver (Josh), Fort Collins (Caleb), Colorado',
          37.2982, -113.0263, 39.8283, -98.5795,
          73, 60, 199.73,
          278, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-27T08:00:00Z', '2025-07-03T08:00:00Z',
          134, 290, 'Denver (Josh), Fort Collins (Caleb), Colorado', 'Arrived Lincoln for 4-day stay, Nebraska',
          39.8283, -98.5795, 41.4925, -99.9018,
          98, 73, 33.57,
          28, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-03T08:00:00Z', '2025-07-04T08:00:00Z',
          134, 356, 'Arrived Lincoln for 4-day stay, Nebraska', 'Council Bluffs → Badlands, Iowa → South Dakota',
          41.4925, -99.9018, 39.8283, -98.5795,
          82, 49, 33.57,
          23, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-04T08:00:00Z', '2025-07-05T08:00:00Z',
          547, 170, 'Council Bluffs → Badlands, Iowa → South Dakota', 'Fargo (dinner + overnight), North Dakota',
          39.8283, -98.5795, 47.6201, -100.5407,
          96, 78, 136.79,
          194, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-05T08:00:00Z', '2025-07-06T08:00:00Z',
          289, 343, 'Fargo (dinner + overnight), North Dakota', 'Minneapolis, Minnesota',
          47.6201, -100.5407, 46.3544, -94.6859,
          98, 72, 72.35,
          51, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-06T08:00:00Z', '2025-07-07T08:00:00Z',
          338, 325, 'Minneapolis, Minnesota', 'Mars Cheese Castle (Kenosha), Wisconsin',
          46.3544, -94.6859, 43.7844, -88.7879,
          73, 78, 84.52,
          62, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-07T08:00:00Z', '2025-07-08T08:00:00Z',
          573, 309, 'Mars Cheese Castle (Kenosha), Wisconsin', 'Chicago (Wrigleyville, met Connor McBride), Illinois',
          43.7844, -88.7879, 39.8283, -98.5795,
          96, 53, 143.28,
          111, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-08T08:00:00Z', '2025-07-09T08:00:00Z',
          0, 212, 'Chicago (Wrigleyville, met Connor McBride), Illinois', 'Terre Haute (Jack Lavey), Turkey Run State Park, Indiana',
          39.8283, -98.5795, 39.8283, -98.5795,
          81, 78, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-09T08:00:00Z', '2025-07-10T08:00:00Z',
          834, 170, 'Terre Haute (Jack Lavey), Turkey Run State Park, Indiana', 'John Bryan SP, Clifton Gorge, Ohio',
          39.8283, -98.5795, 40.2732, -82.7937,
          78, 47, 208.6,
          295, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-10T08:00:00Z', '2025-07-11T08:00:00Z',
          0, 187, 'John Bryan SP, Clifton Gorge, Ohio', '2 nights in Cincinnati (Cameron Hynes), Ohio',
          40.2732, -82.7937, 40.2732, -82.7937,
          75, 79, 0,
          0, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-11T08:00:00Z', '2025-07-13T08:00:00Z',
          300, 317, '2 nights in Cincinnati (Cameron Hynes), Ohio', 'Erie + Lake Erie, Pennsylvania',
          40.2732, -82.7937, 41.2033, -77.1945,
          79, 43, 75.01,
          57, datetime('now')
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
          71, 78, 33.41,
          48, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-14T08:00:00Z', '2025-07-15T08:00:00Z',
          172, 319, 'Albany (Phil Dalton), New York', 'Green Mountain National Forest, Vermont',
          42.1657, -74.9481, 44.0459, -72.7107,
          75, 42, 43.02,
          32, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-15T08:00:00Z', '2025-07-16T08:00:00Z',
          70, 153, 'Green Mountain National Forest, Vermont', 'White Mountain Visitor Center, New Hampshire',
          44.0459, -72.7107, 43.4525, -71.5639,
          95, 60, 17.6,
          28, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-16T08:00:00Z', '2025-07-17T08:00:00Z',
          1411, 296, 'White Mountain Visitor Center, New Hampshire', 'Bar Harbor, Cadillac Mountain (sunrise hike), Maine',
          43.4525, -71.5639, 39.8283, -98.5795,
          72, 70, 352.72,
          286, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-17T08:00:00Z', '2025-07-19T08:00:00Z',
          1439, 164, 'Bar Harbor, Cadillac Mountain (sunrise hike), Maine', 'Drove through → Connecticut, Massachusetts',
          39.8283, -98.5795, 42.2352, -71.0275,
          75, 70, 359.84,
          527, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-19T08:00:00Z', '2025-07-20T08:00:00Z',
          99, 337, 'Drove through → Connecticut, Massachusetts', 'Stratford stay with Deanna, Connecticut',
          42.2352, -71.0275, 41.5978, -72.7554,
          82, 42, 24.79,
          18, datetime('now')
        );
      

        INSERT INTO drives (
          vehicle_id, journey_id, started_at, ended_at, distance_miles, duration_minutes,
          start_address, end_address, start_latitude, start_longitude,
          end_latitude, end_longitude, start_battery_level, end_battery_level,
          energy_used_kwh, average_speed, created_at
        ) VALUES (
          '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-20T08:00:00Z', '2025-07-25T08:00:00Z',
          64, 206, 'Stratford stay with Deanna, Connecticut', 'Watch Hill Point (coastal visit), Rhode Island',
          41.5978, -72.7554, 41.6809, -71.5118,
          75, 59, 16.12,
          19, datetime('now')
        );
      

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-02T09:00:00.000Z', '2025-06-02T09:24:00.000Z',
            'Supercharger - New Mexico', 22.5, 10.5,
            70, 100, 32.1776,
            -104.5281, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-04T09:00:00.000Z', '2025-06-04T09:28:00.000Z',
            'Supercharger - Texas', 26.25, 12.25,
            65, 100, 27.8006,
            -97.3964, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-06T09:00:00.000Z', '2025-06-06T09:32:00.000Z',
            'Supercharger - Grand Canyon (Desert View Watchtower)', 30, 14,
            60, 100, 34.8697,
            -111.761, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-09T09:00:00.000Z', '2025-06-09T09:41:00.000Z',
            'Supercharger - Nevada → California', 38.25, 17.85,
            49, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-09T09:00:00.000Z', '2025-06-09T09:31:00.000Z',
            'Supercharger - then PCH north', 29.25, 13.65,
            61, 100, 34.0522,
            -118.2437, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-15T09:00:00.000Z', '2025-06-15T09:42:00.000Z',
            'Supercharger - Oregon', 39, 18.2,
            48, 100, 43.8041,
            -120.5542, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-16T09:00:00.000Z', '2025-06-16T09:41:00.000Z',
            'Supercharger - Mount Baker-Snoqualmie', 38.25, 17.85,
            49, 100, 47.7511,
            -120.7401, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-20T09:00:00.000Z', '2025-06-20T09:39:00.000Z',
            'Supercharger - Idaho', 36.75, 17.15,
            51, 100, 44.0682,
            -114.742, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-21T09:00:00.000Z', '2025-06-21T09:33:00.000Z',
            'Supercharger - Montana', 30.75, 14.35,
            59, 100, 47.0527,
            -109.6333, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-23T09:00:00.000Z', '2025-06-23T09:42:00.000Z',
            'Supercharger - Wyoming', 39.75, 18.55,
            47, 100, 43.0759,
            -107.2903, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-25T09:00:00.000Z', '2025-06-25T09:31:00.000Z',
            'Supercharger - Utah', 29.25, 13.65,
            61, 100, 37.2982,
            -113.0263, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-06-27T09:00:00.000Z', '2025-06-27T09:32:00.000Z',
            'Supercharger - Fort Collins (Caleb)', 30, 14,
            60, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-04T09:00:00.000Z', '2025-07-04T09:41:00.000Z',
            'Supercharger - Iowa → South Dakota', 38.25, 17.85,
            49, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-05T09:00:00.000Z', '2025-07-05T09:18:00.000Z',
            'Supercharger - North Dakota', 16.5, 7.7,
            78, 100, 47.6201,
            -100.5407, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-06T09:00:00.000Z', '2025-07-06T09:22:00.000Z',
            'Supercharger - Minnesota', 21, 9.8,
            72, 100, 46.3544,
            -94.6859, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-07T09:00:00.000Z', '2025-07-07T09:18:00.000Z',
            'Supercharger - Wisconsin', 16.5, 7.7,
            78, 100, 43.7844,
            -88.7879, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-08T09:00:00.000Z', '2025-07-08T09:38:00.000Z',
            'Supercharger - met Connor McBride)', 35.25, 16.45,
            53, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-10T09:00:00.000Z', '2025-07-10T09:42:00.000Z',
            'Supercharger - Clifton Gorge', 39.75, 18.55,
            47, 100, 40.2732,
            -82.7937, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-13T09:00:00.000Z', '2025-07-13T09:46:00.000Z',
            'Supercharger - Pennsylvania', 42.75, 19.95,
            43, 100, 41.2033,
            -77.1945, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-15T09:00:00.000Z', '2025-07-15T09:46:00.000Z',
            'Supercharger - Vermont', 43.5, 20.3,
            42, 100, 44.0459,
            -72.7107, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-17T09:00:00.000Z', '2025-07-17T09:24:00.000Z',
            'Supercharger - Cadillac Mountain (sunrise hike)', 22.5, 10.5,
            70, 100, 39.8283,
            -98.5795, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-19T09:00:00.000Z', '2025-07-19T09:24:00.000Z',
            'Supercharger - Massachusetts', 22.5, 10.5,
            70, 100, 42.2352,
            -71.0275, datetime('now')
          );
        

          INSERT INTO charges (
            vehicle_id, journey_id, started_at, ended_at, location, energy_added_kwh,
            cost_usd, start_battery_level, end_battery_level, latitude,
            longitude, created_at
          ) VALUES (
            '5YJYGDEE5LF027324', 'continental-usa-2025', '2025-07-20T09:00:00.000Z', '2025-07-20T09:46:00.000Z',
            'Supercharger - Connecticut', 43.5, 20.3,
            42, 100, 41.5978,
            -72.7554, datetime('now')
          );
        