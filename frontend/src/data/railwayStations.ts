import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export interface RailwayStation {
  id: number;
  code: string;
  name: string;
  state: string;
  zone: string;
  latitude: number | null;
  longitude: number | null;
}

let allStationsCache: RailwayStation[] = []

export const fetchRailwayStations = async (): Promise<RailwayStation[]> => {
  if (allStationsCache.length > 0) {
    return allStationsCache
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/stations`)
    allStationsCache = response.data
    return response.data
  } catch (error) {
    console.error('Error fetching railway stations:', error)
    return []
  }
}

export const getStationByCode = async (code: string): Promise<RailwayStation | undefined> => {
  if (allStationsCache.length === 0) {
    await fetchRailwayStations()
  }
  return allStationsCache.find(station => station.code === code)
}