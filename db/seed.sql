-- OpenMiami_OSS — Starter seed data (30 records)
-- License: MIT
--
-- PROVENANCE NOTE:
--   Per project policy: every record has a real `source_url`, but we do NOT
--   invent phone numbers or street addresses. Where physical address/phone
--   were not independently verifiable from the source URL at seed time,
--   `contact` contains only the website and `location` is NULL.
--   Moderators should geocode and enrich each record after live verification
--   against the source URL before marketing the data publicly.
--
--   `verified_at` is set to now() because the org + URL pairing is what we
--   are asserting, not a complete contact record.
--
-- Run AFTER schema.sql.

begin;

-- Make sure inserts go through normal triggers (audit + updated_at).
-- (No `set local role` — assumes service role / migration context.)

-- ============================================================
-- 5 — Little Haiti Revitalization Trust (LHRT) programs
-- Source root: https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust
-- ============================================================

insert into public.resources (name, provider_type, category, description, eligibility, languages, contact, source_url, verified_at) values
('Little Haiti Revitalization Trust',
 'lhrt', 'civic_311',
 'City of Miami board chartered to coordinate anti-displacement, cultural preservation, and economic development investments in the Little Haiti neighborhood.',
 '{}'::jsonb,
 array['en','ht','fr'],
 jsonb_build_object('website','https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust'),
 'https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust',
 now()),

('LHRT Small Business Support Program',
 'lhrt', 'small_business',
 'Grants and technical assistance for legacy and startup small businesses operating within the Little Haiti boundary established by the Trust.',
 jsonb_build_object('geography','Little Haiti boundary','business_size','micro_to_small'),
 array['en','ht','fr'],
 jsonb_build_object('website','https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust'),
 'https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust',
 now()),

('LHRT Homeowner Anti-Displacement Assistance',
 'lhrt', 'housing',
 'Programs aimed at helping legacy Little Haiti homeowners stay in their homes amid rising property pressure.',
 jsonb_build_object('geography','Little Haiti boundary','tenure','homeowner'),
 array['en','ht','fr'],
 jsonb_build_object('website','https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust'),
 'https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust',
 now()),

('LHRT Cultural Preservation Programs',
 'lhrt', 'arts_culture',
 'Funding and programming for Haitian-American artists, cultural events, and venues anchoring Little Haiti identity.',
 '{}'::jsonb,
 array['en','ht','fr'],
 jsonb_build_object('website','https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust'),
 'https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust',
 now()),

('LHRT Land & Property Strategy',
 'lhrt', 'housing',
 'Acquisition, banking, and disposition of land within the Little Haiti boundary to advance affordable housing and community-serving uses.',
 jsonb_build_object('geography','Little Haiti boundary'),
 array['en','ht','fr'],
 jsonb_build_object('website','https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust'),
 'https://www.miamigov.com/Government/Boards-Committees/Little-Haiti-Revitalization-Trust',
 now());

-- ============================================================
-- 10 — Miami-Dade County / 311 services
-- ============================================================

insert into public.resources (name, provider_type, category, description, eligibility, languages, contact, source_url, verified_at) values
('Miami-Dade 311 Contact Center',
 'miami_dade_311', 'civic_311',
 'Single non-emergency entry point for Miami-Dade County services, complaints, and information. Dial 311 from inside the county.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miamidade.gov/global/help/contact/general-information.page'),
 'https://www.miamidade.gov/global/help/contact/general-information.page',
 now()),

('Miami-Dade Solid Waste — Bulky Trash Pickup',
 'miami_dade_county', 'civic_311',
 'Scheduled bulky waste pickup for unincorporated Miami-Dade and participating municipalities, requested through 311.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miamidade.gov/global/solidwaste/home.page'),
 'https://www.miamidade.gov/global/solidwaste/home.page',
 now()),

('Miami-Dade Water and Sewer Department — Customer Service',
 'miami_dade_county', 'utilities',
 'Account, billing, leak, and service questions for Miami-Dade water and sewer customers.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miamidade.gov/global/water/home.page'),
 'https://www.miamidade.gov/global/water/home.page',
 now()),

