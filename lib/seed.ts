import Database from "better-sqlite3";

// ── CIP-to-SOC crosswalk ──────────────────────────────────────────────────
const CROSSWALK = [
  { cip_code: "11.0701", cip_title: "Computer Science",        soc_code: "15-1252", soc_title: "Software Developers" },
  { cip_code: "11.0701", cip_title: "Computer Science",        soc_code: "15-1211", soc_title: "Computer Systems Analysts" },
  { cip_code: "14.0901", cip_title: "Computer Engineering",    soc_code: "17-2061", soc_title: "Computer Hardware Engineers" },
  { cip_code: "51.3801", cip_title: "Registered Nursing",      soc_code: "29-1141", soc_title: "Registered Nurses" },
  { cip_code: "52.0101", cip_title: "Business Administration", soc_code: "11-1021", soc_title: "General & Operations Managers" },
  { cip_code: "52.0301", cip_title: "Accounting",              soc_code: "13-2011", soc_title: "Accountants and Auditors" },
  { cip_code: "27.0501", cip_title: "Statistics",              soc_code: "15-2041", soc_title: "Statisticians" },
  { cip_code: "15.1501", cip_title: "Data Analytics/Science",  soc_code: "15-2051", soc_title: "Data Scientists" },
  { cip_code: "11.0103", cip_title: "Information Technology",  soc_code: "15-1232", soc_title: "Computer User Support Specialists" },
  { cip_code: "13.0101", cip_title: "Education, General",      soc_code: "25-2021", soc_title: "Elementary School Teachers" },
];

// ── Institutions ──────────────────────────────────────────────────────────
// `share` sets each institution's fraction of the state+inst_type completion
// total. Institutions without a share use INST_SHARES[idx] as fallback.
const INSTITUTIONS: Array<{ id: string; name: string; city: string; state: string; inst_type: "4yr" | "2yr"; share?: number }> = [
  { id: "CA-01", name: "University of California",           city: "Oakland",           state: "CA", inst_type: "4yr" },
  { id: "CA-02", name: "California State University",        city: "Long Beach",        state: "CA", inst_type: "4yr" },
  { id: "CA-03", name: "Los Angeles Community College",      city: "Los Angeles",       state: "CA", inst_type: "2yr" },
  // UT System campuses — shares reflect relative enrollment size
  { id: "TX-UT-AUS", name: "University of Texas at Austin",           city: "Austin",      state: "TX", inst_type: "4yr", share: 0.22 },
  { id: "TX-UT-SA",  name: "University of Texas at San Antonio",      city: "San Antonio", state: "TX", inst_type: "4yr", share: 0.13 },
  { id: "TX-UT-DAL", name: "University of Texas at Dallas",           city: "Richardson",  state: "TX", inst_type: "4yr", share: 0.12 },
  { id: "TX-UT-ARL", name: "University of Texas at Arlington",        city: "Arlington",   state: "TX", inst_type: "4yr", share: 0.11 },
  { id: "TX-UT-EP",  name: "University of Texas at El Paso",          city: "El Paso",     state: "TX", inst_type: "4yr", share: 0.10 },
  { id: "TX-UT-RGV", name: "University of Texas - Rio Grande Valley", city: "Edinburg",    state: "TX", inst_type: "4yr", share: 0.09 },
  { id: "TX-TAMU",   name: "Texas A&M University",                    city: "College Station", state: "TX", inst_type: "4yr", share: 0.15 },
  { id: "TX-UT-TYL", name: "University of Texas at Tyler",            city: "Tyler",       state: "TX", inst_type: "4yr", share: 0.05 },
  { id: "TX-UT-PB",  name: "University of Texas Permian Basin",       city: "Odessa",      state: "TX", inst_type: "4yr", share: 0.03 },
  { id: "TX-HCC",    name: "Houston Community College",               city: "Houston",     state: "TX", inst_type: "2yr" },
  { id: "NY-01", name: "State University of New York",        city: "Albany",            state: "NY", inst_type: "4yr" },
  { id: "NY-02", name: "Columbia University",                 city: "New York",          state: "NY", inst_type: "4yr" },
  { id: "NY-03", name: "City University of New York",         city: "New York",          state: "NY", inst_type: "2yr" },
  { id: "FL-01", name: "University of Florida",               city: "Gainesville",       state: "FL", inst_type: "4yr" },
  { id: "FL-02", name: "Florida State University",            city: "Tallahassee",       state: "FL", inst_type: "4yr" },
  { id: "FL-03", name: "Miami Dade College",                  city: "Miami",             state: "FL", inst_type: "2yr" },
  { id: "WA-01", name: "University of Washington",            city: "Seattle",           state: "WA", inst_type: "4yr" },
  { id: "WA-02", name: "Washington State University",         city: "Pullman",           state: "WA", inst_type: "4yr" },
  { id: "WA-03", name: "Bellevue College",                    city: "Bellevue",          state: "WA", inst_type: "2yr" },
  { id: "IL-01", name: "University of Illinois",              city: "Urbana-Champaign",  state: "IL", inst_type: "4yr" },
  { id: "IL-02", name: "Northwestern University",             city: "Evanston",          state: "IL", inst_type: "4yr" },
  { id: "IL-03", name: "Oakton Community College",            city: "Des Plaines",       state: "IL", inst_type: "2yr" },
  { id: "PA-01", name: "Penn State University",               city: "University Park",   state: "PA", inst_type: "4yr" },
  { id: "PA-02", name: "University of Pennsylvania",          city: "Philadelphia",      state: "PA", inst_type: "4yr" },
  { id: "PA-03", name: "Community College of Philadelphia",   city: "Philadelphia",      state: "PA", inst_type: "2yr" },
  { id: "OH-01", name: "Ohio State University",               city: "Columbus",          state: "OH", inst_type: "4yr" },
  { id: "OH-02", name: "Case Western Reserve University",     city: "Cleveland",         state: "OH", inst_type: "4yr" },
  { id: "OH-03", name: "Cuyahoga Community College",          city: "Cleveland",         state: "OH", inst_type: "2yr" },
  { id: "GA-01", name: "University of Georgia",               city: "Athens",            state: "GA", inst_type: "4yr" },
  { id: "GA-02", name: "Georgia Institute of Technology",     city: "Atlanta",           state: "GA", inst_type: "4yr" },
  { id: "GA-03", name: "Georgia Piedmont Technical College",  city: "Clarkston",         state: "GA", inst_type: "2yr" },
  { id: "MA-01", name: "Harvard University",                  city: "Cambridge",         state: "MA", inst_type: "4yr" },
  { id: "MA-02", name: "Massachusetts Institute of Technology", city: "Cambridge",       state: "MA", inst_type: "4yr" },
  { id: "MA-03", name: "Bunker Hill Community College",       city: "Charlestown",       state: "MA", inst_type: "2yr" },
];

