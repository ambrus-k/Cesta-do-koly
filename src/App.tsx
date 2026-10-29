/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  ShieldCheck,
  Compass,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sun,
  Moon,
  Info,
  Copy,
  Check,
  ArrowLeftRight,
  Ticket,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Map,
  Navigation,
  Smartphone,
  Monitor
} from 'lucide-react';

interface ParkingOption {
  id: string;
  name: string;
  desc: string;
  stopName: string; // Oficiální název zastávky v IDOS / PID pro linky na Prahu
  busLines: string; // Ověřené přímé linky do Prahy (PID 395, 393)
  driveTimeMin: number;
  walkToStopTimeMin: number;
  mapsSearchQuery: string;
  busStopQuery: string;
  tags: string[];
}

interface TrafficMode {
  id: string;
  label: string;
  extraMinutes: number;
  badge: string;
  color: string;
  darkColor: string;
}

// Parkovací lokality v Příbrami s návazností na SKUTEČNÉ ověřené zastávky linek PID 395 a 393 na Prahu
const PARKING_OPTIONS: ParkingOption[] = [
  {
    id: 'aquapark',
    name: 'Aquapark Příbram (Legionářů)',
    desc: 'Velké bezplatné parkoviště – nejbližší zastávka přímých spojů PID 395/393 na Prahu je Příbram, II. poliklinika',
    stopName: 'Příbram, II. poliklinika',
    busLines: 'PID 395 a 393',
    driveTimeMin: 9, // z Trhových Dušník
    walkToStopTimeMin: 3, // cca 180 metrů za rohem v Legionářů / Politických vězňů
    mapsSearchQuery: 'Aquapark Příbram Legionářů',
    busStopQuery: 'Příbram, II. poliklinika',
    tags: ['Doporučeno', 'Zastávka: II. poliklinika (395, 393)', 'Zdarma']
  },
  {
    id: 'nadrazi',
    name: 'Nádraží Příbram (Autobusové nádraží)',
    desc: 'Přímo u autobusového nádraží – výchozí stanice všech spojů PID 395 a 393 (100% jistota místa k sezení)',
    stopName: 'Příbram, aut. nádr.',
    busLines: 'PID 395 a 393 (výchozí stanice)',
    driveTimeMin: 11,
    walkToStopTimeMin: 2,
    mapsSearchQuery: 'Nádraží Příbram parkoviště',
    busStopQuery: 'Příbram, aut. nádr.',
    tags: ['Výchozí stanice aut. nádr.', 'Garantované sezení', 'Všechny spoje']
  },
  {
    id: 'cs_armady',
    name: 'Čs. armády (Dvořákovo nábřeží / Hořejší Obora)',
    desc: 'Centrum města – přímé linky 395 i 393 na Prahu staví přímo na zastávce Československé armády',
    stopName: 'Příbram, Československé armády',
    busLines: 'PID 395 a 393',
    driveTimeMin: 10,
    walkToStopTimeMin: 2,
    mapsSearchQuery: 'Československé armády Příbram parkoviště',
    busStopQuery: 'Příbram, Československé armády',
    tags: ['Centrum', 'Zastávka: Československé armády']
  },
  {
    id: 'skolni',
    name: 'Sevastopolské náměstí / Školní',
    desc: 'Rychlý přístup – přímá linka PID 395 na Prahu staví přímo na Sevastopolském náměstí',
    stopName: 'Příbram, Sevastopolské nám.',
    busLines: 'PID 395',
    driveTimeMin: 10,
    walkToStopTimeMin: 2,
    mapsSearchQuery: 'Školní Příbram parkoviště',
    busStopQuery: 'Příbram, Sevastopolské nám.',
    tags: ['Zastávka: Sevastopolské nám. (395)']
  },
  {
    id: 'jiraskovy_sady',
    name: 'Jiráskovy sady (parkoviště u parku)',
    desc: 'U parku Jiráskovy sady – přímé linky 395 i 393 na Prahu staví přímo na zastávce Jiráskovy sady',
    stopName: 'Příbram, Jiráskovy sady',
    busLines: 'PID 395 a 393',
    driveTimeMin: 10,
    walkToStopTimeMin: 2,
    mapsSearchQuery: 'Jiráskovy sady Příbram parkoviště',
    busStopQuery: 'Příbram, Jiráskovy sady',
    tags: ['Zastávka: Jiráskovy sady (395, 393)']
  },
  {
    id: 'brezove_hory',
    name: 'Březové Hory (nám. J. A. Alise / Fibichova)',
    desc: 'Z Březových Hor jede na Prahu linka 395 ze zastávky Příbram, Březové Hory (zastávka Fibichova na Prahu nejezdí)',
    stopName: 'Příbram, Březové Hory',
    busLines: 'PID 395 a 393',
    driveTimeMin: 12,
    walkToStopTimeMin: 4,
    mapsSearchQuery: 'Březové Hory Příbram náměstí J. A. Alise',
    busStopQuery: 'Příbram, Březové Hory',
    tags: ['Březové Hory', 'Zastávka: Březové Hory (395, 393)']
  }
];

