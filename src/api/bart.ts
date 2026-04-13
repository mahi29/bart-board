const BART_API_BASE = 'https://api.bart.gov/api/etd.aspx';
const BART_API_KEY = import.meta.env.VITE_BART_API_KEY;

type BartEstimate = {
  minutes: string;
  direction: string;
  hexcolor: string;
  bikeflag: string;
  delay: string;
};

type BartDeparture = {
  destination: string;
  abbreviation: string;
  estimate: BartEstimate | BartEstimate[];
};

type BartStationResponse = {
  root: {
    station: Array<{
      etd: BartDeparture | BartDeparture[];
    }>;
  };
};

export type Departure = {
  stationCode: string;
  stationLabel: string;
  destination: string;
  minutes: number;
  displayMinutes: string;
  departureTime: string;
};

type StationConfig = {
  stationCode: string;
  stationLabel: string;
  destinationCode: string;
};

const STATION_CONFIGS: StationConfig[] = [
  {
    stationCode: 'WDUB',
    stationLabel: 'West Dublin',
    destinationCode: 'DALY'
  },
  {
    stationCode: 'MONT',
    stationLabel: 'Montgomery St (MONT)',
    destinationCode: 'DUBL'
  }
];

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseMinutes(minutes: string): number {
  return minutes === 'Leaving' ? 0 : Number.parseInt(minutes, 10);
}

function formatDepartureTime(minutes: number): string {
  const departure = new Date(Date.now() + minutes * 60_000);

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  }).format(departure);
}

async function fetchStationDepartures(config: StationConfig): Promise<Departure[]> {
  if (!BART_API_KEY) {
    throw new Error('Missing VITE_BART_API_KEY');
  }

  const url = new URL(BART_API_BASE);
  url.searchParams.set('cmd', 'etd');
  url.searchParams.set('orig', config.stationCode);
  url.searchParams.set('key', BART_API_KEY);
  url.searchParams.set('json', 'y');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`BART request failed for ${config.stationLabel}`);
  }

  const data = (await response.json()) as BartStationResponse;
  const station = data.root.station[0];

  return toArray(station?.etd)
    .filter((departure) => departure.abbreviation === config.destinationCode)
    .flatMap((departure) =>
      toArray(departure.estimate).map((estimate) => {
        const minutes = parseMinutes(estimate.minutes);

        return {
          stationCode: config.stationCode,
          stationLabel: config.stationLabel,
          destination: departure.destination,
          minutes,
          displayMinutes: minutes === 0 ? 'Now' : `${minutes} min`,
          departureTime: formatDepartureTime(minutes)
        };
      })
    )
    .sort((left, right) => left.minutes - right.minutes)
    .slice(0, 2);
}

export async function fetchCommuteDepartures(): Promise<Record<string, Departure[]>> {
  const departures = await Promise.all(
    STATION_CONFIGS.map(async (config) => [config.stationCode, await fetchStationDepartures(config)] as const)
  );

  return Object.fromEntries(departures);
}
