// dasha.js - Vimshottari Dasha calculator
(function(global){
    // Use same planet abbreviations as chart: Su, Ch, Ku, Bu, Gu, Sk, Sa, Ra, Ke
    // Vimshottari order (mapped to chart abbreviations): Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury
    const PLANET_ORDER = ['Ke','Sk','Su','Ch','Ku','Ra','Gu','Sa','Bu'];
    const PERIOD_YEARS = { Ke:7, Sk:20, Su:6, Ch:10, Ku:7, Ra:18, Gu:16, Sa:19, Bu:17 };
    const MS_PER_YEAR = 365.2425 * 24 * 3600 * 1000;

    function pad(n){ return n<10? '0'+n: ''+n; }
    function formatDate(d){ if(!d) return 'N/A'; d = new Date(d); return pad(d.getDate()) + '-' + pad(d.getMonth()+1) + '-' + d.getFullYear(); }

    function moonLongitudeFromRashi(rashiNum, degrees){
        const rn = Number(rashiNum) || 1;
        const deg = Number(degrees) || 0;
        return ((rn - 1) * 30) + deg;
    }

    function nakshatraIndexFromLongitude(longitude){
        // 27 nakshatras, each 13.333333... degrees
        const span = 360 / 27;
        let idx = Math.floor((longitude % 360) / span);
        if (idx < 0) idx = 0;
        if (idx > 26) idx = 26;
        const frac = ((longitude % span) / span);
        return { idx, frac }; // idx 0..26, frac 0..1 within the nakshatra
    }

    function nextPlanetIndex(idx, step){ return (idx + step) % PLANET_ORDER.length; }

    function buildMahadashaSequence(birthDate, moonLongitude){
        const nak = nakshatraIndexFromLongitude(moonLongitude);
        const nakIdx = nak.idx; const posFrac = nak.frac; // position inside nakshatra
        const remainingFrac = 1 - posFrac; // fraction of current nakshatra left

        // mahadasha lord for this nakshatra
        const mahaLord = PLANET_ORDER[nakIdx % 9];
        // remaining years of current mahadasha
        const mahaRemainingYears = PERIOD_YEARS[mahaLord] * remainingFrac;

        const sequence = [];
        // start date is birthDate
        let cursor = new Date(birthDate);

        // First (current) mahadasha with remaining length
        sequence.push({ lord: mahaLord, years: mahaRemainingYears, start: new Date(cursor), end: new Date(cursor.getTime() + mahaRemainingYears * MS_PER_YEAR) });
        cursor = sequence[0].end;

        // Then subsequent full mahadashas until we've generated a reasonable span (e.g., total covering 120 years from birth)
        // We'll generate next 8 mahadashas to cover the full cycle
        let startIdx = PLANET_ORDER.indexOf(mahaLord);
        for (let i = 1; i < 9; i++){
            const idx = (startIdx + i) % 9;
            const lord = PLANET_ORDER[idx];
            const years = PERIOD_YEARS[lord];
            const start = new Date(cursor);
            const end = new Date(cursor.getTime() + years * MS_PER_YEAR);
            sequence.push({ lord, years, start, end });
            cursor = end;
        }

        return sequence; // array of mahadashas starting from current remainder
    }

    function subdivideAntardashas(mahaSeq){
        // For each mahadasha, compute its antardasha subdivisions
        return mahaSeq.map(maha => {
            const mahaLen = maha.years; // in years
            const start = new Date(maha.start);
            const antars = [];
            // antardasha planets start from maha.lord and cycle through 9 planets
            const startIdx = PLANET_ORDER.indexOf(maha.lord);
            let cursor = new Date(start);
            for (let i = 0; i < 9; i++){
                const pIdx = (startIdx + i) % 9;
                const lord = PLANET_ORDER[pIdx];
                const years = mahaLen * (PERIOD_YEARS[lord] / 120);
                const s = new Date(cursor);
                const e = new Date(cursor.getTime() + years * MS_PER_YEAR);
                antars.push({ lord, years, start: s, end: e });
                cursor = e;
            }
            return { maha, antars };
        });
    }

    function subdividePratyantar(antar){
        // antar: { lord, years, start, end }
        const antarLen = antar.years;
        const startIdx = PLANET_ORDER.indexOf(antar.lord);
        let cursor = new Date(antar.start);
        const pratys = [];
        for (let i = 0; i < 9; i++){
            const pIdx = (startIdx + i) % 9;
            const lord = PLANET_ORDER[pIdx];
            const years = antarLen * (PERIOD_YEARS[lord] / 120);
            const s = new Date(cursor);
            const e = new Date(cursor.getTime() + years * MS_PER_YEAR);
            pratys.push({ lord, years, start: s, end: e });
            cursor = e;
        }
        return pratys;
    }

    function calculateVimshottariDasha(birthDateIso, moonRashiNum, moonDegrees){
        if (!birthDateIso) return { error: 'Missing birth date' };
        const bd = new Date(birthDateIso);
        if (isNaN(bd)) return { error: 'Invalid birth date' };
        const moonLon = moonLongitudeFromRashi(moonRashiNum, moonDegrees);

        const mahaSeq = buildMahadashaSequence(bd, moonLon);
        const mahaWithAntar = subdivideAntardashas(mahaSeq);

        // Build flattened rows: for each maha -> each antar -> each pratyantara
        const rows = [];
        mahaWithAntar.forEach(m => {
            m.antars.forEach(antar => {
                const prats = subdividePratyantar(antar);
                prats.forEach(pr => {
                    rows.push({
                        maha: m.maha.lord,
                        antar: antar.lord,
                        pratyantara: pr.lord,
                        from: new Date(pr.start),
                        to: new Date(pr.end)
                    });
                });
            });
        });

        return { rows, meta: { moonLongitude: moonLon, nakshatra: Math.floor((moonLon % 360)/(360/27)) } };
    }

    // Public API
    global.Dasha = {
        calculateVimshottariDasha,
        formatDate
    };
})(window);