// Režimy dopravní špičky (Strakonická / D4 / Praha)
const TRAFFIC_MODES: TrafficMode[] = [
  {
    id: 'light',
    label: 'Klidný',
    extraMinutes: 0,
    badge: 'Plynulý provoz (+0 min)',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    darkColor: 'dark:text-emerald-300 dark:bg-emerald-950/60 dark:border-emerald-800'
  },
  {
    id: 'normal',
    label: 'Běžný',
    extraMinutes: 10,
    badge: 'Běžná hustota (+10 min)',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    darkColor: 'dark:text-amber-300 dark:bg-amber-950/60 dark:border-amber-800'
  },
  {
    id: 'heavy',
    label: 'Špička',
    extraMinutes: 25,
    badge: 'Zácpy D4 / Strakonická (+25 min)',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    darkColor: 'dark:text-rose-300 dark:bg-rose-950/60 dark:border-rose-800'
  },
  {
    id: 'extreme',
    label: 'Kolona',
    extraMinutes: 45,
    badge: 'Silná kolona (+45 min)',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    darkColor: 'dark:text-purple-300 dark:bg-purple-950/60 dark:border-purple-800'
  }
];

// Typické časy začátku/konce výuky na AMBIS
const AMBIS_CLASS_PRESETS = [
  '08:00',
  '09:45',
  '11:30',
  '13:15',
  '14:30',
  '16:15',
  '18:00'
];

