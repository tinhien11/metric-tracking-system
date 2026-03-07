const TYPES = {
    DISTANCE:    'distance',
    TEMPERATURE: 'temperature',
};

// Distance: base unit = meter
const DISTANCE_TO_METER = {
    meter:      1,
    centimeter: 0.01,
    inch:       0.0254,
    feet:       0.3048,
    yard:       0.9144,
};

// Temperature helpers (base = Celsius)
function toCelsius(value, unit) {
    if (unit === 'C') return value;
    if (unit === 'F') return (value - 32) * 5 / 9;
    if (unit === 'K') return value - 273.15;
    throw new Error(`Unknown temperature unit: ${unit}`);
}

function fromCelsius(value, unit) {
    if (unit === 'C') return value;
    if (unit === 'F') return value * 9 / 5 + 32;
    if (unit === 'K') return value + 273.15;
    throw new Error(`Unknown temperature unit: ${unit}`);
}

function convert(value, fromUnit, toUnit, type) {
    if (fromUnit === toUnit) return value;

    if (type === TYPES.DISTANCE) {
        const factor = DISTANCE_TO_METER[fromUnit];
        if (!factor) throw new Error(`Unknown distance unit: ${fromUnit}`);
        const targetFactor = DISTANCE_TO_METER[toUnit];
        if (!targetFactor) throw new Error(`Unknown distance unit: ${toUnit}`);
        return (value * factor) / targetFactor;
    }

    if (type === TYPES.TEMPERATURE) {
        return fromCelsius(toCelsius(value, fromUnit), toUnit);
    }

    throw new Error(`Unknown type: ${type}`);
}

const DISTANCE_UNITS    = Object.keys(DISTANCE_TO_METER);
const TEMPERATURE_UNITS = ['C', 'F', 'K'];

module.exports = { convert, DISTANCE_UNITS, TEMPERATURE_UNITS, TYPES };