('Miami-Dade Animal Services',
 'miami_dade_county', 'civic_311',
 'Pet adoption, lost & found, licensing, and animal welfare reports for Miami-Dade County.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miamidade.gov/global/animals/home.page'),
 'https://www.miamidade.gov/global/animals/home.page',
 now()),

('Miami-Dade Code Enforcement',
 'miami_dade_county', 'civic_311',
 'Reports and actions for code violations, illegal dumping, and unsafe property conditions in unincorporated Miami-Dade.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miamidade.gov/global/economy/code-enforcement.page'),
 'https://www.miamidade.gov/global/economy/code-enforcement.page',
 now()),

('Miami-Dade Public Housing and Community Development',
 'miami_dade_county', 'housing',
 'Public housing applications, Section 8 / Housing Choice Voucher program, and affordable housing development for Miami-Dade.',
 jsonb_build_object('income','low_to_moderate'),
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miamidade.gov/global/housing/home.page'),
 'https://www.miamidade.gov/global/housing/home.page',
 now()),

('Miami-Dade Community Action and Human Services Department (CAHSD)',
 'miami_dade_county', 'civic_311',
 'Anti-poverty, Head Start, energy assistance (LIHEAP), elder, and crisis services for Miami-Dade residents.',
 jsonb_build_object('income','low_to_moderate'),
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miamidade.gov/global/socialservices/home.page'),
 'https://www.miamidade.gov/global/socialservices/home.page',
 now()),

('Miami-Dade Homeless Trust',
 'miami_dade_county', 'housing',
 'Coordinated entry, outreach, and shelter access for residents experiencing homelessness in Miami-Dade County.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://www.homelesstrust.org/'),
 'https://www.homelesstrust.org/',
 now()),

('Miami-Dade Public Library System',
 'miami_dade_county', 'education',
 'Free library cards, computer and internet access, ESOL classes, and community programming across 49+ branches countywide.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://mdpls.org/'),
 'https://mdpls.org/',
 now()),

('Miami-Dade Transit / GO Miami-Dade',
 'miami_dade_county', 'transit',
 'Metrobus, Metrorail, Metromover, and paratransit services across Miami-Dade. Trip planning and EASY Card support.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miamidade.gov/global/transportation/home.page'),
 'https://www.miamidade.gov/global/transportation/home.page',
 now());

-- ============================================================
-- 5 — City of Miami small business resources
-- ============================================================

insert into public.resources (name, provider_type, category, description, eligibility, languages, contact, source_url, verified_at) values
('City of Miami Mom and Pop Small Business Grant Program',
 'city_of_miami', 'small_business',
 'District-administered grants to small, owner-operated businesses inside the City of Miami for equipment, rent assistance, and improvements.',
 jsonb_build_object('geography','City of Miami','business_size','mom_and_pop'),
 array['en','es','ht'],
 jsonb_build_object('website','https://www.miami.gov/'),
 'https://www.miami.gov/',
 now()),

('Miami Bayside Foundation — Minority Business Loans and Grants',
 'nonprofit', 'small_business',
 'Low-interest loans, grants, and scholarships supporting minority-owned small businesses and students within the City of Miami.',
 jsonb_build_object('city','Miami','ownership','minority'),
 array['en','es','ht'],
 jsonb_build_object('website','https://miamibaysidefoundation.org/'),
 'https://miamibaysidefoundation.org/',
 now()),

('The Beacon Council — Miami-Dade Economic Development',
 'nonprofit', 'small_business',
 'Official public-private economic development partnership for Miami-Dade County. Business retention, expansion, and small-biz navigation.',
 '{}'::jsonb,
 array['en','es'],
 jsonb_build_object('website','https://www.beaconcouncil.com/'),
 'https://www.beaconcouncil.com/',
 now()),

('Prospera (formerly Hispanic Business Initiative Fund)',
 'nonprofit', 'small_business',
 'Free bilingual business consulting, training, and capital access for Hispanic entrepreneurs across Florida.',
 jsonb_build_object('language_focus','spanish'),
 array['en','es'],
 jsonb_build_object('website','https://prosperausa.org/'),
 'https://prosperausa.org/',
 now()),

('SCORE Miami-Dade',
 'nonprofit', 'small_business',
 'Free mentoring, workshops, and templates for small business owners and aspiring entrepreneurs, delivered by volunteer business mentors.',
 '{}'::jsonb,
 array['en','es'],
 jsonb_build_object('website','https://miami.score.org/'),
 'https://miami.score.org/',
 now());

