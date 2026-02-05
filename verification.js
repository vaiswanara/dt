// Quick verification of drawSouthIndianChart function logic
// This shows what the function will produce with sample data

const testNatal = {
    Lagna: 4,
    Su: 8, Ch: 8, Ku: 5, Bu: 8, Gu: 8,
    Sk: 7, Sa: 11, Ra: 7, Ke: 1
};

const testTransit = {
    Gu: 2,  // Transit Guru in house 2
    Sa: 11  // Transit Shani in house 11
};

console.log("=== EXPECTED CHART OUTPUT ===\n");

// Simulate the function logic
const natalByHouse = {};
for (let house = 1; house <= 12; house++) {
    natalByHouse[house] = [];
}

// Add natal planets
for (const [planet, house] of Object.entries(testNatal)) {
    if (planet !== 'Lagna' && house >= 1 && house <= 12) {
        natalByHouse[house].push(planet);
    }
}

// Add transit planets
if (testTransit.Gu && testTransit.Gu >= 1 && testTransit.Gu <= 12) {
    natalByHouse[testTransit.Gu].push('Tg');
}
if (testTransit.Sa && testTransit.Sa >= 1 && testTransit.Sa <= 12) {
    natalByHouse[testTransit.Sa].push('Ts');
}

// Display results
const houseLayout = [
    [12, 1, 2, 3],
    [11, 'center', 'center', 4],
    [10, 'center', 'center', 5],
    [9, 8, 7, 6]
];

houseLayout.forEach((row, rowIdx) => {
    let rowStr = '';
    row.forEach((house) => {
        if (house === 'center') {
            rowStr += '[CENTER]'.padEnd(15);
        } else {
            const planets = natalByHouse[house].join(', ') || '(empty)';
            const cellStr = `House ${house}: ${planets}`;
            rowStr += cellStr.padEnd(20);
        }
    });
    console.log(rowStr);
    if (rowIdx < 3) console.log('');
});

console.log("\n=== VERIFICATION ===");
console.log(`House 1: ${natalByHouse[1].join(', ')} (should be empty)`);
console.log(`House 2: ${natalByHouse[2].join(', ')} (should have: Tg)`);
console.log(`House 8: ${natalByHouse[8].join(', ')} (should have: Su, Ch, Bu, Gu)`);
console.log(`House 11: ${natalByHouse[11].join(', ')} (should have: Sa, Ts)`);