export default function App() {
  const [direction, setDirection] = useState<'to_ambis' | 'to_home'>('to_ambis');
  const [targetTime, setTargetTime] = useState<string>('14:30');
  const [selectedParkingId, setSelectedParkingId] = useState<string>('aquapark');
  const [trafficMode, setTrafficMode] = useState<string>('normal');
  
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showFaq, setShowFaq] = useState<boolean>(false);
  const [copiedSchedule, setCopiedSchedule] = useState<boolean>(false);
  
  const [arrivalBufferMin, setArrivalBufferMin] = useState<number>(15);
  const [parkingSearchBufferMin, setParkingSearchBufferMin] = useState<number>(5);
  const [customBusDuration, setCustomBusDuration] = useState<number>(52);
  const [customMetroDuration, setCustomMetroDuration] = useState<number>(18);
  const [walkFromMetroAmbis, setWalkFromMetroAmbis] = useState<number>(8);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedParking = localStorage.getItem('ambis_parking');
      if (savedParking && PARKING_OPTIONS.some(p => p.id === savedParking)) {
        setSelectedParkingId(savedParking);
      }
      const savedBuffer = localStorage.getItem('ambis_buffer');
      if (savedBuffer) {
        setArrivalBufferMin(Number(savedBuffer));
      }
      const savedDark = localStorage.getItem('ambis_dark');
      if (savedDark !== null) {
        setDarkMode(savedDark === 'true');
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ambis_parking', selectedParkingId);
      localStorage.setItem('ambis_buffer', arrivalBufferMin.toString());
      localStorage.setItem('ambis_dark', darkMode.toString());
    } catch {
      // ignore
    }
  }, [selectedParkingId, arrivalBufferMin, darkMode]);

  const selectedParking = useMemo(() => {
    return PARKING_OPTIONS.find(p => p.id === selectedParkingId) || PARKING_OPTIONS[0];
  }, [selectedParkingId]);

  const activeTraffic = useMemo(() => {
    return TRAFFIC_MODES.find(t => t.id === trafficMode) || TRAFFIC_MODES[1];
  }, [trafficMode]);

  const timeToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const minutesToTime = (totalMinutes: number): string => {
    const norm = (totalMinutes % 1440 + 1440) % 1440;
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Výpočet harmonogramu pro cestu TAM (z Dušník do Ambis)
  const forwardSchedule = useMemo(() => {
    const targetMin = timeToMinutes(targetTime);
    const classStartMin = targetMin;
    const arriveAtSchoolMin = classStartMin - arrivalBufferMin;
    const leaveMetroPalmovkaMin = arriveAtSchoolMin - walkFromMetroAmbis;
    const boardMetroSmichovMin = leaveMetroPalmovkaMin - customMetroDuration;
    const busTravelTotal = customBusDuration + activeTraffic.extraMinutes;
    const busDepartureMin = boardMetroSmichovMin - busTravelTotal;
    const arriveAtBusStopMin = busDepartureMin - 3;
    const leaveCarMin = arriveAtBusStopMin - selectedParking.walkToStopTimeMin;
    const arriveAtParkingMin = leaveCarMin - parkingSearchBufferMin;
    const departDusnikyMin = arriveAtParkingMin - selectedParking.driveTimeMin;

    const backupBusDepMin = busDepartureMin - 20;
    const backupDepartDusnikyMin = departDusnikyMin - 20;
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
      backupDepartDusniky: minutesToTime(backupDepartDusnikyMin),
      backupBusDep: minutesToTime(backupBusDepMin),
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

  // Výpočet harmonogramu pro cestu ZPĚT (z Ambis do Dušník)
  const returnSchedule = useMemo(() => {
    const classEndMin = timeToMinutes(targetTime);
    const leaveSchoolMin = classEndMin;
    const reachPalmovkaMin = leaveSchoolMin + walkFromMetroAmbis;
    const reachSmichovMin = reachPalmovkaMin + customMetroDuration;
    const departSmichovBusMin = reachSmichovMin + 5;
    const busTravelTotal = customBusDuration + activeTraffic.extraMinutes;
    const reachPribramStopMin = departSmichovBusMin + busTravelTotal;
    const reachCarMin = reachPribramStopMin + selectedParking.walkToStopTimeMin;
    const reachHomeMin = reachCarMin + selectedParking.driveTimeMin;
    const totalReturnTripMin = reachHomeMin - classEndMin;

    return {
      classEnd: targetTime,
      leaveSchool: minutesToTime(leaveSchoolMin),
      reachPalmovka: minutesToTime(reachPalmovkaMin),
      reachSmichov: minutesToTime(reachSmichovMin),
      departSmichovBus: minutesToTime(departSmichovBusMin),
      reachPribramStop: minutesToTime(reachPribramStopMin),
      reachCar: minutesToTime(reachCarMin),
      reachHome: minutesToTime(reachHomeMin),
      totalReturnTripMin,
      busTravelTotal
    };
  }, [
    targetTime,
    selectedParking,
    activeTraffic,
    customBusDuration,
    customMetroDuration,
    walkFromMetroAmbis
  ]);

  // 1. Google Mapy: Sloučená celá trasa (Dušníky ➔ Parkoviště Příbram ➔ AMBIS Praha)
  const gmapsCombinedRouteUrl = useMemo(() => {
    const ambisAddress = 'AMBIS vysoká škola, Lindnerova 575/1, Libeň, Praha';
    const dusniky = 'Trhové Dušníky';
    const parkingQuery = selectedParking.mapsSearchQuery;

    if (direction === 'to_ambis') {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(dusniky)}&destination=${encodeURIComponent(ambisAddress)}&waypoints=${encodeURIComponent(parkingQuery)}`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ambisAddress)}&destination=${encodeURIComponent(dusniky)}&waypoints=${encodeURIComponent(parkingQuery)}`;
    }
  }, [direction, selectedParking]);

  // 2. Google Mapy: Celá trasa veřejnou dopravou (MHD)
  const gmapsTransitFullUrl = useMemo(() => {
    const ambisAddress = 'AMBIS vysoká škola, Lindnerova 575/1, Libeň, Praha';
    const dusniky = 'Trhové Dušníky';
    if (direction === 'to_ambis') {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(dusniky)}&destination=${encodeURIComponent(ambisAddress)}&travelmode=transit`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ambisAddress)}&destination=${encodeURIComponent(dusniky)}&travelmode=transit`;
    }
  }, [direction]);

  // 3. Google Mapy: Jen úsek autem (Trhové Dušníky ↔ Parkoviště Příbram)
  const gmapsCarSegmentUrl = useMemo(() => {
    if (direction === 'to_ambis') {
      return `https://www.google.com/maps/dir/?api=1&origin=Trhov%C3%A9+Du%C5%A1n%C3%ADky&destination=${encodeURIComponent(selectedParking.mapsSearchQuery)}&travelmode=driving`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedParking.mapsSearchQuery)}&destination=Trhov%C3%A9+Du%C5%A1n%C3%ADky&travelmode=driving`;
    }
  }, [direction, selectedParking]);

  // 4. Google Mapy: Jen úsek MHD (Zvolená zastávka PID 395/393 ↔ AMBIS Libeň)
  const gmapsTransitSegmentUrl = useMemo(() => {
    const ambisAddress = 'AMBIS vysoká škola, Lindnerova 575/1, Libeň, Praha';
    if (direction === 'to_ambis') {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(selectedParking.busStopQuery)}&destination=${encodeURIComponent(ambisAddress)}&travelmode=transit`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ambisAddress)}&destination=${encodeURIComponent(selectedParking.busStopQuery)}&travelmode=transit`;
    }
  }, [direction, selectedParking]);

  // 5. IDOS: Ověřené spojení na nejbližší stanici MHD přímo u školy AMBIS (Praha, U Kříže – tram 3, 10, 24)
  const idosUrlUKrize = useMemo(() => {
    const pribramStop = selectedParking.stopName.trim();
    const ambisStop = 'Praha, U Kříže';
    if (direction === 'to_ambis') {
      return `https://idos.idnes.cz/vlakyautobusymhdvse/spojeni/?f=${encodeURIComponent(pribramStop)}&t=${encodeURIComponent(ambisStop)}&time=${forwardSchedule.departBus}&byarr=false`;
    } else {
      return `https://idos.idnes.cz/vlakyautobusymhdvse/spojeni/?f=${encodeURIComponent(ambisStop)}&t=${encodeURIComponent(pribramStop)}&time=${returnSchedule.classEnd}&byarr=false`;
    }
  }, [direction, selectedParking, forwardSchedule.departBus, returnSchedule.classEnd]);

  // 6. IDOS: Ověřené spojení na stanici metra B (Praha, Palmovka)
  const idosUrlPalmovka = useMemo(() => {
    const pribramStop = selectedParking.stopName.trim();
    const palmovkaStop = 'Praha, Palmovka';
    if (direction === 'to_ambis') {
      return `https://idos.idnes.cz/vlakyautobusymhdvse/spojeni/?f=${encodeURIComponent(pribramStop)}&t=${encodeURIComponent(palmovkaStop)}&time=${forwardSchedule.departBus}&byarr=false`;
    } else {
      return `https://idos.idnes.cz/vlakyautobusymhdvse/spojeni/?f=${encodeURIComponent(palmovkaStop)}&t=${encodeURIComponent(pribramStop)}&time=${returnSchedule.reachPalmovka}&byarr=false`;
    }
  }, [direction, selectedParking, forwardSchedule.departBus, returnSchedule.reachPalmovka]);

  const handleCopyPlan = () => {
    let text = '';
    if (direction === 'to_ambis') {
      text = `🚗 TRHOVÉ DUŠNÍKY → AMBIS PRAHA (${targetTime})
⏰ Odjezd z domova autem: ${forwardSchedule.departDusniky}
🅿️ Parkování Příbram: ${selectedParking.name} (${forwardSchedule.arriveParking})
🚌 Zastávka na Prahu: ${selectedParking.stopName} (${selectedParking.busLines})
⏰ Odjezd busu: ${forwardSchedule.departBus}
🚇 Metro B Smíchov: ${forwardSchedule.arriveSmichov}
🚶‍♂️ Příchod na Ambis: ${forwardSchedule.arriveAmbis} (výuka od ${targetTime})
🗺️ Trasa v Google Mapách: ${gmapsCombinedRouteUrl}
Celková doba cesty: ${Math.floor(forwardSchedule.totalTripMinutes / 60)}h ${forwardSchedule.totalTripMinutes % 60}m`;
    } else {
      text = `🏢 AMBIS PRAHA → TRHOVÉ DUŠNÍKY (konec ${targetTime})
🚶‍♂️ Konec výuky: ${targetTime}
🚇 Metro B Palmovka: ${returnSchedule.reachPalmovka}
🚌 Bus PID ze Smíchova: ${returnSchedule.departSmichovBus}
🅿️ Výstup v Příbrami: ${selectedParking.stopName} v ${returnSchedule.reachPribramStop}
🏡 Příjezd domů (Dušníky): ${returnSchedule.reachHome}
🗺️ Trasa v Google Mapách: ${gmapsCombinedRouteUrl}
Celková doba návratu: ${Math.floor(returnSchedule.totalReturnTripMin / 60)}h ${returnSchedule.totalReturnTripMin % 60}m`;
    }

    navigator.clipboard.writeText(text);
    setCopiedSchedule(true);
    setTimeout(() => setCopiedSchedule(false), 2200);
  };

  return (
    <div className={darkMode ? 'dark bg-slate-950 text-slate-100 min-h-screen py-4 sm:py-8 px-2 sm:px-4' : 'bg-slate-100 text-slate-800 min-h-screen py-4 sm:py-8 px-2 sm:px-4'}>
      {/* JEDINÉ SJEDNOCENÉ OKNO APLIKACE */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transition-colors">
        
        {/* 1. HLAVIČKA OKNA */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 px-5 sm:px-7 py-4 bg-slate-50/70 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-600 to-indigo-600 text-white p-2 rounded-xl shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                Dušníky → Ambis Plánovač
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Příbram (P+R) • PID 395/393 • Metro B • AMBIS Libeň
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setShowFaq(!showFaq)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                showFaq
                  ? 'bg-amber-100/70 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Informace k jízdence a PID"
            >
              <Ticket className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Jízdenky PID</span>
            </button>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                showSettings 
                  ? 'bg-sky-50 dark:bg-sky-950/70 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300' 
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title="Přizpůsobení rezerv a časů"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Rezervy</span>
            </button>

            <button
              onClick={handleCopyPlan}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition flex items-center gap-1.5"
              title="Kopírovat plán cesty"
            >
              {copiedSchedule ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedSchedule ? 'Zkopírováno' : 'Kopírovat'}</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
              aria-label="Přepnout motiv"
              title={darkMode ? 'Světlý motiv' : 'Tmavý motiv'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>

        {/* 2. PŘEPÍNAČ SMĚRU TRASY */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 px-5 sm:px-7 py-2.5 flex items-center justify-between">
          <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setDirection('to_ambis')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
                direction === 'to_ambis'
                  ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Cesta tam: Dušníky → Ambis
            </button>
            <button
              onClick={() => setDirection('to_home')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition ${
                direction === 'to_home'
                  ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Cesta zpět: Ambis → Dušníky
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-500" />
            <span>Cílová zastávka: <strong>Praha, U Kříže</strong> (3 min od AMBIS)</span>
          </div>
        </div>

        {/* 3. HLAVNÍ VÝSLEDEK (Hero sekce) */}
        <div className={`p-6 sm:p-8 text-white transition-all ${
          direction === 'to_ambis'
            ? 'bg-gradient-to-br from-sky-600 via-indigo-600 to-slate-900'
            : 'bg-gradient-to-br from-indigo-700 via-slate-800 to-sky-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                {direction === 'to_ambis' ? 'Doporučený čas vyjetí autem' : 'Předpokládaný návrat domů'}
              </div>

              <div className="text-xs uppercase tracking-widest text-sky-200 font-semibold">
                {direction === 'to_ambis' ? 'Vyjet autem z Trhových Dušník' : 'Návrat do Trhových Dušník'}
              </div>

              <div className="text-5xl sm:text-6xl font-black tracking-tight my-1.5 flex items-baseline gap-3">
                <span>{direction === 'to_ambis' ? forwardSchedule.departDusniky : returnSchedule.reachHome}</span>
                <span className="text-sm font-normal text-sky-200 uppercase tracking-wider">
                  {direction === 'to_ambis' ? 'nejpozději' : 'doma'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-sky-100 flex items-center gap-2 mt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                {direction === 'to_ambis' ? (
                  <span>
                    Včetně <strong>{arrivalBufferMin} min rezervy</strong> před výukou v <strong>{forwardSchedule.classStart}</strong>
                  </span>
                ) : (
                  <span>
                    Po skončení výuky v <strong>{returnSchedule.classEnd}</strong> (Metro B + Bus PID)
                  </span>
                )}
              </p>

              {direction === 'to_ambis' && (
                <div className="mt-3 text-xs text-sky-200">
                  <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                    🛡️ Pojistka (o bus dřív): vyrazit v <strong>{forwardSchedule.backupDepartDusniky}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 md:min-w-[260px] space-y-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-sky-200 block font-semibold">
                  {direction === 'to_ambis' ? 'Odjezd autobusu na Prahu' : 'Odjezd autobusu ze Smíchova'}
                </span>
                <div className="text-2xl font-bold flex items-center gap-2 mt-0.5">
                  <Bus className="w-5 h-5 text-amber-300" />
                  <span>{direction === 'to_ambis' ? forwardSchedule.departBus : returnSchedule.departSmichovBus}</span>
                </div>
                <div className="text-xs text-sky-200 mt-1">
                  {direction === 'to_ambis' ? (
                    <div>
                      <div className="font-semibold text-white truncate">{selectedParking.stopName}</div>
                      <div className="text-[11px] text-sky-300">{selectedParking.busLines}</div>
                    </div>
                  ) : (
                    <div>
                      <div>Výstup Příbram: <strong>{selectedParking.stopName}</strong></div>
                      <div className="text-[11px] text-sky-300">v cca {returnSchedule.reachPribramStop}</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs text-sky-100">
                <span>Celková doba cesty:</span>
                <span className="font-bold text-white text-sm">
                  {direction === 'to_ambis' 
                    ? `${Math.floor(forwardSchedule.totalTripMinutes / 60)}h ${forwardSchedule.totalTripMinutes % 60}m`
                    : `${Math.floor(returnSchedule.totalReturnTripMin / 60)}h ${returnSchedule.totalReturnTripMin % 60}m`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. GOOGLE MAPY & IDOS – OVĚŘENÁ SPOJENÍ A PŘESNÉ ZASTÁVKY */}
        <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-slate-50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Popis s informací o zařízeních */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {direction === 'to_ambis' 
                    ? `Trasa: Dušníky → ${selectedParking.name.split('(')[0].trim()} → ${selectedParking.stopName} → AMBIS Libeň` 
                    : `Trasa: AMBIS Libeň → Smíchov → ${selectedParking.stopName} → Dušníky`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                  <Check className="w-3 h-3" /> Zastávka na Prahu: {selectedParking.stopName} ({selectedParking.busLines})
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-sky-600" /> Mobil/tablet: aplikace Mapy
                </span>
              </div>
            </div>

            {/* Hlavní prominentní tlačítko – Sloučená celá trasa */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={gmapsCombinedRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] group"
                title="Otevřít celou trasu v Google Mapách (v mobilu otevře aplikaci Google Mapy, na PC web)"
              >
                <Navigation className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                <span>Otevřít celou trasu v Google Mapách</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <a
                href={gmapsTransitFullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition shadow-sm"
                title="Zobrazit celé spojení veřejnou dopravou v Google Mapách"
              >
                <Bus className="w-3.5 h-3.5 text-indigo-600" />
                <span>Celá MHD</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>

          </div>

          {/* Doplňková tlačítka: Ověřené IDOS vyhledávání + Dílčí úseky Google Map */}
          <div className="mt-3.5 pt-3.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center gap-2 text-xs">
            
            {/* IDOS tlačítko 1: Přesně ke škole AMBIS (zastávka U Kříže) */}
            <a
              href={idosUrlUKrize}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 font-semibold transition shadow-xs"
              title={`Vyhledat spojení v IDOS: ${selectedParking.stopName} ➔ Praha, U Kříže (přímo u AMBIS Libeň)`}
            >
              <Train className="w-3.5 h-3.5 text-amber-600" />
              <span>IDOS: {selectedParking.stopName.split(',')[1]?.trim() || selectedParking.stopName} ➔ Praha, U Kříže (AMBIS)</span>
              <ExternalLink className="w-3 h-3 text-amber-600" />
            </a>

            {/* IDOS tlačítko 2: Na metro Palmovka */}
            <a
              href={idosUrlPalmovka}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium transition"
              title={`Vyhledat spojení v IDOS: ${selectedParking.stopName} ➔ Praha, Palmovka (Metro B)`}
            >
              <Train className="w-3.5 h-3.5 text-slate-500" />
              <span>IDOS: ➔ Metro Palmovka</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Google Mapy: Jen auto */}
            <a
              href={gmapsCarSegmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium transition"
              title="Navigace pro jízdu autem mezi Trhovými Dušníky a parkovištěm"
            >
              <Car className="w-3.5 h-3.5 text-sky-600" />
              <span>Jen auto do Příbrami</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Google Mapy: Jen MHD */}
            <a
              href={gmapsTransitSegmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium transition"
              title="Navigace veřejnou dopravou z ověřené zastávky na AMBIS"
            >
              <Bus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Jen MHD ze zastávky</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

          </div>
        </div>

        {/* 5. OVLÁDACÍ PRVKY & PARAMETRY */}
        <div className="border-b border-slate-200/80 dark:border-slate-800 p-5 sm:p-7 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Vstup 1: Čas */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  {direction === 'to_ambis' ? 'Začátek výuky v Ambis' : 'Konec vyučování v Ambis'}
                </span>
              </label>

              <div className="space-y-2">
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-lg font-bold tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />

                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-slate-400 self-center mr-1">Rychle:</span>
                  {AMBIS_CLASS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setTargetTime(preset)}
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition ${
                        targetTime === preset
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vstup 2: Parkování a ověřená zastávka */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-indigo-500" />
                Parkoviště a zastávka na Prahu
              </label>

              <select
                value={selectedParkingId}
                onChange={(e) => setSelectedParkingId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {PARKING_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="mt-2 space-y-1">
                <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">
                    Zastávka na Prahu: <strong className="text-sky-700 dark:text-sky-300">{selectedParking.stopName}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <span>Spoje: {selectedParking.busLines}</span>
                  <span>•</span>
                  <span>Chůze od auta: {selectedParking.walkToStopTimeMin} min</span>
                </div>
              </div>
            </div>

            {/* Vstup 3: Doprava / Špička */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Stav dopravy (D4 / Praha)
              </label>

              <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {TRAFFIC_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setTrafficMode(mode.id)}
                    className={`text-[11px] py-1.5 px-1 rounded-lg font-medium transition text-center truncate ${
                      trafficMode === mode.id
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-sky-700 dark:text-sky-300 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className={`mt-2 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border flex items-center justify-between ${activeTraffic.color} ${activeTraffic.darkColor}`}>
                <span>{activeTraffic.badge}</span>
                <span className="opacity-80">
                  {activeTraffic.extraMinutes > 0 ? `+${activeTraffic.extraMinutes}m zpoždění` : 'standard'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 6. VYSUNOVACÍ NASTAVENÍ REZERV */}
        {showSettings && (
          <div className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-5 sm:p-7 text-xs space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white text-sm">
                <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                Úprava časových úseků a rezerv
              </div>
              <button 
                onClick={() => {
                  setArrivalBufferMin(15);
                  setParkingSearchBufferMin(5);
                  setCustomBusDuration(52);
                  setCustomMetroDuration(18);
                  setWalkFromMetroAmbis(8);
                }}
                className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-medium"
              >
                <RefreshCw className="w-3 h-3" /> Výchozí hodnoty
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Rezerva v budově Ambis:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={arrivalBufferMin}
                    onChange={(e) => setArrivalBufferMin(Math.max(0, Number(e.target.value)))}
                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-bold bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-slate-500">minut před výukou</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Parkování a uzamčení vozu:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={parkingSearchBufferMin}
                    onChange={(e) => setParkingSearchBufferMin(Math.max(1, Number(e.target.value)))}
                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-bold bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-slate-500">minut na parkovišti</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Metro B (Smíchov ↔ Palmovka):</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="14"
                    max="30"
                    value={customMetroDuration}
                    onChange={(e) => setCustomMetroDuration(Math.max(10, Number(e.target.value)))}
                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-bold bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-slate-500">minut (11 stanic)</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Základní jízda bus 395/393:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="40"
                    max="80"
                    value={customBusDuration}
                    onChange={(e) => setCustomBusDuration(Math.max(30, Number(e.target.value)))}
                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-bold bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-slate-500">minut bez zácpy</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Chůze Palmovka ↔ AMBIS:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="4"
                    max="15"
                    value={walkFromMetroAmbis}
                    onChange={(e) => setWalkFromMetroAmbis(Math.max(3, Number(e.target.value)))}
                    className="w-16 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 font-bold bg-slate-50 dark:bg-slate-800"
                  />
                  <span className="text-slate-500">minut chůze (~650 m)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. VYSUNOVACÍ INFORMACE O JÍZDENKÁCH A ZASTÁVKÁCH */}
        {showFaq && (
          <div className="border-b border-slate-200/80 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/20 p-5 sm:p-7 text-xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-1">
              <span className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-amber-600" />
                Ověřené zastávky PID a jízdné pro trasu Příbram ↔ AMBIS Libeň
              </span>
              <button
                onClick={() => setShowFaq(false)}
                className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
              >
                Skrýt
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-amber-950/90 dark:text-amber-200/90">
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                <div className="font-bold mb-1 text-slate-900 dark:text-white">1. Zastávky linek 395 a 393 v Příbrami</div>
                <p>
                  Linka <strong>395</strong> a <strong>393</strong> na Prahu nejezdí ze všech zastávek. Jezdí z: <em>Příbram, aut. nádr.</em>, <em>Příbram, II. poliklinika</em>, <em>Příbram, Československé armády</em>, <em>Příbram, Jiráskovy sady</em>, <em>Příbram, Sevastopolské nám.</em> (pouze 395) a <em>Příbram, Březové Hory</em>.
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                <div className="font-bold mb-1 text-slate-900 dark:text-white">2. Zastávka u školy AMBIS (Praha 8)</div>
                <p>
                  Kampus AMBIS sídlí na adrese <strong>Lindnerova 575/1, Libeň</strong>. Nejbližší zastávka MHD je <strong>Praha, U Kříže</strong> (tramvaje 3, 10, 24 – jen 200 m chůze) nebo stanice <strong>Praha, Palmovka</strong> (metro B – cca 650 m / 8 min pěšky).
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                <div className="font-bold mb-1 text-slate-900 dark:text-white">3. Pásma PID & Jízdné</div>
                <p>
                  Příbram leží v <strong>pásmu 4</strong>. Pokud máte platný pražský kupon (Lítačka), stačí vám jízdenka pro <strong>4 vnější pásma PID</strong> (54 Kč / 180 min). Bez pražské Lítačky kupujete jízdenku pro 5 pásem + Prahu.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 8. ČASOVÁ OSA KROK ZA KROKEM S PŘESNÝMI NÁZVY ZASTÁVEK */}
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {direction === 'to_ambis' 
                  ? 'Podrobný harmonogram cesty krok za krokem' 
                  : 'Harmonogram návratu z výuky domů'}
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              {activeTraffic.label} provoz ({activeTraffic.badge})
            </span>
          </div>

          {direction === 'to_ambis' ? (
            <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              
              {/* Krok 1: Výjezd */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                    1. Výjezd z domova (Trhové Dušníky)
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Trhov%C3%A9+Du%C5%A1n%C3%ADky"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-sky-500 transition"
                      title="Zobrazit Trhové Dušníky na mapě"
                    >
                      <MapPin className="w-3 h-3" />
                    </a>
                  </span>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded font-mono">
                    {forwardSchedule.departDusniky}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Jízda autem cca {selectedParking.driveTimeMin} min směr <strong>{selectedParking.name}</strong>.
                </p>
              </div>

              {/* Krok 2: Parkování */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                    2. Příjezd & zaparkování v Příbrami
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedParking.mapsSearchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-500 transition"
                      title="Zobrazit parkoviště na mapě"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {forwardSchedule.arriveParking} – {forwardSchedule.leaveCar}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lokalita: <strong>{selectedParking.name}</strong>. Rezerva {parkingSearchBufferMin} min na zaparkování a uzamčení auta.
                </p>
              </div>

              {/* Krok 3: Chůze na ověřenou zastávku */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-slate-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Footprints className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                    3. Pěší přesun k zastávce na Prahu: <span className="text-indigo-600 dark:text-indigo-400">{selectedParking.stopName}</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedParking.busStopQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 transition"
                      title="Zobrazit zastávku v Google Mapách"
                    >
                      <MapPin className="w-3 h-3" />
                    </a>
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {forwardSchedule.leaveCar} – {forwardSchedule.arriveStop}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chůze cca {selectedParking.walkToStopTimeMin} min k oficiální zastávce PID <strong>{selectedParking.stopName}</strong> (spoje na Prahu: {selectedParking.busLines}) + 3 min rezerva na peróně.
                </p>
              </div>

              {/* Krok 4: Autobus na Smíchov */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Bus className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                    4. Autobus {selectedParking.busLines} (ze zastávky {selectedParking.stopName} směr Praha Smíchov)
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded font-mono">
                    {forwardSchedule.departBus} → {forwardSchedule.arriveSmichov}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Jízda po D4 cca {forwardSchedule.busTravelTotal} min ({activeTraffic.label.toLowerCase()} provoz se zpožděním +{activeTraffic.extraMinutes} min). Výstup: <em>Praha, Smíchovské nádraží</em>.
                </p>
              </div>

              {/* Krok 5: Metro B na Palmovku */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-yellow-500 text-slate-900 font-bold flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm text-[11px]">
                  B
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                    5. Metro linka B (Smíchovské nádraží → Palmovka)
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {forwardSchedule.arriveSmichov} → {forwardSchedule.arrivePalmovka}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Plynulá podzemní jízda bez kolon (11 stanic, cca 18 min). Směr Černý Most.
                </p>
              </div>

              {/* Krok 6: Příchod k AMBIS (zastávka U Kříže / Lindnerova) */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Footprints className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                    6. Přesun z metra Palmovka k budově AMBIS (Lindnerova 575/1, zastávka U Kříže)
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=AMBIS+vysok%C3%A1+%C5%A1kola+Lindnerova+575/1+Praha+8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-emerald-500 transition"
                      title="Zobrazit budovu AMBIS na mapě"
                    >
                      <MapPin className="w-3 h-3" />
                    </a>
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {forwardSchedule.arrivePalmovka} → {forwardSchedule.arriveAmbis}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pěšky cca 8 min od výstupu z metra Palmovka (směr Divadlo Pod Palmovkou / Lindnerova) nebo 1 zastávka tramvají 3, 10, 24 na zastávku <strong>Praha, U Kříže</strong>.
                </p>
              </div>

              {/* Krok 7: Přednáška v AMBIS */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    7. Začátek přednášky v učebně AMBIS
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-mono">
                    {forwardSchedule.classStart}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  Příjezd do budovy v {forwardSchedule.arriveAmbis} – máte celých {arrivalBufferMin} minut v klidu na šatnu a posluchárnu.
                </p>
              </div>

            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              
              {/* Návrat 1 */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    1. Konec vyučování v budově AMBIS (Lindnerova)
                  </span>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2 py-0.5 rounded font-mono">
                    {returnSchedule.classEnd}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Odchod ze sálu a pěší přesun k metru Palmovka ({walkFromMetroAmbis} min) nebo tramvají ze zastávky Praha, U Kříže.
                </p>
              </div>

              {/* Návrat 2 */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-yellow-500 text-slate-900 font-bold flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm text-[11px]">
                  B
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                    2. Metro B (Palmovka → Smíchovské nádraží)
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {returnSchedule.reachPalmovka} → {returnSchedule.reachSmichov}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Směr Zličín. 11 stanic, 18 minut.
                </p>
              </div>

              {/* Návrat 3 */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Bus className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                    3. Autobus PID 395/393 (Smíchov → {selectedParking.stopName})
                  </span>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded font-mono">
                    {returnSchedule.departSmichovBus} → {returnSchedule.reachPribramStop}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nástupiště Smíchovské nádraží. Výstup v Příbrami na ověřené zastávce <strong>{selectedParking.stopName}</strong> v cca {returnSchedule.reachPribramStop}.
                </p>
              </div>

              {/* Návrat 4 */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Footprints className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                    4. Příchod ze zastávky k autu: {selectedParking.name}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedParking.mapsSearchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-indigo-500 transition"
                      title="Zobrazit parkoviště na mapě"
                    >
                      <MapPin className="w-3 h-3" />
                    </a>
                  </span>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    {returnSchedule.reachCar}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chůze ze zastávky {selectedParking.stopName} k zaparkovanému autu ({selectedParking.walkToStopTimeMin} min).
                </p>
              </div>

              {/* Návrat 5 */}
              <div className="relative">
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-sm">
                  <Car className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                    5. Příjezd autem domů do Trhových Dušník
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-mono">
                    {returnSchedule.reachHome}
                  </span>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  Cesta autem z Příbrami cca {selectedParking.driveTimeMin} min. Bezpečně doma!
                </p>
              </div>

            </div>
          )}
        </div>

        {/* 9. SPODNÍ INFORMAČNÍ LIŠTA */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200/80 dark:border-slate-800 px-5 sm:px-7 py-3.5 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-500 flex-shrink-0" />
            <span>
              Všechny zastávky jsou ověřeny dle PID pro přímé linky <strong>395 a 393</strong> na Prahu. Cílová zastávka v IDOS je <strong>Praha, U Kříže</strong> přímo u AMBIS Libeň.
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Trhové Dušníky ↔ Příbram ↔ AMBIS Libeň
          </span>
        </div>

      </div>
    </div>
  );
}
