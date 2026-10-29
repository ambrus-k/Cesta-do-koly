import React, { useState, useMemo, useEffect } from 'react';
import {
  Car,
  Bus,
  Train,
  Footprints,
  Clock,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Settings,
  ChevronRight,
  ShieldCheck,
  Compass,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon,
  Info
} from 'lucide-react';

// Parkovací lokality v Příbrami s navázáním na zastávky PID
const PARKING_OPTIONS = [
  {
    id: 'aquapark',
    name: 'Aquapark Příbram (Legionářů)',
    desc: 'Největší bezplatné parkoviště, rychlý výjezd na D4',
    stopName: 'Příbram, Archiv / sídl. II. poliklinika',
    driveTimeMin: 9, // z Trhových Dušník
    walkToStopTimeMin: 5,
    mapsSearchQuery: 'Aquapark Příbram Legionářů',
    busStopQuery: 'Příbram, Archiv',
    tags: ['Doporučeno', 'Hodně místa']
  },
  {
    id: 'fibichova',
    name: 'Parkoviště Fibichova (Březové Hory)',
    desc: 'U sídliště, kousek od frekventované zastávky PID',
    stopName: 'Příbram, Fibichova',
    driveTimeMin: 12,
    walkToStopTimeMin: 4,
    mapsSearchQuery: 'Parkoviště Fibichova Příbram',
    busStopQuery: 'Příbram, Fibichova',
    tags: ['Poblíž zastávky']
  },
  {
    id: 'nadrazi',
    name: 'Nádraží Příbram (ČD / Aut. nádraží)',
    desc: 'Začátek linek 395/393, garantované místo k sezení',
    stopName: 'Příbram, aut. nádr.',
    driveTimeMin: 11,
    walkToStopTimeMin: 3,
    mapsSearchQuery: 'Nádraží Příbram parkoviště',
    busStopQuery: 'Příbram, aut. nádr.',
    tags: ['Výchozí stanice']
  },
  {
    id: 'cs_armady',
    name: 'Čs. armády / Dvořákovo nábřeží',
    desc: 'Poblíž centra, pohodlné napojení na Archiv / Jiráskovy sady',
    stopName: 'Příbram, Archiv',
    driveTimeMin: 10,
    walkToStopTimeMin: 6,
    mapsSearchQuery: 'Československé armády Příbram parkoviště',
    busStopQuery: 'Příbram, Archiv',
    tags: ['Centrum']
  },
  {
    id: 'skolni',
    name: 'Sevastopolské náměstí / Školní',
    desc: 'Rychlý pěší přístup k hlavní ose zastávek',
    stopName: 'Příbram, Školní',
    driveTimeMin: 10,
    walkToStopTimeMin: 5,
    mapsSearchQuery: 'Školní Příbram parkoviště',
    busStopQuery: 'Příbram, Školní',
    tags: ['Rychlý přístup']
  }
];

// Režimy dopravní špičky (Strakonická / D4 / Praha)
const TRAFFIC_MODES = [
  { id: 'light', label: 'Volno / Víkend', extraMinutes: 0, badge: 'Plynulý provoz (+0 min)', color: 'text-emerald-500' },
  { id: 'normal', label: 'Běžný provoz', extraMinutes: 10, badge: 'Běžná hustota (+10 min)', color: 'text-amber-500' },
  { id: 'heavy', label: 'Ranní/Odpolední špička', extraMinutes: 25, badge: 'Zácpy D4/Strakonická (+25 min)', color: 'text-rose-500' }
];

