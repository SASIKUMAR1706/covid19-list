const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dataBasePath = path.join(__dirname, "covid19India.db");

const app = express();
app.use(express.json());

let dataBase = null;

const intializeDBAndServer = async () => {
  try {
    dataBase = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running Successfully http://localhost:3000/");
    });
  } catch (error) {
    console.log("DB Error:${error.message}");
    process.exit(1);
  }
};

intializeDBAndServer();

const convertStateDBObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDBObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API1 get method

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
    *
    FROM 
    state;`;

  const statesList = await dataBase.all(getStatesQuery);
  response.send(
    statesList.map((eachlist) => convertStateDBObjectToResponseObject(eachlist))
  );
});

//API2 get method

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const statesIdQuery = `
    SELECT *
    FROM state 
    WHERE state_id=${stateId};`;
  const statesId = await dataBase.get(statesIdQuery);
  response.send(convertStateDBObjectToResponseObject(statesId));
});

//API3 district post

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const districtPostQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES
    ('${districtName}',
    ${stateId},${cases},${cured},${active},${deaths});`;
  await dataBase.run(districtPostQuery);
  response.send("District Successfully Added");
});

//API4 get method

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtIdQuery = `
     SELECT *
     FROM district
     WHERE district_id=${districtId};`;
  const districtValues = await dataBase.get(districtIdQuery);
  response.send(convertDistrictDBObjectToResponseObject(districtValues));
});

//API5 Delete method

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district
    WHERE district_id=${districtId};`;
  await dataBase.run(deleteQuery);
  response.send("District Removed");
});

// api6 put method

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putUpdateQuery = `
    UPDATE district 
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths} 
    WHERE 
    district_id=${districtId};`;
  await dataBase.run(putUpdateQuery);
  response.send("District Details Updated");
});

//API7 get method

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const statesIdStatsQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district
     WHERE
      state_id=${stateId};`;
  const stats = await dataBase.get(statesIdStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API8 get Method

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const districtIdQuery = `
     
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await dataBase.get(districtIdQuery);
  response.send({
    stateName: state.state_name,
  });
});

module.exports = app;
