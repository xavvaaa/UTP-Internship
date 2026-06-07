export const DEFAULT_SEAT_LAYOUT_ID = 'a320_180'

export const SEAT_LAYOUTS = [
  {
    id: 'a320_180',
    aircraftType: 'A320',
    name: 'Airbus A320',
    description: '180 seats, single aisle, 3-3 economy',
    cabins: [
      { name: 'Business Class', rows: rangeRows(1, 3, ['A', 'B', 'C'], ['D', 'E', 'F']), premium: true },
      { name: 'Economy Class', rows: rangeRows(4, 30, ['A', 'B', 'C'], ['D', 'E', 'F']) },
    ],
  },
  {
    id: 'b737_800_189',
    aircraftType: 'B737-800',
    name: 'Boeing 737-800',
    description: '189 seats, single aisle, 3-3 economy',
    cabins: [
      { name: 'Business Class', rows: rangeRows(1, 4, ['A', 'B', 'C'], ['D', 'E', 'F']), premium: true },
      { name: 'Economy Class', rows: rangeRows(5, 32, ['A', 'B', 'C'], ['D', 'E', 'F']) },
    ],
  },
  {
    id: 'a321_220',
    aircraftType: 'A321',
    name: 'Airbus A321',
    description: '220 seats, longer single aisle, 3-3 economy',
    cabins: [
      { name: 'Business Class', rows: rangeRows(1, 4, ['A', 'B', 'C'], ['D', 'E', 'F']), premium: true },
      { name: 'Economy Class', rows: rangeRows(5, 37, ['A', 'B', 'C'], ['D', 'E', 'F']) },
    ],
  },
  {
    id: 'a330_300_2_4_2',
    aircraftType: 'A330-300',
    name: 'Airbus A330-300',
    description: 'Widebody, twin aisle, 2-4-2 economy',
    cabins: [
      { name: 'Business Class', rows: rangeRows(1, 6, ['A', 'C'], ['D', 'G'], ['H', 'K']), premium: true },
      { name: 'Economy Class', rows: rangeRows(10, 45, ['A', 'C'], ['D', 'E', 'F', 'G'], ['H', 'K']) },
    ],
  },
  {
    id: 'b777_300_3_4_3',
    aircraftType: 'B777-300',
    name: 'Boeing 777-300',
    description: 'Widebody, twin aisle, 3-4-3 economy',
    cabins: [
      { name: 'Business Class', rows: rangeRows(1, 8, ['A', 'C'], ['D', 'G'], ['H', 'K']), premium: true },
      { name: 'Economy Class', rows: rangeRows(10, 55, ['A', 'B', 'C'], ['D', 'E', 'F', 'G'], ['H', 'J', 'K']) },
    ],
  },
  {
    id: 'b787_9_3_3_3',
    aircraftType: 'B787-9',
    name: 'Boeing 787-9',
    description: 'Widebody, twin aisle, 3-3-3 economy',
    cabins: [
      { name: 'Business Class', rows: rangeRows(1, 7, ['A', 'C'], ['D', 'F'], ['H', 'K']), premium: true },
      { name: 'Economy Class', rows: rangeRows(10, 42, ['A', 'B', 'C'], ['D', 'E', 'F'], ['H', 'J', 'K']) },
    ],
  },
]

export function getSeatLayout(layoutId) {
  return SEAT_LAYOUTS.find((layout) => layout.id === layoutId) || SEAT_LAYOUTS[0]
}

export function getSeatLayoutOption(layoutId) {
  const layout = getSeatLayout(layoutId)
  return {
    seat_layout_id: layout.id,
    aircraft_type: layout.aircraftType,
  }
}

function rangeRows(start, end, ...sections) {
  return Array.from({ length: end - start + 1 }, (_value, index) => ({
    number: start + index,
    sections,
  }))
}