export default function App() {
  // Uživatelské vstupy
  const [targetTime, setTargetTime] = useState('14:30');
  const [selectedParkingId, setSelectedParkingId] = useState('aquapark');
  const [trafficMode, setTrafficMode] = useState('normal');
  
  // Uživatelsky nastavitelná zpoždění a rezervy
  const [showSettings, setShowSettings] = useState(false);
  const [arrivalBufferMin, setArrivalBufferMin] = useState(15); // rezerva ve škole
  const [parkingSearchBufferMin, setParkingSearchBufferMin] = useState(5); // rezerva na zaparkování
  const [customBusDuration, setCustomBusDuration] = useState(52); // typická jízda 395 do Smíchova
  const [customMetroDuration, setCustomMetroDuration] = useState(18); // Smíchov -> Palmovka
  const [walkFromMetroAmbis, setWalkFromMetroAmbis] = useState(8); // Palmovka -> Ambis
  const [darkMode, setDarkMode] = useState(false);

  // Inicializace systémového schématu
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  const selectedParking = useMemo(() => {
    return PARKING_OPTIONS.find(p => p.id === selectedParkingId) || PARKING_OPTIONS[0];
  }, [selectedParkingId]);

  const activeTraffic = useMemo(() => {
    return TRAFFIC_MODES.find(t => t.id === trafficMode) || TRAFFIC_MODES[1];
  }, [trafficMode]);

  // Pomocné funkce pro manipulaci s časem
  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (totalMinutes: number) => {
    let norm = (totalMinutes % 1440 + 1440) % 1440;
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Výpočet časového harmonogramu pozpátku
  const schedule = useMemo(() => {
    const targetMin = timeToMinutes(targetTime);

    // Krok 6: Cíl - Začátek výuky
    const classStartMin = targetMin;

    // Krok 5: Příchod do školy s rezervou (přednáškový sál, šatna, kabát)
    const arriveAtSchoolMin = classStartMin - arrivalBufferMin;

    // Krok 4: Výstup z metra Palmovka
    const leaveMetroPalmovkaMin = arriveAtSchoolMin - walkFromMetroAmbis;

    // Krok 3: Nástup na metro B Smíchovské nádraží
    const boardMetroSmichovMin = leaveMetroPalmovkaMin - customMetroDuration;

    // Krok 2: Odjezd autobusu PID 395/393 z Příbrami
    const busTravelTotal = customBusDuration + activeTraffic.extraMinutes;
    const busDepartureMin = boardMetroSmichovMin - busTravelTotal;

    // Krok 1: Příchod na zastávku a chůze od auta
    const arriveAtBusStopMin = busDepartureMin - 3; // 3 minuty rezerva na zastávce
    const leaveCarMin = arriveAtBusStopMin - selectedParking.walkToStopTimeMin;

    // Krok 0: Příjezd k parkovišti v Příbrami
    const arriveAtParkingMin = leaveCarMin - parkingSearchBufferMin;

    // Výjezd z Trhových Dušník
    const departDusnikyMin = arriveAtParkingMin - selectedParking.driveTimeMin;

    const totalTripMinutes = classStartMin - departDusnikyMin;

    return {
      departDusniky: minutesToTime(departDusnikyMin),
      arriveParking: minutesToTime(arriveAtParkingMin),
      leaveCar: minutesToTime(leaveCarMin),
      arriveStop: minutesToTime(arriveAtBusStopMin),
      departBus: minutesToTime(busDepartureMin),
      arriveSmichov: minutesToTime(boardMetroSmichovMin),
      arrivePalmovka: minutesToTime(leaveMetroPalmovkaMin),
      arriveAmbis: minutesToTime(arriveAtSchoolMin),
      classStart: targetTime,
      totalTripMinutes,
      busTravelTotal
    };
  }, [
    targetTime,
    selectedParking,
    activeTraffic,
    arrivalBufferMin,
    parkingSearchBufferMin,
    customBusDuration,
    customMetroDuration,
    walkFromMetroAmbis
  ]);

  // Generování URL pro Google Mapy
  const gmapsCarUrl = `https://www.google.com/maps/dir/?api=1&origin=Trhov%C3%A9+Du%C5%A1n%C3%ADky&destination=${encodeURIComponent(selectedParking.mapsSearchQuery)}&travelmode=driving`;
  
  const gmapsTransitUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedParking.busStopQuery)}&destination=AMBIS+vysok%C3%A1+%C5%A1kola+Lindnerova+Praha&travelmode=transit`;

  const gmapsFullUrl = `https://www.google.com/maps/dir/?api=1&origin=Trhov%C3%A9+Du%C5%A1n%C3%ADky&destination=AMBIS+vysok%C3%A1+%C5%A1kola,+Lindnerova+575/1,+Praha+8-Libe%C5%88`;

  const idosUrl = `https://idos.idnes.cz/vlakyautobusymhdvse/spojeni/?f=${encodeURIComponent(selectedParking.stopName.split('/')[0].trim())}&t=Libe%C5%88,+Divadlo+Pod+Palmovkou&time=${schedule.departBus}&byarr=false`;

  return (
    <div className={darkMode ? 'dark bg-slate-950 text-slate-100 min-h-screen' : 'bg-slate-50 text-slate-800 min-h-screen'}>
      {/* Horní hlavička */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-md">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-tight">Dušníky → Ambis Plánovač</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Přesný kalkulátor odjezdu a parkování v Příbrami</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg border text-sm transition flex items-center gap-1.5 ${
                showSettings 
                  ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-300' 
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Nastavení časů a rezerv"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">Předvolby</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              aria-label="Přepnout motiv"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Ovládací panel vstupů */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Začátek výuky */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                Začátek výuky v Ambis
              </label>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-semibold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Cíl: Ambis Praha (Libeň, Lindnerova)
              </span>
            </div>

            {/* Výběr parkování v Příbrami */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-indigo-500" />
                Parkoviště Příbram
              </label>
              <select
                value={selectedParkingId}
                onChange={(e) => setSelectedParkingId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {PARKING_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block truncate">
                Zastávka PID: {selectedParking.stopName}
              </span>
            </div>

            {/* Stav dopravy / Špička */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Stav dopravy (D4 / Praha)
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {TRAFFIC_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTrafficMode(mode.id)}
                    className={`text-xs py-2 px-1 rounded-lg font-medium transition text-center ${
                      trafficMode === mode.id
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-600 dark:text-sky-300 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {mode.label.split('/')[0]}
                  </button>
                ))}
              </div>
              <span className={`text-[11px] mt-1 block font-medium ${activeTraffic.color}`}>
                {activeTraffic.badge}
              </span>
            </div>

          </div>
        </section>

        {/* Panel pokročilého nastavení rezerv */}
        {showSettings && (
          <section className="bg-slate-100 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Přizpůsobení časových rezerv a úseků</h3>
              </div>
              <button 
                onClick={() => {
                  setArrivalBufferMin(15);
                  setParkingSearchBufferMin(5);
                  setCustomBusDuration(52);
                  setCustomMetroDuration(18);
                  setWalkFromMetroAmbis(8);
                }}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Výchozí hodnoty
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Rezerva ve škole před začátkem:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={arrivalBufferMin}
                    onChange={(e) => setArrivalBufferMin(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <span className="text-xs font-medium">minut</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Hledání místa + zaparkování v Příbrami:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={parkingSearchBufferMin}
                    onChange={(e) => setParkingSearchBufferMin(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <span className="text-xs font-medium">minut</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Metro B (Smíchovské nádr. → Palmovka):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="14"
                    max="30"
                    value={customMetroDuration}
                    onChange={(e) => setCustomMetroDuration(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <span className="text-xs font-medium">minut</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Jízda autobusem 395/393 (základ bez špičky):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="40"
                    max="80"
                    value={customBusDuration}
                    onChange={(e) => setCustomBusDuration(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <span className="text-xs font-medium">minut</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Chůze z metra Palmovka k budově Ambis:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="4"
                    max="15"
                    value={walkFromMetroAmbis}
                    onChange={(e) => setWalkFromMetroAmbis(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <span className="text-xs font-medium">minut</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Hlavní doporučení - Kdy vyrazit */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-600 via-indigo-600 to-slate-900 text-white p-6 md:p-8 shadow-xl">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Doporučený bezpečný čas startu
              </div>
              <h2 className="text-xs uppercase tracking-widest text-sky-200 font-semibold">Vyrazit autem z Trhových Dušník</h2>
              <div className="text-5xl md:text-6xl font-black tracking-tight my-1 flex items-baseline gap-2">
                <span>{schedule.departDusniky}</span>
                <span className="text-sm font-normal text-sky-200">nejpozději</span>
              </div>
              <p className="text-sm text-sky-100 flex items-center gap-2 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                Včetně bezpečné rezervy {arrivalBufferMin} min v Ambis před výukou ({schedule.classStart})
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:min-w-[240px] space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-sky-200 block font-semibold">Odjezd busu z Příbrami</span>
                <div className="text-2xl font-bold flex items-center gap-2">
                  <Bus className="w-5 h-5 text-amber-300" />
                  <span>{schedule.departBus}</span>
                </div>
                <span className="text-xs text-sky-200 truncate block">ze stanice {selectedParking.stopName.split('/')[0]}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-sky-100">
                <span>Celková doba cesty:</span>
                <span className="font-semibold text-white">{Math.floor(schedule.totalTripMinutes / 60)}h {schedule.totalTripMinutes % 60}m</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tlačítka pro rychlé otevření v Google Maps a IDOS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={gmapsCarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-800 dark:text-slate-200 group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300">
                <Car className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-snug">1. Autem do Příbrami</div>
                <div className="text-[11px] text-slate-500">Google Mapy navigace</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition" />
          </a>

          <a
            href={gmapsTransitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-800 dark:text-slate-200 group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                <Bus className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-snug">2. Spojení Příbram → Ambis</div>
                <div className="text-[11px] text-slate-500">Google Veřejná doprava</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition" />
          </a>

          <a
            href={idosUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-800 dark:text-slate-200 group shadow-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300">
                <Train className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold leading-snug">Jízdní řády IDOS (PID)</div>
                <div className="text-[11px] text-slate-500">Ověřit aktuální odjezd</div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
          </a>
        </section>

        {/* Podrobný interaktivní rozpad cesty (Časová osa) */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-500" />
            Podrobný harmonogram cesty krok za krokem
          </h3>

          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            
            {/* Krok 1: Výjezd */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                <Car className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  Výjezd z domova (Trhové Dušníky)
                </span>
                <span className="text-sm font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded">
                  {schedule.departDusniky}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Jízda autem cca {selectedParking.driveTimeMin} min směr {selectedParking.name}.
              </p>
            </div>

            {/* Krok 2: Parkování */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Příjezd & parkování: {selectedParking.name}
                </span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                  {schedule.arriveParking} – {schedule.leaveCar}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Započteno {parkingSearchBufferMin} min na zaparkování a uzamčení vozu.
              </p>
            </div>

            {/* Krok 3: Chůze na zastávku */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                <Footprints className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Pěší přesun na zastávku PID
                </span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                  {schedule.leaveCar} – {schedule.arriveStop}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chůze {selectedParking.walkToStopTimeMin} min k zastávce: <strong>{selectedParking.stopName}</strong> (+ rezerva na peróně).
              </p>
            </div>

            {/* Krok 4: Autobus 395 / 393 */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                <Bus className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  Autobus PID 395 / 393 (Směr Praha)
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                  {schedule.departBus} → {schedule.arriveSmichov}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Doba jízdy: cca {schedule.busTravelTotal} min (zahrnuje dopravní zpoždění {activeTraffic.extraMinutes} min pro {activeTraffic.label.toLowerCase()}). Cílová zastávka: <em>Praha, Smíchovské nádraží</em>.
              </p>
            </div>

            {/* Krok 5: Metro B */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-yellow-500 text-slate-900 font-bold flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm text-[11px]">
                B
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Metro linka B (Smíchovské nádraží → Palmovka)
                </span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                  {schedule.arriveSmichov} → {schedule.arrivePalmovka}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Plynulá jízda podzemím bez vlivu povrchových zácp (11 stanic, cca 18 min).
              </p>
            </div>

            {/* Krok 6: Chůze do školy */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                <Footprints className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Chůze z Palmovky do kampusu Ambis
                </span>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                  {schedule.arrivePalmovka} → {schedule.arriveAmbis}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Výstup z metra Palmovka směr Divadlo Pod Palmovkou → ulice Lindnerova 575/1 (cca {walkFromMetroAmbis} minut).
              </p>
            </div>

            {/* Krok 7: Začátek výuky */}
            <div className="relative">
              <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-bold text-slate-900 dark:text-white">
                  Začátek vyučování v učebně
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  {schedule.classStart}
                </span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                Příjezd na místo v {schedule.arriveAmbis} – máte celých {arrivalBufferMin} minut na přezutí, nalezení učebny a přípravu.
              </p>
            </div>

          </div>
        </section>

        {/* Informační karta pro parkování a tipy */}
        <section className="bg-slate-100 dark:bg-slate-900/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
          <Info className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Doporučení pro cestu:</span>
            <p>
              U <strong>Aquaparku Příbram</strong> je parkování zpravidla nejklidnější s přímou pěší trasou k zastávce <em>Archiv</em> nebo <em>sídl. II. poliklinika</em>. V pátek a v ranních špičkách mezi 6:45–8:15 a 14:00–16:30 na Strakonické doporučujeme zvolit režim <em>"Silná špička"</em>, který automaticky přidá 25 minut rezervy k autobusu.
            </p>
          </div>
        </section>

      </main>

      {/* Patička */}
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 mt-8">
        Vytvořeno pro trasu Trhové Dušníky → Příbram → Praha Ambis (Libeň). Připraveno pro hosting na GitHub & Vercel.
      </footer>
    </div>
  );
}