// Institution share weights within a state+inst_type group (first inst is larger)
const INST_SHARES = [0.50, 0.35, 0.15];

// ── National base completions (2019) and annual growth rates ──────────────
const CIP_BASE: Record<string, { base: number; growth: number; inst: "4yr" | "2yr" | "both" }> = {
  "11.0701": { base: 65_000,  growth: 0.14,  inst: "4yr"  },
  "14.0901": { base: 12_000,  growth: 0.08,  inst: "4yr"  },
  "51.3801": { base: 165_000, growth: 0.04,  inst: "both" },
  "52.0101": { base: 200_000, growth: 0.01,  inst: "both" },
  "52.0301": { base: 55_000,  growth: -0.02, inst: "4yr"  },
  "27.0501": { base: 4_500,   growth: 0.11,  inst: "4yr"  },
  "15.1501": { base: 8_000,   growth: 0.33,  inst: "both" },
  "11.0103": { base: 18_000,  growth: 0.05,  inst: "both" },
  "13.0101": { base: 45_000,  growth: -0.04, inst: "4yr"  },
  "45.0601": { base: 22_000,  growth: 0.04,  inst: "4yr"  },
};

// ── National base employment (2019) + growth + wages ─────────────────────
const SOC_BASE: Record<string, { base: number; growth: number; wage: number }> = {
  "15-1252": { base: 1_500_000, growth: 0.22,  wage: 127_260 },
  "15-1211": { base:   650_000, growth: 0.10,  wage:  99_270 },
  "17-2061": { base:    75_000, growth: 0.05,  wage: 120_100 },
  "29-1141": { base: 2_900_000, growth: 0.06,  wage:  82_750 },
  "11-1021": { base: 2_200_000, growth: 0.03,  wage: 110_196 },
  "13-2011": { base: 1_350_000, growth: 0.01,  wage:  79_880 },
  "15-2041": { base:    42_000, growth: 0.33,  wage:  95_570 },
  "15-2051": { base:    32_000, growth: 0.36,  wage: 103_500 },
  "15-1232": { base:   850_000, growth: 0.09,  wage:  57_910 },
  "25-2021": { base: 1_400_000, growth: -0.02, wage:  65_090 },
};

const STATE_SHARES: Record<string, number> = {
  CA: 0.12, TX: 0.09, NY: 0.07, FL: 0.06, WA: 0.04,
  IL: 0.04, PA: 0.04, OH: 0.03, GA: 0.03, MA: 0.03,
};

