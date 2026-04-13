import { useEffect, useState } from 'react';
import { fetchCommuteDepartures, type Departure } from './api/bart';
import { fetchWeather, type WeatherSnapshot } from './api/weather';

type DashboardState = {
  weather: WeatherSnapshot | null;
  departures: Record<string, Departure[]>;
  updatedAt: Date | null;
};

const INITIAL_STATE: DashboardState = {
  weather: null,
  departures: {},
  updatedAt: null
};

const STATIONS = [
  { code: 'WDUB', label: 'West Dublin', accentClass: 'station-home' },
  { code: 'MONT', label: 'Montgomery St', accentClass: 'station-work' }
] as const;

function App() {
  const [data, setData] = useState<DashboardState>(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const [weather, departures] = await Promise.all([
          fetchWeather(),
          fetchCommuteDepartures()
        ]);

        if (!active) {
          return;
        }

        setData({
          weather,
          departures,
          updatedAt: new Date()
        });
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();
    const intervalId = window.setInterval(() => {
      void loadDashboard();
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="dashboard">
      <section className="weather-strip">
        {loading && !data.weather ? (
          <p>Loading weather...</p>
        ) : data.weather ? (
          <>
            <p className="weather-line">
              <span className="label">Weather:</span> {data.weather.temperature}° {data.weather.icon}{' '}
              {data.weather.description} <span className="muted">H:{data.weather.high} L:{data.weather.low}</span>
            </p>
            {typeof data.weather.rainChance === 'number' ? (
              <p className="weather-subline muted">Rain chance: {data.weather.rainChance}%</p>
            ) : null}
          </>
        ) : (
          <p>Weather unavailable.</p>
        )}
      </section>

      {error ? <p className="status error">{error}</p> : null}

      {STATIONS.map((station) => (
        <section key={station.code} className={`station-block ${station.accentClass}`}>
          <h2 className="station-heading">
            <span className="station-dot" aria-hidden="true" />
            <span>{station.label}</span>
          </h2>
          {loading && !data.departures[station.code] ? (
            <p className="status">Loading departures...</p>
          ) : (
            <DepartureTable departures={data.departures[station.code] ?? []} />
          )}
        </section>
      ))}

      <footer className="footer muted">
        {data.updatedAt
          ? `Updated ${new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit'
            }).format(data.updatedAt)}`
          : 'Waiting for first refresh'}
      </footer>
    </main>
  );
}

function DepartureTable({ departures }: { departures: Departure[] }) {
  if (departures.length === 0) {
    return <p className="status">No matching departures right now.</p>;
  }

  return (
    <table className="departures">
      <tbody>
        {departures.map((departure) => (
          <tr key={`${departure.stationCode}-${departure.destination}-${departure.departureTime}`}>
            <td className="time">{departure.departureTime}</td>
            <td className="destination">{departure.destination}</td>
            <td className="minutes">{departure.displayMinutes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default App;
