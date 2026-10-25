// One shared category tree for all stores. Each store has its own categories; these keyword
// rules map products onto [group, subgroup]. Rules are tried in order, so specific ones come first.

const r = (re) => new RegExp(re, "i");

export const TAXONOMY = [
  {
    group: "3D Printing",
    match: r(String.raw`\b3d print|filament|nozzle|extruder|hotend|\bpla\b|\bpetg\b|\btpu\b`),
    subs: [
      ["Filament", r(String.raw`filament|\bpla\b|\bpetg\b|\babs\b|\btpu\b`)],
      ["Nozzles & Hotends", r(String.raw`nozzle|hotend|hot end|heater block|throat|extruder|heat ?break|teflon|ptfe|bowden`)],
      ["Printer Boards & Drivers", r(String.raw`board|mainboard|ramps|\bskr\b|driver|tmc|a4988|drv8825|display|lcd`)],
      ["Beds & Build Surfaces", r(String.raw`\bbed\b|build plate|platform|sheet|pei|glass`)],
      ["Motion Parts", r(String.raw`rail|bearing|pulley|belt|lead ?screw|coupl|wheel|rod|v-slot|idler`)],
      ["3D Printers", r(String.raw`printer`)],
    ],
  },
  {
    group: "Test & Measurement",
    match: r(String.raw`multimeter|oscilloscope|clamp meter|tester|measur|(?<!potentio|centi|milli|kilo|dia)meters?\b|logic analy|gauge|tachometer|signal gen|function gen|\blcr\b|thermometer|caliper|laser level|\bdetector|megger|hygrometer`),
    subs: [
      ["Oscilloscopes", r(String.raw`oscilloscope|\bscope\b`)],
      ["Clamp Meters", r(String.raw`clamp`)],
      ["Multimeters", r(String.raw`multimeter|multi-meter|avometer`)],
      ["Signal Generators & Analyzers", r(String.raw`logic analy|signal gen|function gen|frequency|spectrum|counter`)],
      ["Component Testers", r(String.raw`component tester|transistor tester|\blcr\b|\besr\b|capacitance|capacitor meter`)],
      ["Panel Meters", r(String.raw`panel|voltmeter|ammeter|volt.?amp|wattmeter|power meter|energy meter|kwh`)],
      ["Thermal & Environment", r(String.raw`thermo|thermal|temperature|hygrometer|humid|lux|light meter|sound level|anemometer|\bgas\b`)],
      ["Distance & Levels", r(String.raw`caliper|laser|distance|level|tape|ruler|micrometer|angle`)],
      ["Electrical Testers", r(String.raw`insulation|megger|earth|ground|voltage tester|tester|detector|phase`)],
    ],
  },
  {
    group: "Tools & Soldering",
    match: r(String.raw`solder|plier|screwdriver|cutter|stripper|crimp|heat gun|tweezer|desolder|hand tool|\btools?\b|drill|glue gun|wrench|magnif`),
    subs: [
      ["Hot Air & Rework", r(String.raw`hot ?air|rework|heat gun|preheat`)],
      ["Soldering Irons & Stations", r(String.raw`soldering (iron|station|gun)|solder station|iron\b`)],
      ["Tips & Accessories", r(String.raw`\btips?\b|stand|cleaner|holder|handle|sponge|helping hand|third hand`)],
      ["Solder, Flux & Desoldering", r(String.raw`solder wire|solder paste|flux|desolder|wick|paste|\btin\b|solder\b`)],
      ["Pliers, Cutters & Crimpers", r(String.raw`plier|cutter|nipper|stripper|crimp`)],
      ["Screwdrivers & Bits", r(String.raw`screwdriver|\bbits?\b|torx|hex key|allen`)],
      ["Power Tools", r(String.raw`drill|grinder|rotary|dremel|\bsaw\b|cordless|impact|polisher`)],
      ["Glue & Adhesives", r(String.raw`glue|adhesive|tape|epoxy|silicone sealant`)],
      ["Hand Tools", r(String.raw`tweezer|wrench|knife|\bfile\b|hammer|magnif|spanner|socket set|tool (kit|set|box|bag)`)],
    ],
  },
  {
    group: "Dev Boards & Microcontrollers",
    match: r(String.raw`arduino|esp32|esp8266|nodemcu|raspberry|stm32|microcontroller|development board|dev ?board|\bpic\d|atmega|attiny|micro:?bit|blue ?pill|\bpico\b|jetson|single board|fpga|\bmcu\b`),
    subs: [
      ["Programmers & Debuggers", r(String.raw`programmer|st-?link|usbasp|jtag|debugger|pickit|burner|j-?link`)],
      ["Shields & Expansion Boards", r(String.raw`shield|expansion|\bhat\b|breakout board for`)],
      ["Raspberry Pi", r(String.raw`raspberry|\brpi\b`)],
      ["ESP32 & ESP8266", r(String.raw`esp32|esp8266|nodemcu|wemos|esp-?01|esp-?12`)],
      ["STM32 & ARM Boards", r(String.raw`stm32|blue ?pill|black ?pill|nucleo|\barm\b|cortex`)],
      ["Microcontroller Chips", r(String.raw`atmega|attiny|\bpic\d|pic1[0-8]|\bdip\b|\btqfp|\bqfn|\bsop\b|chip|\bic\b`)],
      ["Arduino Boards", r(String.raw`arduino|\buno\b|\bnano\b|\bmega\b|leonardo|pro mini|pro micro`)],
      ["FPGA & Other Boards", r(String.raw`fpga|jetson|beagle|micro:?bit|\bpico\b|orange pi|banana pi|cpld`)],
    ],
  },
  {
    group: "Sensors",
    match: r(String.raw`sensor|detector|\bpir\b|ultrasonic|gyro|acceleromet|\bimu\b|thermocouple|\bdht\d|\bmq-?\d|load cell|encoder|hx711`),
    subs: [
      ["Temperature & Humidity", r(String.raw`temp|humid|\bdht|ds18b20|thermo|\bntc\b|lm35|\bbme|\bbmp|\bsht|max6675`)],
      ["Distance & Proximity", r(String.raw`ultrasonic|distance|proximity|obstacle|\btof\b|lidar|vl53|infrared|\bir\b|sr04|line track`)],
      ["Motion, IMU & Position", r(String.raw`\bpir\b|motion|gyro|accel|\bimu\b|mpu|compass|magnetometer|tilt|vibration|encoder|hall|radar|microwave`)],
      ["Gas & Air Quality", r(String.raw`\bgas\b|\bmq-?\d|co2|smoke|air quality|dust|alcohol|methane|lpg`)],
      ["Light & Color", r(String.raw`light|\bldr\b|photo|colou?r|\buv\b|lux|flame`)],
      ["Current & Voltage", r(String.raw`current|voltage sensor|acs7|ina2|zmpt|\bct\b`)],
      ["Pressure, Force & Weight", r(String.raw`pressure|force|load cell|weight|hx711|flex|barometer`)],
      ["Water, Soil & Liquid", r(String.raw`water|soil|rain|flow|level|\bph\b|turbidity|moisture|liquid|tds`)],
      ["Sound", r(String.raw`sound|microphone|\bmic\b|voice`)],
      ["Touch & Biometric", r(String.raw`touch|fingerprint|capacitive|heart|pulse|oximeter|ecg|emg`)],
    ],
  },
  {
    group: "Motors & Drivers",
    match: r(String.raw`motor|servo|stepper|\bdriver\b|\bl298|\besc\b|actuator|pump|solenoid|\bfans?\b|peltier`),
    subs: [
      ["Motor Drivers", r(String.raw`driver|l298|tb6612|a4988|drv8825|tmc2|h-?bridge|controller|\besc\b`)],
      ["Servo Motors", r(String.raw`servo`)],
      ["Stepper Motors", r(String.raw`stepper|nema`)],
      ["Brushless Motors", r(String.raw`brushless|bldc`)],
      ["Pumps, Valves & Solenoids", r(String.raw`pump|solenoid|valve|actuator`)],
      ["Fans & Cooling", r(String.raw`\bfans?\b|cooler|cooling|peltier|tec1`)],
      ["DC & Gear Motors", r(String.raw`motor`)],
    ],
  },
  {
    group: "Power Supplies & Converters",
    match: r(String.raw`power supply|power suppl|\bsmps\b|adapter|buck|boost|step.?(up|down)|converter|inverter|transformer|mean ?well|regulator module|\bpsu\b|\bups\b|variac`),
    subs: [
      ["Lab & Bench Supplies", r(String.raw`bench|\blab\b|laboratory|programmable|variable dc|adjustable dc power supply`)],
      ["Buck (Step-Down)", r(String.raw`buck|step.?down|lm2596|xl4015|mp1584`)],
      ["Boost (Step-Up)", r(String.raw`boost|step.?up|mt3608|xl6009`)],
      ["Inverters & UPS", r(String.raw`inverter|\bups\b`)],
      ["Transformers", r(String.raw`transformer|variac`)],
      ["Adapters", r(String.raw`adapter|wall|plug-?in|charger`)],
      ["Switching Power Supplies", r(String.raw`smps|switching|mean ?well|enclosed|din rail|led driver|power supply`)],
      ["DC-DC & Other Converters", r(String.raw`converter|dc-?dc|regulator`)],
    ],
  },
  {
    group: "Batteries & Charging",
    match: r(String.raw`batter|charger|\bbms\b|18650|21700|lipo|li-?ion|lithium|cell holder|solar`),
    subs: [
      ["Battery Holders", r(String.raw`holder|\bbox\b|\bcase\b|clip|snap`)],
      ["BMS & Protection", r(String.raw`\bbms\b|protection|balance|balancer`)],
      ["Chargers & Charging Modules", r(String.raw`charg|tp4056|ip5306`)],
      ["Solar", r(String.raw`solar`)],
      ["LiPo", r(String.raw`lipo|li-po|polymer`)],
      ["Li-ion & 18650", r(String.raw`18650|21700|26650|li-?ion|lithium|lifepo`)],
      ["Lead-Acid", r(String.raw`lead|\bsla\b|acid|\b12v \d+ah`)],
      ["Coin & Primary Cells", r(String.raw`cr2032|cr\d{4}|coin|button cell|\baaa?\b|alkaline|\b9v\b|zinc`)],
    ],
  },
  {
    group: "Displays & LEDs",
    match: r(String.raw`\blcd|oled|display|\btft\b|\bleds?\b|7.?segment|dot matrix|neopixel|ws2812|lamp|e-?paper|e-?ink`),
    subs: [
      ["OLED", r(String.raw`oled`)],
      ["E-Paper", r(String.raw`e-?paper|e-?ink`)],
      ["TFT & Graphic LCD", r(String.raw`\btft\b|graphic|12864|ili9|st77|touch|\bhmi\b|nextion|inch`)],
      ["Character LCD", r(String.raw`16x2|20x4|1602|2004|character|\blcd\b`)],
      ["7-Segment & Matrix", r(String.raw`segment|matrix|max7219`)],
      ["LED Strips & Addressable", r(String.raw`strip|ws28|neopixel|addressable|sk6812`)],
      ["Power LEDs & Lamps", r(String.raw`power led|\bcob\b|lamp|bulb|high power|\d+w\b|flood|spot`)],
      ["Single LEDs", r(String.raw`\bleds?\b`)],
    ],
  },
  {
    group: "Wireless & IoT",
    match: r(String.raw`bluetooth|wi-?fi|\brf\b|lora|gsm|\bgps\b|\bnrf|zigbee|antenna|\bsim\d{3}|rfid|\bnfc\b|433 ?mhz|transceiver|\bgprs\b|\b4g\b`),
    subs: [
      ["RFID & NFC", r(String.raw`rfid|\bnfc\b|rc522|pn532|tag|card`)],
      ["GSM, 4G & GPS", r(String.raw`gsm|gprs|\b4g\b|lte|\bsim\d|\bgps\b|gnss|neo-?\d`)],
      ["Bluetooth", r(String.raw`bluetooth|\bble\b|hc-?0[56]|hm-?10`)],
      ["Wi-Fi", r(String.raw`wi-?fi`)],
      ["RF, LoRa & Zigbee", r(String.raw`\brf\b|lora|nrf|zigbee|433|315|transceiver|xbee`)],
      ["Antennas", r(String.raw`antenna`)],
    ],
  },
  {
    group: "Audio & Video",
    match: r(String.raw`speaker|buzzer|microphone|\bmic\b|audio|amplifier|camera|sound|headphone|\bmp3\b`),
    subs: [
      ["Amplifiers", r(String.raw`amplifier|\bamp\b|tpa|pam8|tda|lm386`)],
      ["Cameras", r(String.raw`camera|ov\d{4}|cam\b`)],
      ["Speakers & Buzzers", r(String.raw`speaker|buzzer|piezo|horn|siren`)],
      ["Microphones", r(String.raw`microphone|\bmic\b`)],
      ["Audio Modules & Players", r(String.raw`mp3|player|recorder|audio|decoder|dfplayer`)],
    ],
  },
  {
    group: "Relays, Switches & Buttons",
    match: r(String.raw`relay|switch|button|keypad|joystick|toggle|contactor|circuit breaker`),
    subs: [
      ["Relay Modules", r(String.raw`relay (module|board)|channel relay|\d ?ch(annel)? relay|relay shield`)],
      ["Solid State Relays", r(String.raw`solid state|\bssr\b`)],
      ["Contactors & Breakers", r(String.raw`contactor|breaker|\bmcb\b|overload|timer relay|time relay`)],
      ["Relays", r(String.raw`relay`)],
      ["Keypads & Joysticks", r(String.raw`keypad|joystick|keyboard|membrane`)],
      ["Limit & Micro Switches", r(String.raw`limit|micro ?switch|reed|endstop`)],
      ["Push Buttons", r(String.raw`push|button|tactile|\btact\b`)],
      ["Toggle, Rocker & Slide", r(String.raw`toggle|rocker|slide|dip switch|rotary switch|selector|switch`)],
    ],
  },
  {
    group: "Connectors, Wires & Cables",
    match: r(String.raw`connector|cable|wire|jumper|header|terminal|socket|plug|\bjack\b|\busb\b|crocodile|alligator|heat shrink|\bdupont|\bjst\b|\bidc\b`),
    subs: [
      ["Jumper Wires", r(String.raw`jumper|dupont`)],
      ["Heat Shrink & Cable Management", r(String.raw`heat ?shrink|sleev|cable tie|spiral|wrap|cable clip|label`)],
      ["Pin Headers & IC Sockets", r(String.raw`header|ic socket|\bdip socket|\bpins? (male|female)|pogo`)],
      ["Terminal Blocks", r(String.raw`terminal|kf\d|barrier|wago|lever`)],
      ["JST, IDC & Board Connectors", r(String.raw`\bjst\b|\bxh\b|\bph\d|molex|\bidc\b|ribbon|\bfpc\b|\bffc\b|box header|\bsh1\.0`)],
      ["Power Connectors", r(String.raw`dc jack|barrel|xt60|xt30|xt90|deans|anderson|banana|alligator|crocodile|dc plug|power plug`)],
      ["Audio & RF Connectors", r(String.raw`\brca\b|audio jack|3\.5 ?mm|\bsma\b|\bbnc\b|coax|\bu\.fl|ipex`)],
      ["Industrial & Aviation", r(String.raw`aviation|\bgx\d|\bm12\b|\bm8\b|industrial|waterproof connector`)],
      ["USB & Data Cables", r(String.raw`usb|hdmi|type.?c|micro ?usb|ethernet|\brj45|cable`)],
      ["Wire", r(String.raw`wire|awg|silicone|hook.?up|enamel`)],
    ],
  },
  {
    group: "Passive Components",
    match: r(String.raw`resistor|capacitor|inductor|potentiometer|trimmer|crystal|oscillator|\bfuse|varistor|thermistor|ferrite|\bohm\b|\d\s?[unp]f\b|choke|rheostat`),
    subs: [
      ["Resistor & Capacitor Kits", r(String.raw`(resistor|capacitor).*(kit|assort|book|pack|box)|(kit|assort).*(resistor|capacitor)`)],
      ["Potentiometers & Trimmers", r(String.raw`potentiometer|trimmer|\bpot\b|rheostat|3296|variable resistor`)],
      ["Resistor Networks", r(String.raw`resistor network|resistor array|network resistor|\bsip\b`)],
      ["Thermistors & Varistors", r(String.raw`thermistor|\bntc\b|\bptc\b|varistor|\bmov\b`)],
      ["Fuses", r(String.raw`fuse`)],
      ["Resistors (SMD)", r(String.raw`resistor.*(smd|chip|0402|0603|0805|1206|2512)|(smd|chip|0402|0603|0805|1206|2512).*resistor`)],
      ["Power & Wirewound Resistors", r(String.raw`resistor.*(\b[2-9]w\b|\d\dw\b|power|wire ?wound|cement|ceramic|aluminum)|(power|wire ?wound|cement).*resistor`)],
      ["Resistors (Through-hole)", r(String.raw`resistor`)],
      ["Capacitors (SMD)", r(String.raw`capacitor.*(smd|chip|0402|0603|0805|1206)|(smd|chip|0402|0603|0805|1206).*capacitor|tantalum`)],
      ["Electrolytic Capacitors", r(String.raw`electrolytic|\belco\b`)],
      ["Ceramic Capacitors", r(String.raw`ceramic|mlcc|monolithic`)],
      ["Film & Other Capacitors", r(String.raw`capacitor|super ?cap|\d\s?[unp]f\b`)],
      ["Inductors & Ferrites", r(String.raw`inductor|choke|ferrite|coil|\buh\b|\d\s?uh\b|\d\s?mh\b`)],
      ["Crystals & Oscillators", r(String.raw`crystal|oscillator|resonator|mhz|khz`)],
    ],
  },
  {
    group: "ICs & Semiconductors",
    other: "Special Function ICs",
    match: r(String.raw`\bics?\b|integrated circuit|transistor|mosfet|\bigbt|diode|thyristor|triac|optocoupler|op.?amp|\b74(ls|hc|hct)?\d|\blm\d|\bne555|\bcd4\d|\bmax\d|regulator|semiconductor|rectifier|zener|eeprom|\b78\d\d|\b79\d\d|\b1n\d{3,4}`),
    subs: [
      ["Voltage Regulators", r(String.raw`regulator|\b(l|lm|ka|mc|ua)?78[lm]?\d\d|\b(l|lm)?79\d\d|lm317|lm337|ams1117|\bldo\b|\bht7[0-9]`)],
      ["Optocouplers", r(String.raw`opto|pc817|\bmoc\d|photocoupler|\btlp\d|\b4n\d\d`)],
      ["Thyristors & Triacs", r(String.raw`thyristor|triac|\bscr\b|\bbt1\d\d|diac|\bbta\d`)],
      ["MOSFETs & IGBTs", r(String.raw`mosfet|\birf|\birl|igbt|\bao\d{4}|\bfqp|\bstp\d|n-?channel|p-?channel`)],
      ["Transistors", r(String.raw`transistor|\bbjt\b|\b2n\d{3,4}|\bbc\d{3}|\btip\d{2,3}|\bs80\d\d|\b2s[abcd]\d|\bmje|\bbd\d{3}|darlington`)],
      ["Diodes & Rectifiers", r(String.raw`diode|rectifier|\b1n\d{3,4}|zener|schottky|bridge|\btvs\b|\bfr\d0\d|\buf\d0\d`)],
      ["Op-Amps & Comparators", r(String.raw`op.?amp|operational|comparator|lm358|lm324|tl07|tl08|ne5532|lm393|lm339|lm741|ua741|\bopa\d|ad8\d\d`)],
      ["Timers", r(String.raw`\b(ne)?55[56]\b|timer`)],
      ["Logic ICs", r(String.raw`\b(sn)?74(ls|hc|hct|f|s|ac|act|lv|lvc)?\d{2,3}|\bcd4\d{3}|\bhef4\d|\bmc14\d{3}|\bhcf4\d|\b4[05]\d{2}b?\b|40xx|45xx|\bttl\b|\bcmos\b|40 series|74 series|logic|gate|flip.?flop|counter|decoder|shift register|multiplexer|latch|buffer`)],
      ["Memory", r(String.raw`eeprom|\bflash\b|sram|\b24c\d|\bat24|w25q|memory|\b93c\d`)],
      ["Interface & Communication", r(String.raw`max232|max485|max3232|rs485|rs232|ch340|cp210|ft232|\bcan\b|uart|usb.?to|transceiver|\bi2c\b|pl2303|mcp2515|sn65`)],
      ["Power, PWM & Driver ICs", r(String.raw`driver|uln200|l293|ir21\d\d|pwm|uc[23]8\d\d|tl494|ka7500|sg3525|\bmc34063|\blm25\d\d|\bxl\d{4}|\bmp\d{4}|controller|\bviper|\btop2\d\d|\btny\d|\blnk\d|icl7660|charger|\btp40\d\d|switching regulator|smps`)],
      ["Audio ICs", r(String.raw`lm386|\btda\d|amplifier|audio|\bpam\d|\btpa\d`)],
      ["Microcontroller ICs", r(String.raw`atmega|attiny|\bpic\d|stm32|\besp32-|microcontroller|\bmcu\b`)],
      ["Sensor & ADC/DAC ICs", r(String.raw`adc|dac|\bads1|\bmcp4|sensor|\bmax6675|\bds18`)],
    ],
  },
  {
    group: "Prototyping & Enclosures",
    match: r(String.raw`breadboard|\bpcb|perf.?board|prototyp|enclosure|\bbox\b|\bcase\b|heatsink|heat sink|spacer|standoff|copper clad`),
    subs: [
      ["Breadboards", r(String.raw`breadboard`)],
      ["PCBs & Perfboards", r(String.raw`\bpcb|perf.?board|strip ?board|copper clad|prototype board|universal board|veroboard|dot board`)],
      ["Heatsinks", r(String.raw`heat ?sink|thermal pad|thermal paste`)],
      ["Spacers & Standoffs", r(String.raw`spacer|standoff`)],
      ["Enclosures & Boxes", r(String.raw`enclosure|\bbox\b|\bcase\b|housing|cabinet`)],
    ],
  },
  {
    group: "Robotics & Mechanical",
    match: r(String.raw`robot|chassis|wheel|gear|bearing|pulley|belt|coupling|shaft|linear rail|aluminum profile|lead screw|\bkit\b|screw|\bnut\b|spring`),
    subs: [
      ["Robot Kits & Chassis", r(String.raw`robot|chassis|car kit|\barm\b|\bkit\b`)],
      ["Wheels & Tracks", r(String.raw`wheel|track|caster|tire|tyre`)],
      ["Gears, Pulleys & Belts", r(String.raw`gear|pulley|belt|sprocket`)],
      ["Bearings, Shafts & Couplings", r(String.raw`bearing|shaft|coupl|bushing|rod`)],
      ["Linear Motion & Profiles", r(String.raw`linear|rail|profile|lead ?screw|slide|v-?slot`)],
      ["Screws, Nuts & Hardware", r(String.raw`screw|\bnuts?\b|bolt|washer|spring|rivet|hinge|bracket`)],
    ],
  },
];

const OTHER = "Other";

/**
 * Classify a product. Every group is scored by how many of the product's names (weight 2) and
 * store categories (weight 1) it matches; ties go to the earlier, more specific group. Store
 * categories alone can mislead ("Spare Parts & Tools" holding 3D printer nozzles), names alone
 * can be terse, so both vote. The subgroup is then picked from the names first.
 */
export function classify(categories, names) {
  let entry = null;
  let best = 0;
  for (const e of TAXONOMY) {
    const score =
      2 * names.filter((n) => e.match.test(n)).length + categories.filter((c) => e.match.test(c)).length;
    if (score > best) [entry, best] = [e, score];
  }
  if (!entry) return { group: OTHER, sub: null };
  for (const text of [...names, ...categories]) {
    const sub = entry.subs.find(([, re]) => re.test(text));
    if (sub) return { group: entry.group, sub: sub[0] };
  }
  return { group: entry.group, sub: entry.other ?? `Other ${entry.group}` };
}