-- ============================================================
-- 5 — Health & food nonprofits
-- ============================================================

insert into public.resources (name, provider_type, category, description, eligibility, languages, contact, source_url, verified_at) values
('Camillus Health Concern',
 'nonprofit', 'health',
 'Federally Qualified Health Center providing primary medical, dental, behavioral health, and HIV care for low-income and homeless residents.',
 jsonb_build_object('income','low','status','any_including_homeless'),
 array['en','es','ht'],
 jsonb_build_object('website','https://www.camillushealth.org/'),
 'https://www.camillushealth.org/',
 now()),

('Borinquen Medical Centers of Miami-Dade',
 'nonprofit', 'health',
 'FQHC network offering primary care, OB/GYN, pediatrics, behavioral health, dental, and pharmacy on a sliding-fee scale.',
 jsonb_build_object('income','sliding_scale'),
 array['en','es','ht'],
 jsonb_build_object('website','https://www.borinquenhealth.org/'),
 'https://www.borinquenhealth.org/',
 now()),

('Feeding South Florida',
 'nonprofit', 'food',
 'Regional food bank serving Palm Beach, Broward, Miami-Dade, and Monroe counties. Operates pantries, mobile distributions, and SNAP outreach.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://feedingsouthflorida.org/'),
 'https://feedingsouthflorida.org/',
 now()),

('Farm Share',
 'nonprofit', 'food',
 'Statewide Florida food bank with regular fresh-produce distributions in Miami-Dade. Find-a-distribution tool on the website.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://farmshare.org/'),
 'https://farmshare.org/',
 now()),

('Sant La Haitian Neighborhood Center',
 'nonprofit', 'health',
 'Health navigation, immigration support, citizenship classes, and benefits enrollment serving the Haitian community of South Florida.',
 '{}'::jsonb,
 array['en','ht','fr'],
 jsonb_build_object('website','https://santla.org/'),
 'https://santla.org/',
 now());

-- ============================================================
-- 5 — Arts, culture, and climate organizations
-- ============================================================

insert into public.resources (name, provider_type, category, description, eligibility, languages, contact, source_url, verified_at) values
('Little Haiti Cultural Complex',
 'city_of_miami', 'arts_culture',
 'City of Miami arts venue featuring the Caribbean Marketplace, gallery, and performing arts programming celebrating Caribbean and Haitian culture.',
 '{}'::jsonb,
 array['en','ht','fr','es'],
 jsonb_build_object('website','https://www.miamigov.com/Government/Departments-Organizations/Parks-Recreation/Find-A-Park/Cultural-Centers/Little-Haiti-Cultural-Complex'),
 'https://www.miamigov.com/Government/Departments-Organizations/Parks-Recreation/Find-A-Park/Cultural-Centers/Little-Haiti-Cultural-Complex',
 now()),

('Bakehouse Art Complex',
 'nonprofit', 'arts_culture',
 'Wynwood-area artist studios and exhibition space; long-running affordable studio program for working visual artists in Miami.',
 '{}'::jsonb,
 array['en','es'],
 jsonb_build_object('website','https://bacfl.org/'),
 'https://bacfl.org/',
 now()),

('O Cinema',
 'nonprofit', 'arts_culture',
 'Independent nonprofit cinema presenting documentaries, foreign-language film, and community programming.',
 '{}'::jsonb,
 array['en','es'],
 jsonb_build_object('website','https://www.o-cinema.org/'),
 'https://www.o-cinema.org/',
 now()),

('The CLEO Institute',
 'nonprofit', 'climate_resilience',
 'Climate education, advocacy, and resilience programming with multilingual outreach in South Florida.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://cleoinstitute.org/'),
 'https://cleoinstitute.org/',
 now()),

('Catalyst Miami',
 'nonprofit', 'climate_resilience',
 'Economic and climate-justice nonprofit running CLEAR (Community Leadership on the Environment, Advocacy & Resilience) and financial-coaching cohorts.',
 '{}'::jsonb,
 array['en','es','ht'],
 jsonb_build_object('website','https://www.catalystmiami.org/'),
 'https://www.catalystmiami.org/',
 now());

commit;