const YEARS = [2019, 2020, 2021, 2022, 2023];

function jitter(n: number, pct = 0.05): number {
  return Math.round(n * (1 + (Math.random() - 0.5) * pct));
}

export function seedDatabase(db: Database.Database) {
  const alreadySeeded = db
    .prepare("SELECT COUNT(*) as cnt FROM ipeds_completions")
    .get() as { cnt: number };
  if (alreadySeeded.cnt > 0) return;

  console.log("Seeding database...");

  // ── Crosswalk ─────────────────────────────────────────────────────────────
  const insertCrosswalk = db.prepare(
    `INSERT OR IGNORE INTO cip_soc_crosswalk (cip_code, cip_title, soc_code, soc_title)
     VALUES (:cip_code, :cip_title, :soc_code, :soc_title)`
  );
  for (const row of CROSSWALK) insertCrosswalk.run(row);

  // ── Institutions ──────────────────────────────────────────────────────────
  const insertInst = db.prepare(
    `INSERT OR IGNORE INTO institutions (id, name, city, state, inst_type)
     VALUES (:id, :name, :city, :state, :inst_type)`
  );
  for (const inst of INSTITUTIONS) insertInst.run(inst);

  // ── IPEDS completions — institution level ─────────────────────────────────
  const insertCompletion = db.prepare(
    `INSERT INTO ipeds_completions
       (year, state, inst_type, institution_id, institution_name, cip_code, cip_title, completions)
     VALUES
       (:year, :state, :inst_type, :institution_id, :institution_name, :cip_code, :cip_title, :completions)`
  );

  const cipTitles: Record<string, string> = Object.fromEntries(
    CROSSWALK.map((r) => [r.cip_code, r.cip_title])
  );
  cipTitles["45.0601"] = "Economics";

  // Group institutions by state + inst_type
  const instGroups: Record<string, typeof INSTITUTIONS> = {};
  for (const inst of INSTITUTIONS) {
    const key = `${inst.state}-${inst.inst_type}`;
    if (!instGroups[key]) instGroups[key] = [];
    instGroups[key].push(inst);
  }

  for (const [cip_code, cfg] of Object.entries(CIP_BASE)) {
    const instTypes: Array<"2yr" | "4yr"> =
      cfg.inst === "both" ? ["4yr", "2yr"] : [cfg.inst as "4yr" | "2yr"];

    for (const [state, stateShare] of Object.entries(STATE_SHARES)) {
      for (const inst_type of instTypes) {
        const instShare = inst_type === "2yr" ? 0.3 : 0.7;
        const groupKey = `${state}-${inst_type}`;
        const insts = instGroups[groupKey] ?? [];

        for (let i = 0; i < YEARS.length; i++) {
          const year = YEARS[i];
          const national = Math.round(cfg.base * Math.pow(1 + cfg.growth, i));
          const stateTotal = Math.round(national * stateShare * instShare);

          insts.forEach((inst, idx) => {
            const share = inst.share ?? INST_SHARES[idx] ?? 0.15;
            const completions = jitter(Math.round(stateTotal * share), 0.08);
            insertCompletion.run({
              year,
              state,
              inst_type,
              institution_id:   inst.id,
              institution_name: inst.name,
              cip_code,
              cip_title: cipTitles[cip_code] ?? cip_code,
              completions: Math.max(1, completions),
            });
          });
        }
      }
    }
  }

  // ── BLS employment ────────────────────────────────────────────────────────
  const insertEmployment = db.prepare(
    `INSERT INTO bls_employment (year, state, soc_code, soc_title, employment, mean_wage)
     VALUES (:year, :state, :soc_code, :soc_title, :employment, :mean_wage)`
  );

  const socTitles: Record<string, string> = Object.fromEntries(
    CROSSWALK.map((r) => [r.soc_code, r.soc_title])
  );

  for (const [soc_code, cfg] of Object.entries(SOC_BASE)) {
    for (const [state, share] of Object.entries(STATE_SHARES)) {
      for (let i = 0; i < YEARS.length; i++) {
        const year = YEARS[i];
        const national  = Math.round(cfg.base * Math.pow(1 + cfg.growth, i));
        const wageGrowth = Math.round(cfg.wage * Math.pow(1.03, i));
        insertEmployment.run({
          year,
          state,
          soc_code,
          soc_title:  socTitles[soc_code] ?? soc_code,
          employment: jitter(Math.round(national * share)),
          mean_wage:  jitter(wageGrowth, 0.02),
        });
      }
    }
  }

  console.log("Database seeded.");
}
