import type { TouristDestination } from '../components/Board';

export const initialCities: TouristDestination[] = [
  {
    name: 'Paris',
    columns: [
      {
        id: 'paris_top',
        title: 'Top Attractions',
        tasks: [
          {
            id: 1, mustVisit: true, stable: true, isTraditional: true, isCountrywide: false,
            name: 'Eiffel Tower', address: 'Champ de Mars, 5 Av. Anatole France, 75007 Paris', category: 'POINT_OF_INTEREST_AND_LANDMARK', infoFrom: 'Official site + guides', note: 'Book summit tickets in advance; best at sunset', VisitTime: '1.5–2h'
          },
          {
            id: 2, mustVisit: true, stable: true, isTraditional: true, isCountrywide: false,
            name: 'Louvre Museum', address: 'Rue de Rivoli, 75001 Paris', category: 'ART_MUSEUM', infoFrom: 'Official site; audio guide', note: 'Closed Tue; arrive early; focus on Denon wing', workingHours: '09:00–18:00 (Fri late 21:00)', VisitTime: '3–4h'
          },
          {
            id: 3, mustVisit: true, stable: false, isTraditional: true, isCountrywide: false,
            name: 'Cathédrale Notre-Dame de Paris', address: '6 Parvis Notre-Dame, 75004 Paris', category: 'RELIGIOUS_SITE', infoFrom: 'City updates', note: 'Restoration ongoing; view from Pont au Double', workingHours: 'Exterior accessible; interior reopening timeline', VisitTime: '30–45m'
          }
        ]
      },
      {
        id: 'paris_secondary',
        title: 'Secondary Spots',
        tasks: [
          {
            id: 4, mustVisit: false, stable: true, isTraditional: true, isCountrywide: false,
            name: 'Montmartre & Sacré-Cœur', address: '35 Rue du Chevalier de la Barre, 75018 Paris', category: 'RELIGIOUS_SITE', infoFrom: 'Walking guides', note: 'View at dusk; avoid tourist traps on Place du Tertre', VisitTime: '1.5–2h'
          },
          {
            id: 5, mustVisit: false, stable: true, isTraditional: false, isCountrywide: false,
            name: 'Musée d’Orsay', address: '1 Rue de la Légion d’Honneur, 75007 Paris', category: 'ART_MUSEUM', infoFrom: 'Official site', note: 'Impressionists highlight; Mon closed', VisitTime: '2–3h'
          },
          {
            id: 6, mustVisit: false, stable: true, isTraditional: false, isCountrywide: true,
            name: 'Seine River Cruise', address: 'Quai de la Bourdonnais, 75007 Paris', category: 'WATER_BASED_ACTIVITY', infoFrom: 'Operators websites', note: 'Night cruise for lights; sit starboard for Eiffel views', optimalVisitPeriod: '01 Jan - 30 Mar', workingHours: 'Frequent departures; evening best', VisitTime: '1h'
          }
        ]
      },
      {
        id: 'paris_excluded',
        title: 'Excluded Attractions',
        tasks: [
          {
            id: 7, mustVisit: false, stable: true, isTraditional: false, isCountrywide: false,
            name: 'La Défense Grande Arche', address: '1 Parvis de La Défense, 92800 Puteaux', category: 'OTHER_LANDMARK', infoFrom: 'Blogs', note: 'Skip due to time; far from core sights', VisitTime: '—'
          },
          {
            id: 8, mustVisit: false, stable: true, isTraditional: false, isCountrywide: false,
            name: 'Galeries Lafayette Rooftop (alternative view)', address: '25 Rue de la Chaussée d’Antin, 75009 Paris', category: 'VIEWPOINT', infoFrom: 'Store site', note: '', VisitTime: '20m'
          }
        ]
      }
    ]
  },
  {
    name: 'London',
    columns: [
      {
        id: 'london_top', title: 'Top Attractions', tasks: [
          { id: 9, mustVisit: true, stable: true, isTraditional: true, isCountrywide: false, name: 'Tower of London', address: 'Tower Hill, London EC3N 4AB', category: 'HISTORIC_SITE', infoFrom: 'Official site', note: 'Book tickets; join Yeoman Warder tour', VisitTime: '2–3h' }
        ] },
      {
        id: 'london_secondary', title: 'Secondary Spots', tasks: [
          { id: 10, mustVisit: false, stable: true, isTraditional: false, isCountrywide: false, name: 'Borough Market', address: '8 Southwark St, London SE1 1TL', category: 'FOOD', infoFrom: 'Market site', note: 'Best weekday mornings', VisitTime: '1–1.5h' }
        ] },
      {
        id: 'london_excluded', title: 'Excluded Attractions', tasks: [
          { id: 11, mustVisit: false, stable: true, isTraditional: true, isCountrywide: false, name: 'Madame Tussauds', address: 'Marylebone Rd, London NW1 5LR', category: 'SPECIALITY_MUSEUM', infoFrom: 'Guides', note: 'Skipping due to time', VisitTime: '—' }
        ] }
    ]
  }
];
