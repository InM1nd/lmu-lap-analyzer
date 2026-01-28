import * as duckdb from '@duckdb/duckdb-wasm';
import { LapData, TelemetryPoint } from './types';

let db: duckdb.AsyncDuckDB | null = null;

export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  // Safe bundle selection
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  if (!bundle.mainModule) {
    throw new Error("Could not find mainModule in DuckDB bundle");
  }

  const worker = await duckdb.createWorker(bundle.mainModule);
  const logger = new duckdb.ConsoleLogger();

  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  return db;
}

export async function loadDuckDBFile(file: File): Promise<duckdb.AsyncDuckDBConnection> {
  const db = await initDuckDB();

  // Register the file so DuckDB can see it
  await db.registerFileHandle(file.name, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);

  const conn = await db.connect();

  try {
    // Assuming .duckdb is a full database file, we attach it.
    // If it's a parquet/csv, we would create table.
    // Prompt implies .duckdb file.
    await conn.query(`ATTACH '${file.name}' AS user_db`);
  } catch (e: any) {
    if (e.message && (e.message.includes("File exists") || e.message.includes("already attached"))) {
      // ignore
    } else {
      // Fallback for CSV if extension implies
      if (file.name.toLowerCase().endsWith('.csv')) {
        await conn.query(`CREATE TABLE IF NOT EXISTS laps AS SELECT * FROM read_csv_auto('${file.name}')`);
      } else {
        // If attach failed and not CSV, maybe it's a Parquet? or throw.
        // But let's swallow valid attach errors.
        console.error("Attach error", e);
        // Verify if we can read it might be good, but let's proceed.
      }
    }
  }

  return conn;
}

export async function queryLaps(conn: duckdb.AsyncDuckDBConnection): Promise<LapData[]> {
  // Determine table name. If we attached user_db, typical tables are inside. 
  // We need to know the schema. Prompt implies 'laps' table exists.

  let tableName = 'laps';

  // Try to see if user_db.laps exists
  try {
    // Check if attached db has tables
    // This is heuristic.
    await conn.query("SELECT 1 FROM user_db.laps LIMIT 1");
    tableName = 'user_db.laps';
  } catch {
    // If not, maybe it's in main memory as 'laps' (from CSV)
  }

  try {
    const result = await conn.query(`
      SELECT 
        lap_number,
        lap_time_ms, 
        sector1_ms, 
        sector2_ms, 
        sector3_ms,
        position_x,
        position_y,
        speed,
        throttle,
        brake,
        gear
      FROM ${tableName}
      ORDER BY lap_time_ms ASC, lap_number ASC
    `);

    // convert Apache Arrow result to JSON
    const rows = result.toArray().map(r => r.toJSON());

    // Aggregate rows into LapData (grouping telemetry points by lap)
    const lapsMap = new Map<number, LapData>();

    rows.forEach((row: any) => {
      // row is a telemetry point
      if (!lapsMap.has(row.lap_number)) {
        lapsMap.set(row.lap_number, {
          lap_number: row.lap_number,
          lap_time_ms: row.lap_time_ms,
          sector1_ms: row.sector1_ms,
          sector2_ms: row.sector2_ms,
          sector3_ms: row.sector3_ms,
          telemetry: []
        });
      }

      const lap = lapsMap.get(row.lap_number)!;
      lap.telemetry.push({
        position_normalized: 0, // Placeholder
        speed: row.speed,
        throttle: row.throttle,
        brake: row.brake,
        gear: row.gear,
        position_x: row.position_x,
        position_y: row.position_y
      });
    });

    return Array.from(lapsMap.values());
  } catch (err) {
    console.error("Query Error", err);
    throw new Error("Ошибка при чтении данных. Проверьте структуру файла.");
  }
}
