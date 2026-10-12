/* Gidi Rush - game tuning, characters, themes and flavour text */
(function () {
  'use strict';
  var GR = (window.GR = window.GR || {});

  GR.CFG = {
    LANE_W: 2.3,          // distance between lane centres
    ROAD_HALF: 4,         // half the road width
    SIDEWALK: 2.2,
    START_SPEED: 13,
    MAX_SPEED: 31,
    SPEED_RAMP: 0.0105,   // extra speed per metre run
    GRAVITY: 34,
    JUMP_V: 11.6,
    SLIDE_TIME: 0.72,
    LANE_RATE: 15,
    CHASE_FAR: 20,
    CHASE_NEAR: 2.3,
    STUMBLE_RECOVER: 7,
    BOOST_MULT: 1.65,
    POWER: { magnet: 10, shield: 12, double: 10, boost: 5 },
    SEG_MIN: 115,
    SEG_MAX: 170
  };

  GR.CHARACTERS = [
    {
      id: 'tunde', name: 'Tunde', title: 'The Student',
      desc: 'Late for morning assembly again. Backpack full, legs fast.',
      stat: { speed: 3, style: 4, wahala: 2 },
      colors: { skin: '#6a4127', shirt: '#f5f5f2', sleeve: '#f5f5f2', upperLeg: '#203a72', lowerLeg: '#6a4127', shoe: '#161616', hair: '#141414', accent: '#7a1f2b' }
    },
    {
      id: 'amaka', name: 'Amaka', title: 'The Market Queen',
      desc: 'Runs the busiest fabric stall in Balogun. Nobody outruns her bargains.',
      stat: { speed: 3, style: 5, wahala: 3 },
      colors: { skin: '#7a4b2a', shirt: 'ankara', sleeve: 'ankara', upperLeg: 'ankara', lowerLeg: '#7a4b2a', shoe: '#7b4a21', hair: '#141414', accent: '#ffd23f' }
    },
    {
      id: 'chidi', name: 'Chidi', title: 'The Footballer',
      desc: 'Street-football legend in green and white. Dribbles danfos for fun.',
      stat: { speed: 5, style: 3, wahala: 3 },
      colors: { skin: '#5c3a21', shirt: '#0b8a3e', sleeve: '#0b8a3e', upperLeg: '#f7f7f7', lowerLeg: '#0b8a3e', shoe: '#101010', hair: '#141414', accent: '#ffffff' }
    }
  ];

  GR.THEME_ORDER = ['market', 'lekki', 'bridge'];
  GR.THEMES = {
    market: {
      name: 'Lagos Island Market', welcome: 'WELCOME TO LAGOS ISLAND',
      skyTop: '#4f9fe0', skyBottom: '#fbe3bb', fog: '#f1d9b0', water: '#3d6f7d',
      hemiSky: '#fff3dc', hemiGround: '#7a5a3a', sun: '#fff0cf', sunI: 1.15, hemiI: 0.95,
      fogNear: 45, fogFar: 165, sunDir: [-0.5, 0.55, -1]
    },
    lekki: {
      name: 'Lekki', welcome: 'WELCOME TO LEKKI',
      skyTop: '#2f86e0', skyBottom: '#d3ecff', fog: '#cfe4f4', water: '#2f7fa0',
      hemiSky: '#eef7ff', hemiGround: '#5c7a52', sun: '#ffffff', sunI: 1.2, hemiI: 1.0,
      fogNear: 50, fogFar: 180, sunDir: [0.6, 0.7, -0.6]
    },
    bridge: {
      name: 'Third Mainland Bridge', welcome: 'THIRD MAINLAND BRIDGE',
      skyTop: '#33245f', skyBottom: '#ff9346', fog: '#e9966c', water: '#4d5f8c',
      hemiSky: '#ffd2a8', hemiGround: '#5a3048', sun: '#ffb070', sunI: 1.05, hemiI: 0.85,
      fogNear: 40, fogFar: 175, sunDir: [-0.2, 0.12, -1]
    }
  };

  GR.TEXT = {
    start: ['Oya run!', 'Make we go!', 'Gidi no dey wait!', 'Run am!'],
    crash: ['E don cast!', 'Wahala dey o!', 'You fall hand!', 'Na wa o!'],
    caught: ['Agbero don catch you!', 'E don cast! Agbero hold you!', 'Owo da? Agbero don catch you!'],
    gutter: ['You enter gutter!', 'E don cast! Gutter swallow you!'],
    wall: ['You no turn o!', 'E don cast! You jam wall!'],
    best: ['You don japa! New best!', 'Japa complete! New high score!'],
    stumble: ['Agbero dey come o!', 'Shine your eye!', 'Careful o!', 'Agbero don see you!'],
    milestone: ['You dey try!', 'Correct!', 'No shaking!', 'You too much!', 'Gidi legend!'],
    turnHint: 'Turn! Turn!',
    power: {
      magnet: 'Magnet! Kudi dey follow you',
      shield: 'Shield on! No shaking',
      double: 'Double Kudi! x2',
      boost: 'Okada Boost! Hold tight!'
    },
    shieldBreak: 'Shield save you!'
  };

  GR.SHOP_NAMES = [
    "GOD'S TIME VENTURES", 'MAMA PUT KITCHEN', 'FINE BOY BARBING SALON', 'NO SHAKING ELECTRONICS',
    'BLESSED HANDS TAILORING', 'EKO PHONES & ACCESSORIES', 'CHOP LIFE SUPERMARKET', 'OMO LAGOS FABRICS',
    'JOLLOF REPUBLIC', 'GIDI PRINTS', 'AGEGE BREAD HOUSE', 'CORRECT GUY SPARE PARTS', 'BALOGUN TEXTILES',
    'SWEET MOTHER RESTAURANT', 'WAZOBIA WEARS', 'ANKARA WORLD', 'SMALL CHOPS PALACE', 'IYA SADE PROVISIONS',
    'NEW YAM STORES', 'OGA MECHANIC', 'BIG BROS POS', 'ZOBO & CHAPMAN', 'ASO-EBI HOUSE', 'SHARP SHARP LAUNDRY'
  ];
  GR.BANNERS = [
    'OWAMBE THIS SATURDAY!', 'HAPPY 70TH BIRTHDAY, MAMA!', 'MEGA SALE \u2022 BALOGUN', 'EKO O NI BAJE',
    'WELCOME TO GIDI', 'JOLLOF FESTIVAL \u2022 THIS WEEKEND', 'AREA FOOTBALL FINAL \u2022 SUNDAY', 'DETTY DECEMBER LOADING...'
  ];
  GR.BILLBOARDS = [
    'GIDI RUSH \u2022 RUN DI CITY', 'SMALL CHOPS. BIG VIBES.', 'SUYA NIGHT \u2022 EVERY FRIDAY', 'LAGOS NO DEY SLEEP',
    'FRESH ZOBO \u2022 ICE COLD', 'BUY 1 GET 1 PUFF-PUFF', 'AFROBEATS LIVE \u2022 ONIKAN', 'CHOP LIFE \u2022 NO STRESS'
  ];
})();
