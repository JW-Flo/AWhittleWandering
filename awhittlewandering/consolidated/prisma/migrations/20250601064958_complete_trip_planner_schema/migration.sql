-- CreateTable
CREATE TABLE "ChargingStation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "stalls" INTEGER NOT NULL DEFAULT 1,
    "power" REAL NOT NULL,
    "amenities" TEXT NOT NULL,
    "hours" TEXT,
    "reliability" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "estimatedMiles" REAL NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "requiredStops" INTEGER NOT NULL DEFAULT 0,
    "weatherRisk" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Waypoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "routeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "stationId" TEXT,
    "minSoCRequired" REAL,
    "fallbackOptions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Waypoint_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Waypoint_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfflineMapTile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "z" INTEGER NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "format" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MapTileRoute" (
    "tileId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("tileId", "routeId"),
    CONSTRAINT "MapTileRoute_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "OfflineMapTile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapTileRoute_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MapTileWaypoint" (
    "tileId" TEXT NOT NULL,
    "waypointId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("tileId", "waypointId"),
    CONSTRAINT "MapTileWaypoint_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "OfflineMapTile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapTileWaypoint_waypointId_fkey" FOREIGN KEY ("waypointId") REFERENCES "Waypoint" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MapTileStation" (
    "tileId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("tileId", "stationId"),
    CONSTRAINT "MapTileStation_tileId_fkey" FOREIGN KEY ("tileId") REFERENCES "OfflineMapTile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MapTileStation_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeatherAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "description" TEXT NOT NULL,
    "impact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LocationVisit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "tripId" TEXT,
    "stationId" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "arrivalTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departureTime" DATETIME,
    "stateOfCharge" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LocationVisit_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LocationVisit_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LocationVisit_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "ChargingStation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LocationVisit" ("arrivalTime", "createdAt", "departureTime", "id", "latitude", "longitude", "stateOfCharge", "tripId", "updatedAt", "vehicleId") SELECT "arrivalTime", "createdAt", "departureTime", "id", "latitude", "longitude", "stateOfCharge", "tripId", "updatedAt", "vehicleId" FROM "LocationVisit";
DROP TABLE "LocationVisit";
ALTER TABLE "new_LocationVisit" RENAME TO "LocationVisit";
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleId" TEXT NOT NULL,
    "routeId" TEXT,
    "startLocation" TEXT NOT NULL,
    "endLocation" TEXT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "totalMiles" REAL,
    "averageSpeed" REAL,
    "energyUsed" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Trip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("averageSpeed", "createdAt", "endLocation", "endTime", "energyUsed", "id", "startLocation", "startTime", "totalMiles", "updatedAt", "vehicleId") SELECT "averageSpeed", "createdAt", "endLocation", "endTime", "energyUsed", "id", "startLocation", "startTime", "totalMiles", "updatedAt", "vehicleId" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "OfflineMapTile_z_x_y_key" ON "OfflineMapTile"("z", "x", "y");
